// POST /api/analyze  { image: dataURL, tone?: bool, aging?: bool }
// Server-side only: the YouCam key lives in env YOUCAM_API_KEY, never in the browser.
// One upload, then up to 3 YouCam tasks run in parallel on the same file:
//   1. AI Skin Analysis (10 SD concerns + mask overlays)   ~14 units
//   2. AI Skin Tone Analysis (skin colour -> tinted-SPF shade) 20 units (optional)
//   3. AI Aging Simulation (future-face preview)               2 units (optional)
const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";
const ACTIONS = ["wrinkle", "pore", "texture", "acne", "redness", "oiliness", "moisture", "radiance", "age_spot", "dark_circle_v2"];

export const config = { api: { bodyParser: { sizeLimit: "8mb" } }, maxDuration: 60 };

async function yc(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`YouCam ${path.split("/").slice(0, 3).join("/")} ${r.status}: ${JSON.stringify(j.error || j.message || j).slice(0, 160)}`);
  return j;
}

// Start a task, then poll every 2 s until success/error or the deadline.
async function runTask(name, body, deadline) {
  const t = await yc(`/task/${name}`, { method: "POST", body: JSON.stringify(body) });
  const id = (t.data || t).task_id;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await yc(`/task/${name}/${id}`);
    const d = s.data || s;
    if (d.task_status === "success") return d.results || d;
    if (d.task_status === "error") throw new Error(`${name}: ${d.error || d.error_message || "task error"}`);
  }
  throw new Error(`${name}: timeout`);
}

// Collect every image URL in a result object (the aging result is a set of generated photos).
export function imageUrls(o, out = []) {
  if (typeof o === "string" && /^https?:\/\//.test(o)) out.push(o);
  else if (Array.isArray(o)) o.forEach((x) => imageUrls(x, out));
  else if (o && typeof o === "object") Object.values(o).forEach((x) => imageUrls(x, out));
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.YOUCAM_API_KEY) return res.status(200).json({ demo: true, reason: "no_key" });
  try {
    const body = req.body || {};
    const m = /^data:(image\/\w+);base64,(.+)$/.exec(body.image || "");
    if (!m) return res.status(400).json({ error: "send image as data URL" });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > 7.5e6) return res.status(413).json({ error: "photo too large" });
    const t0 = Date.now(), deadline = t0 + 52000;
    const f = await yc("/file", { method: "POST", body: JSON.stringify({ files: [{ content_type: m[1], file_name: "selfie.jpg", file_size: buf.length }] }) });
    const file = (f.data && f.data.files ? f.data.files : f.files)[0];
    const up = file.requests[0];
    const put = await fetch(up.url, { method: up.method || "PUT", headers: up.headers || { "Content-Type": m[1] }, body: buf });
    if (!put.ok) throw new Error(`upload ${put.status}`);
    const src = { src_file_id: file.file_id };
    const jobs = [
      runTask("skin-analysis", { ...src, dst_actions: ACTIONS, miniserver_args: { enable_mask_overlay: true }, format: "json" }, deadline),
      body.tone ? runTask("skin-tone-analysis", { ...src, face_angle_strictness_level: "medium" }, deadline) : null,
      body.aging ? runTask("aging", { ...src }, deadline) : null,
    ];
    const [skin, tone, aging] = await Promise.allSettled(jobs.map((j) => j || Promise.resolve(null)));
    if (skin.status === "rejected") throw skin.reason;
    const extra = (r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason && r.reason.message || r.reason) });
    const toneOut = body.tone ? extra(tone) : null;
    const agingOut = body.aging ? extra(aging) : null;
    res.status(200).json({
      demo: false,
      ms: Date.now() - t0,
      result: skin.value,
      tone: toneOut && !toneOut.error ? (toneOut.color || toneOut) : toneOut,
      aging: agingOut && !agingOut.error ? { images: imageUrls(agingOut), raw: agingOut } : agingOut,
    });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
