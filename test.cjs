const root = {}; new Function('self', require('fs').readFileSync(__dirname + '/public/plan.js', 'utf8'))(root); const P = root.SunPlan, a = require('assert');
const S = { wrinkle: 62, pore: 58, texture: 60, acne: 70, redness: 55, oiliness: 47, moisture: 42, radiance: 61, age_spot: 69, dark_circle_v2: 50 };
const hourly = Array.from({ length: 24 }, (_, h) => ({ h, uv: Math.max(0, 8 - Math.abs(13 - h) * 1.4) }));
const w = P.uvWindow(hourly); a.equal(w.peakHour, 13); a(w.from >= 9 && w.to <= 18);
const hi = P.plan(S, 8.2, { week: [8.2, 7, 4, 3, 6.5, 2, 5], outdoor: true, window: w });
a.equal(hi.spf, 'SPF 50+'); a(hi.reapply.length >= 2); a(hi.buy[0].must);
a(hi.calendar[0].retinoid === false, 'no retinoid before UV 7 day'); a(hi.calendar[1].retinoid === true, 'retinoid before UV 4 day');
const lo = P.plan(S, 1.5, { week: [1.5, 1.2] });
a.equal(lo.spf, 'SPF 30'); a.equal(lo.reapply.length, 0);
const n = P.norm({ output: [{ type: 'hd_acne', ui_score: 81, mask_urls: ['u'] }, { type: 'pore', ui_score: 90 }] });
a.deepEqual(n.scores, { acne: 81, pore: 90 }); a.equal(n.masks.acne, 'u');
a.deepEqual(hi.top, ['moisture', 'oiliness', 'dark_circle_v2']);
const cal = P.plan(S, 1, { week: [1,1,1,1,1,1,1] }).calendar; a(cal.filter(d => d.retinoid).length <= 3); a(!cal.some((d, i) => i && d.retinoid && cal[i-1].retinoid)); a(!cal.some(d => d.retinoid && d.bha));
console.log('all tests passed');
// Real YouCam v2.0 response shape (Oct 23 2026 live test, URLs stripped): per-concern ui_score + mask_urls, plus all/skin_age/resize_image items.
{ const real = { output: [{ type: 'pore', ui_score: 61, raw_score: 36.3, mask_urls: ['m'] }, { type: 'moisture', ui_score: 69, raw_score: 47.1, mask_urls: ['m'] }, { type: 'all', score: 78.9, url: null }, { type: 'skin_age', score: 28, url: null }, { type: 'resize_image', mask_urls: ['r'], url: 'r' }] };
  const n = P.norm(real); a.equal(n.scores.pore, 61); a.equal(n.scores.all, 78.9); a.equal(n.scores.skin_age, 28); a.equal(n.scores.resize_image, undefined); a.equal(n.masks.pore, 'm'); }
console.log('real-shape test passed');
