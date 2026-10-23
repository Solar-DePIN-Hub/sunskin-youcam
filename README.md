# ☀️ SunSkin: your skin, today's sun

**Live:** https://sunskin-youcam.vercel.app · Built for the YouCam API Skin AI & eCommerce VTO Hackathon.

SunSkin combines **YouCam AI Skin Analysis** (10 skin metrics + mask maps) with the **local UV forecast** (Open-Meteo, hourly + 7 days). It turns them into:

- a morning and night routine for *today's* UV;
- a **sunscreen reapply schedule** (every 2 h while UV ≥ 3) for people who work outdoors;
- a **UV-aware week**: retinoid nights are scheduled only before days with max UV < 6;
- a **shopping list where every item says why** (which score or which UV level triggered it).

## YouCam API used
Server-side in `api/analyze.js` (S2S v2.0, the key never reaches the browser):
1. `POST /s2s/v2.0/file` → presigned upload URL, then `PUT` the selfie.
2. `POST /s2s/v2.0/task/skin-analysis` with 10 SD actions (`wrinkle, pore, texture, acne, redness, oiliness, moisture, radiance, age_spot, dark_circle_v2`) and `enable_mask_overlay`.
3. Poll `GET /s2s/v2.0/task/skin-analysis/{task_id}` → `ui_score` per metric and `mask_urls`.

The browser resizes the photo to fit YouCam SD limits (short side ≥ 480 px, long side ≤ 2560 px) and checks the lighting first, so no API units are wasted on bad photos.

## Run
```
npm i -g vercel
vercel env add YOUCAM_API_KEY   # your key from https://yce.perfectcorp.com/ai-api
vercel dev
npm test                        # plan logic tests
```
Without `YOUCAM_API_KEY` the app runs in clearly labelled **demo mode** with sample scores. `GET /api/health` tells you whether a key is configured (it never shows the key).

## Files
- `public/plan.js`: pure routine/UV logic (tested in `test.cjs`)
- `public/app.js`, `public/index.html`: UI
- `api/analyze.js`: YouCam S2S flow · `api/health.js`: key-configured check

Cosmetic guidance, not medical advice. MIT licensed.
