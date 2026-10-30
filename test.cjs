const root = {}; new Function('self', require('fs').readFileSync(__dirname + '/public/plan.js', 'utf8'))(root); const P = root.SunPlan, a = require('assert');
a.strictEqual(P.shadeMatch('#ebcdb0').best.name, 'Light');
a.strictEqual(P.shadeMatch('#5f3e2c').best.name, 'Deep');
a.strictEqual(P.shadeMatch('nope'), null);
a.strictEqual(P.shadeMatch('#ebcdb0').list.length, 5);
console.log('shade tests passed');
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

// Skin tone -> ITA band (tone from the Oct 23 live test) and aging frame picking.
{ const t = P.toneAdvice('#b6967e'); a(t && t.ita > 28 && t.ita <= 41, 'b6967e is intermediate, got ' + (t && t.ita)); a.equal(t.shade, 'Light-medium');
  a.equal(P.toneAdvice('#f3d9c8').band.includes('light'), true); a(['brown', 'dark'].includes(P.toneAdvice('#5a3a2a').band)); a.equal(P.toneAdvice('nope'), null);
  const fr = [12, 16, 20, 24, 27, 31, 35, 39, 43, 47, 51, 55, 59].map(x => ({ res_age: x, url: 'u' + x }));
  a.deepEqual(P.agingPick(fr, [35, 55]).map(f => f.res_age), [35, 55]); a.deepEqual(P.agingPick([], [1]), []);
  a.deepEqual(P.progress({ pore: 50, acne: 80 }, { pore: 55, acne: 78 }), [{ k: 'pore', name: 'Pores', d: 5 }, { k: 'acne', name: 'Acne', d: -2 }]); }
console.log('tone/aging/progress tests passed');

// Coder agent: Kyiv vs Dubai comparison + UV-only plan.
{ const kyiv = { place: 'Kyiv', today: 1.2, week: [1.2, 1, 1.5, 1, 0.8, 1, 1.1], window: null };
  const dubai = { place: 'Dubai', today: 7.8, week: [7.8, 8, 7.5, 8, 7.9, 8, 7.7], window: { from: 8, to: 17, peakHour: 12, peakUv: 7.8 } };
  const c = P.compareCities(S, kyiv, dubai, { outdoor: true });
  a.equal(c.a.spf, 'SPF 30'); a.equal(c.b.spf, 'SPF 50+'); a.equal(c.a.retinoidNights, 3); a.equal(c.b.retinoidNights, 0); a.equal(c.diff.length, 3);
  const u = P.uvOnlyPlan(7.8, { outdoor: true, window: dubai.window }); a.equal(u.buy.length, 3); a(u.buy.every(b => b.must)); a(u.reapply.length >= 3); }
console.log('compare/uv-only tests passed');
// INCI check: rules + verdicts.
{ const r2 = {}; new Function('self', require('fs').readFileSync(__dirname + '/public/inci.js', 'utf8'))(r2); const I = r2.SunInci;
  a(I.ING.length >= 20 && I.ING.length <= 25, 'ingredient count ' + I.ING.length); a(I.ING.every(g => g.s.every(k => I.SRC[k] && /^https:\/\//.test(I.SRC[k][1]))), 'every rule cites a source');
  const red = I.check('Aqua, Alcohol Denat., Glycerin', { redness: 40, moisture: 90, acne: 90 }, 2, [2]); a.equal(red.verdict, 'skip'); a.equal(red.unknown, 1);
  const calm = I.check('Aqua, Glycerin, Sodium Hyaluronate (hydration), Zinc Oxide', { moisture: 40, redness: 90, acne: 90, pore: 90 }, 2, [2]); a.equal(calm.verdict, 'buy'); a(calm.found.find(f => f.n === 'Hyaluronic Acid').level === 'good');
  const ret = I.check('retinol, dimethicone', { moisture: 90, redness: 90, acne: 90 }, 8, [8, 8, 8]); a.equal(ret.verdict, 'patch-test');
  a.equal(I.check('', {}, 1, []).found.length, 0); a(I.parse(I.EXAMPLE).length === 11); }
console.log('inci tests passed');
// Saved real response (judge demo) normalizes and every image is local.
{ const o = JSON.parse(require('fs').readFileSync(__dirname + '/public/demo/real-response.json', 'utf8')); const n = P.norm(o.result);
  a(Object.keys(n.scores).length >= 12); a(Object.values(n.masks).every(u => /^demo\//.test(u) && require('fs').existsSync(__dirname + '/public/' + u)));
  a(o.aging.raw.output.every(f => require('fs').existsSync(__dirname + '/public/' + f.url))); a(!JSON.stringify(o).includes('amazonaws')); a(P.toneAdvice(o.tone.skin_color)); }
console.log('demo fixture tests passed');
