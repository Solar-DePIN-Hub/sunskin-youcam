// POST /api/analyze  { image: dataURL }  -> YouCam AI Skin Analysis scores
// Server-side only: the YouCam key lives in env YOUCAM_API_KEY, never in the browser.
const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";
const ACTIONS = ["wrinkle", "pore", "texture", "acne", "redness", "oiliness", "moisture", "radiance", "age_spot", "dark_circle_v2"];

export const config = { api: { bodyParser: { sizeLimit: "8mb" } }, maxDuration: 60 };

async function yc(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`YouCam ${path} ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.YOUCAM_API_KEY) return res.status(200).json({ demo: true, reason: "no_key" });
  try {
    const m = /^data:(image\/\w+);base64,(.+)$/.exec((req.body && req.body.image) || "");
    if (!m) return res.status(400).json({ error: "send image as data URL" });
    const buf = Buffer.from(m[2], "base64");
    const t0 = Date.now();
    const f = await yc("/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: m[1], file_name: "selfie.jpg", file_size: buf.length }] }) });
    const file = (f.data && f.data.files ? f.data.files : f.files)[0];
    const req0 = file.requests[0];
    await fetch(req0.url, { method: req0.method || "PUT", headers: req0.headers || { "Content-Type": m[1] }, body: buf });
    const t = await yc("/task/skin-analysis", { method: "POST", body: JSON.stringify({ src_file_id: file.file_id, dst_actions: ACTIONS, miniserver_args: { enable_mask_overlay: true }, format: "json" }) });
    const id = (t.data || t).task_id;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const s = await yc(`/task/skin-analysis/${id}`);
      const d = s.data || s;
      if (d.task_status === "success") return res.status(200).json({ demo: false, ms: Date.now() - t0, result: d.results || d });
      if (d.task_status === "error") return res.status(502).json({ error: d.error || "task error" });
    }
    res.status(504).json({ error: "timeout" });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
