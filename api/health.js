// GET /api/health -> whether the server has a YouCam key configured (never returns the key)
export default function handler(req, res) {
  res.status(200).json({ ok: true, youcamKeyConfigured: Boolean(process.env.YOUCAM_API_KEY) });
}
