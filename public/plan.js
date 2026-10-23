// SunSkin planning logic: pure functions, shared by the browser and node tests.
// YouCam ui_score: higher = healthier skin. concern = 100 - score.
(function (root) {
const NAMES = { wrinkle: 'Wrinkles', pore: 'Pores', texture: 'Texture', acne: 'Acne', redness: 'Redness', oiliness: 'Oil balance', moisture: 'Moisture', radiance: 'Radiance', age_spot: 'Age spots', dark_circle_v2: 'Dark circles' };
const uvLabel = u => u < 3 ? 'low' : u < 6 ? 'moderate' : u < 8 ? 'high' : u < 11 ? 'very high' : 'extreme';

// hourly: [{h: 0..23, uv}] for today. Returns the window when UV >= 3 (WHO: protection needed).
function uvWindow(hourly) {
  const hrs = hourly.filter(x => x.uv >= 3).map(x => x.h);
  if (!hrs.length) return null;
  const peak = hourly.reduce((a, b) => (b.uv > a.uv ? b : a));
  return { from: Math.min(...hrs), to: Math.max(...hrs) + 1, peakHour: peak.h, peakUv: peak.uv };
}

function plan(s, uvToday, opts = {}) {
  const week = opts.week || [uvToday];          // daily UV max, today first
  const outdoor = !!opts.outdoor;               // works/spends hours outside
  const win = opts.window || null;
  const c = k => 100 - (s[k] ?? 70);
  const spf = uvToday >= 8 || outdoor && uvToday >= 3 ? 'SPF 50+' : uvToday >= 3 ? 'SPF 50' : 'SPF 30';
  const am = [], pm = [], buy = [], why = [];
  const add = (list, item) => { if (!list.find(x => x.name === item.name)) list.push(item); };

  am.push('Gentle cleanser');
  if (c('age_spot') > 25 || c('radiance') > 35) { am.push('Vitamin C serum'); add(buy, { name: 'Vitamin C serum (10–15% L-ascorbic acid)', key: 'antioxidant, brightening', why: `age-spot score ${s.age_spot ?? '–'}, radiance ${s.radiance ?? '–'}; pairs with sunscreen on UV days`, must: false }); }
  if (c('moisture') > 40) { am.push('Hyaluronic acid serum'); add(buy, { name: 'Hyaluronic acid serum', key: 'hydration', why: `moisture score ${s.moisture}`, must: false }); }
  const oily = c('oiliness') > 45;
  am.push(oily ? 'Light gel moisturizer' : 'Cream moisturizer');
  add(buy, { name: oily ? 'Oil-free gel moisturizer' : 'Barrier cream moisturizer (ceramides)', key: oily ? 'light, non-comedogenic' : 'ceramides', why: `oil balance score ${s.oiliness ?? '–'}`, must: false });
  am.push(`Broad-spectrum sunscreen ${spf}` + (uvToday >= 3 ? ' as the last step' : ''));
  add(buy, { name: `Broad-spectrum sunscreen ${spf}`, key: 'UVA + UVB', why: `today's max UV is ${uvToday.toFixed(1)} (${uvLabel(uvToday)})`, must: true });
  if (outdoor && uvToday >= 3) {
    add(buy, { name: 'SPF 50 stick or spray for reapplying', key: 'fast reapply over make-up / at work', why: 'you are outside during UV hours', must: true });
    add(buy, { name: 'Wide-brim hat or cap + UV400 sunglasses', key: 'physical protection', why: 'sunscreen alone is not enough for long outdoor hours', must: true });
  }

  // Reapply schedule: every 2 h while UV >= 3 (common dermatology guidance for time outdoors).
  const reapply = [];
  if (win && (outdoor || uvToday >= 6)) for (let h = win.from + 2; h < win.to; h += 2) reapply.push(`${String(h).padStart(2, '0')}:00`);

  pm.push('Double cleanse (removes sunscreen)');
  if (c('acne') > 25 || c('pore') > 40) { pm.push('BHA (salicylic acid) 2–3× per week'); add(buy, { name: 'BHA 2% exfoliant (salicylic acid)', key: 'unclogs pores', why: `acne score ${s.acne ?? '–'}, pores ${s.pore ?? '–'}`, must: false }); }
  if (c('redness') > 40) { pm.push('Niacinamide or centella serum'); add(buy, { name: 'Niacinamide 5% serum', key: 'calming, barrier', why: `redness score ${s.redness}`, must: false }); }
  const wantsRetinoid = c('wrinkle') > 30 || c('texture') > 35;
  // SunSkin rule (conservative, not medical advice): retinoids make skin more sun-sensitive,
  // so we schedule them only on nights before a day with max UV < 6.
  const wantsBha = c('acne') > 25 || c('pore') > 40;
  // Beginner pace: at most 3 retinoid nights a week, never two nights in a row; BHA on a different night.
  let lastR = -2, nR = 0, nB = 0;
  const calendar = week.slice(0, 7).map((u, i) => {
    const next = week[i + 1] ?? u;
    const retinoid = wantsRetinoid && next < 6 && i - lastR > 1 && nR < 3;
    if (retinoid) { lastR = i; nR++; }
    const bha = !retinoid && wantsBha && nB < 2 && i - lastR > 0 && i % 2 === 1;
    if (bha) nB++;
    return { day: i, uv: u, retinoid, bha };
  });
  if (wantsRetinoid) {
    pm.push(calendar[0].retinoid ? 'Retinoid tonight (tomorrow UV is below 6)' : (week[1] ?? uvToday) >= 6 ? `Skip retinoid tonight (UV ${(week[1] ?? uvToday).toFixed(0)} tomorrow)` : 'No retinoid tonight (see your week plan)');
    add(buy, { name: 'Retinol 0.2–0.3% (beginner strength)', key: 'texture, fine lines', why: `wrinkle score ${s.wrinkle ?? '–'}, texture ${s.texture ?? '–'}; scheduled only before lower-UV days`, must: false });
  }
  pm.push(oily ? 'Light moisturizer' : 'Barrier moisturizer');
  const top = Object.keys(NAMES).filter(k => s[k] != null).sort((a, b) => s[a] - s[b]).slice(0, 3);
  buy.sort((a, b) => b.must - a.must);
  return { am, pm, buy, spf, reapply, calendar, top };
}

// Normalize YouCam results: {output:[{type, ui_score, mask_urls}]}
function norm(r) {
  const scores = {}, masks = {};
  const out = (r && (r.output || r)) || [];
  (Array.isArray(out) ? out : []).forEach(x => {
    const k = String(x.type || '').replace(/^hd_/, '');
    const v = x.ui_score ?? x.score;
    if (k && typeof v === 'number') scores[k] = v;
    if (k && Array.isArray(x.mask_urls) && x.mask_urls[0]) masks[k] = x.mask_urls[0];
  });
  return { scores, masks };
}


// Skin tone -> ITA° (Individual Typology Angle, a standard colourimetric skin classification):
// ITA = atan((L* - 50) / b*) in degrees, from CIELAB of the YouCam skin_color hex.
function hexToLab(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const r = lin(n >> 16 & 255), g = lin(n >> 8 & 255), b = lin(n & 255);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}
function ita(hex) { const { L, b } = hexToLab(hex); return Math.atan2(L - 50, b) * 180 / Math.PI; }
// ITA bands (Chardon et al. 1991): >55 very light, 41-55 light, 28-41 intermediate, 10-28 tan, -30-10 brown, < -30 dark.
function toneAdvice(hex) {
  if (!/^#?[0-9a-f]{6}$/i.test(String(hex || ''))) return null;
  const v = ita(hex);
  const band = v > 55 ? 'very light' : v > 41 ? 'light' : v > 28 ? 'intermediate' : v > 10 ? 'tan' : v > -30 ? 'brown' : 'dark';
  const shade = v > 41 ? 'Light' : v > 28 ? 'Light-medium' : v > 10 ? 'Medium' : v > -30 ? 'Medium-deep' : 'Deep';
  const light = v > 41;
  return {
    ita: Math.round(v), band, shade,
    note: light
      ? 'Lighter skin burns faster: never skip SPF on UV ≥ 3 days and reapply on time.'
      : v > 28
        ? 'Medium skin can burn and tan, and UV makes uneven tone and dark spots worse. A tinted SPF in your shade avoids a white cast, so you will actually wear it.'
        : 'Deeper skin tans more than it burns, but UV and visible light still drive dark spots. Tinted sunscreen with iron oxides adds visible-light protection and avoids a white cast.',
    product: { name: `Tinted mineral sunscreen SPF 50, shade "${shade}" (iron oxides)`, key: 'zinc oxide + iron oxides: UVA/UVB + visible light, no white cast', why: `YouCam skin tone ${String(hex).toLowerCase()} → ITA ${Math.round(v)}° (${band})`, must: false },
  };
}

// Pick the aging frames closest to the given ages from YouCam AI Aging output [{res_age, url}].
function agingPick(frames, ages) {
  const fr = (frames || []).filter(f => f && f.url && typeof f.res_age === 'number');
  if (!fr.length) return [];
  return ages.map(a => fr.reduce((best, f) => Math.abs(f.res_age - a) < Math.abs(best.res_age - a) ? f : best));
}

// Compare this scan with the previous one (scores 0-100, higher = better).
function progress(prev, cur) {
  if (!prev) return [];
  return Object.keys(NAMES).filter(k => prev[k] != null && cur[k] != null).map(k => ({ k, name: NAMES[k], d: Math.round(cur[k] - prev[k]) }));
}

const api = { NAMES, uvLabel, uvWindow, plan, norm, ita, toneAdvice, agingPick, progress };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SunPlan = api;
})(typeof self !== 'undefined' ? self : this);
