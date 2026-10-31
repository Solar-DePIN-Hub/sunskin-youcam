// SunSkin rich panels: UV dial + hourly curve, plan day-timeline + skin ring, label scanner (camera/photo -> OCR -> verdict cards), cold-open fillers.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function $(s, c) { return (c || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ucol(u) { return u < 3 ? '#52b788' : u < 6 ? '#f4a261' : u < 8 ? '#e76f51' : u < 11 ? '#d62828' : '#7b2cbf'; }
  function ulab(u) { return u < 3 ? 'Low' : u < 6 ? 'Moderate' : u < 8 ? 'High' : u < 11 ? 'Very high' : 'Extreme'; }
  function getSun() { try { return sun; } catch (e) { return null; } }
  function getS() { try { return lastS; } catch (e) { return null; } }
  var css = [
    '.px-hero{display:grid;grid-template-columns:minmax(240px,320px) 1fr;gap:18px;align-items:stretch}',
    '@media(max-width:760px){.px-hero{grid-template-columns:1fr}}',
    '.px-card{background:rgba(255,255,255,.86);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.75);border-radius:22px;padding:18px 20px;box-shadow:0 20px 50px rgba(60,20,10,.18);color:var(--hero-ink)}',
    '.px-k{font:700 .72rem/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--hero-ink2);opacity:.85;margin:0 0 8px}',
    '.px-dial text{font-family:inherit}',
    '.px-curve{width:100%;height:auto;display:block}',
    '.px-legend{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:.82rem;color:var(--hero-ink2);margin-top:6px}',
    '.px-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}',
    '.px-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}',
    '.px-fact{background:rgba(255,255,255,.6);border-radius:14px;padding:10px 12px;font-size:.9rem}',
    '.px-fact b{display:block;font-size:1.25rem}',
    '.px-tl{position:relative}',
    '.px-scan{display:grid;grid-template-columns:minmax(260px,420px) 1fr;gap:18px}',
    '@media(max-width:820px){.px-scan{grid-template-columns:1fr}}',
    '.px-view{position:relative;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:#1d120c;display:flex;align-items:center;justify-content:center;color:#f6e7d8}',
    '.px-view video,.px-view img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}',
    '.px-frame{position:absolute;inset:9% 8%;border-radius:12px;pointer-events:none;background:linear-gradient(#ffb27a,#ffb27a) top left/28px 3px no-repeat,linear-gradient(#ffb27a,#ffb27a) top left/3px 28px no-repeat,linear-gradient(#ffb27a,#ffb27a) top right/28px 3px no-repeat,linear-gradient(#ffb27a,#ffb27a) top right/3px 28px no-repeat,linear-gradient(#ffb27a,#ffb27a) bottom left/28px 3px no-repeat,linear-gradient(#ffb27a,#ffb27a) bottom left/3px 28px no-repeat,linear-gradient(#ffb27a,#ffb27a) bottom right/28px 3px no-repeat,linear-gradient(#ffb27a,#ffb27a) bottom right/3px 28px no-repeat}',
    '.px-line{position:absolute;left:8%;right:8%;height:2px;background:#ff8a5c;box-shadow:0 0 14px 3px rgba(255,120,80,.8);top:10%;animation:px-sweep 2.4s ease-in-out infinite alternate;pointer-events:none}',
    '.px-view:not(.busy) .px-line{display:none}',
    '.px-view.live .px-line{display:block}',
    '@keyframes px-sweep{to{top:89%}}',
    '@media (prefers-reduced-motion:reduce){.px-line{animation:none;top:50%}}',
    '.px-hint{position:relative;z-index:1;text-align:center;padding:24px;font-size:.95rem;line-height:1.45}',
    '.px-status{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;background:rgba(20,10,6,.72);color:#fff;border-radius:10px;padding:8px 12px;font-size:.85rem}',
    '.px-status[hidden]{display:none}',
    '.px-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    '.px-btns button{min-height:44px;border-radius:99px;border:0;padding:10px 16px;font-weight:700;cursor:pointer;background:#2a1408;color:#fff}',
    '.px-btns button.alt{background:rgba(255,255,255,.85);color:#2a1408;border:1px solid rgba(42,20,8,.15)}',
    '#inciOut{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}',
    '#inciOut>p,#inciOut>.verdict,#inciOut>.px-claims{grid-column:1/-1}',
    '#inciOut .ing{border-radius:16px;padding:12px 14px;background:#fff;border-left:6px solid #52b788;box-shadow:0 6px 18px rgba(60,20,10,.08);font-size:.92rem;line-height:1.4}',
    '#inciOut .ing.patch{border-left-color:#f4a261}#inciOut .ing.skip{border-left-color:#e63946}#inciOut .ing.good{border-left-color:#2d6a4f}',
    '#inciOut .ing b:first-child{font-size:1.02rem}',
    '.px-claims{display:flex;flex-wrap:wrap;gap:8px}',
    '.px-claim{background:#fff7ef;border:1px solid #f4c9a6;border-radius:12px;padding:8px 12px;font-size:.88rem;max-width:420px}',
    '.px-ring text{font-family:inherit}',
    '.px-priv{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}',
    '.hx-view-head h2:focus{outline:none}',
    '.px-priv .px-card h3{margin:.2rem 0 .4rem;font-size:1.05rem}'
  ];
  var st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);

  // ---------- UV dial + hourly curve ----------
  function dialSVG(u) {
    var W = 280, H = 170, cx = 140, cy = 150, r = 110, max = 12;
    var a = function (v) { return Math.PI * (1 - Math.min(v, max) / max); };
    var pt = function (v, rr) { return [cx + rr * Math.cos(a(v)), cy - rr * Math.sin(a(v))]; };
    var bands = [[0, 3, '#52b788'], [3, 6, '#f4a261'], [6, 8, '#e76f51'], [8, 11, '#d62828'], [11, 12, '#7b2cbf']];
    var s = '<svg class="px-dial" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="UV index dial: ' + u.toFixed(1) + ' ' + ulab(u) + '">';
    bands.forEach(function (b) { var p0 = pt(b[0], r), p1 = pt(b[1], r); s += '<path d="M' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 0 1 ' + p1[0] + ' ' + p1[1] + '" stroke="' + b[2] + '" stroke-width="18" fill="none"/>'; });
    for (var i = 0; i <= 12; i += 1) { var o = pt(i, r - 16), q = pt(i, r - 24); s += '<line x1="' + o[0] + '" y1="' + o[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="#5a2a12" stroke-opacity=".45" stroke-width="' + (i % 3 ? 1 : 2) + '"/>'; if (i % 3 === 0) { var t = pt(i, r - 36); s += '<text x="' + t[0] + '" y="' + (t[1] + 4) + '" font-size="11" text-anchor="middle" fill="#5a2a12">' + i + '</text>'; } }
    var n = pt(u, r - 8);
    s += '<line class="px-needle" x1="' + cx + '" y1="' + cy + '" x2="' + n[0] + '" y2="' + n[1] + '" stroke="#2a1408" stroke-width="4" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="8" fill="#2a1408"/>';
    s += '<text x="' + cx + '" y="' + (cy - 40) + '" font-size="40" font-weight="800" text-anchor="middle" fill="' + ucol(u) + '">' + u.toFixed(1) + '</text>';
    s += '<text x="' + cx + '" y="' + (cy - 20) + '" font-size="13" font-weight="700" text-anchor="middle" fill="#5a2a12">' + ulab(u).toUpperCase() + ' · UV INDEX</text></svg>';
    return s;
  }
  function curveSVG(hours, win, opts) {
    opts = opts || {};
    var W = 640, H = 220, L = 34, R = 12, T = 14, B = 30, h0 = 5, h1 = 22;
    var pts = hours.filter(function (x) { return x.h >= h0 && x.h <= h1; });
    if (!pts.length) return '';
    var mx = Math.max(4, Math.ceil(Math.max.apply(null, pts.map(function (x) { return x.uv; })) + 1));
    var X = function (h) { return L + (h - h0) / (h1 - h0) * (W - L - R); }, Y = function (u) { return T + (1 - u / mx) * (H - T - B); };
    var s = '<svg class="px-curve" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hourly UV curve for today">';
    s += '<defs><linearGradient id="pxg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#52b788"/><stop offset="' + Math.min(1, 3 / mx) + '" stop-color="#f4a261"/><stop offset="' + Math.min(1, 6 / mx) + '" stop-color="#e76f51"/><stop offset="' + Math.min(1, 8 / mx) + '" stop-color="#d62828"/><stop offset="1" stop-color="#7b2cbf"/></linearGradient></defs>';
    if (win) s += '<rect x="' + X(win.from) + '" y="' + T + '" width="' + (X(win.to) - X(win.from)) + '" height="' + (H - T - B) + '" fill="#ff6a3d" fill-opacity=".1"/><text x="' + (X(win.from) + 6) + '" y="' + (T + 14) + '" font-size="12" font-weight="700" fill="#b23a14">protect ' + win.from + ':00–' + win.to + ':00</text>';
    for (var g = 0; g <= mx; g += 2) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="#5a2a12" stroke-opacity=".1"/><text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" font-size="11" text-anchor="end" fill="#5a2a12">' + g + '</text>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(3) + '" y2="' + Y(3) + '" stroke="#b23a14" stroke-dasharray="5 4" stroke-opacity=".7"/><text x="' + (W - R) + '" y="' + (Y(3) - 5) + '" font-size="11" text-anchor="end" fill="#b23a14">UV 3: sun protection needed (WHO)</text>';
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.h).toFixed(1) + ' ' + Y(p.uv).toFixed(1); }).join(' ');
    s += '<path d="' + d + ' L' + X(pts[pts.length - 1].h) + ' ' + Y(0) + ' L' + X(pts[0].h) + ' ' + Y(0) + 'Z" fill="url(#pxg)" fill-opacity=".55"/><path d="' + d + '" fill="none" stroke="#2a1408" stroke-width="2.5" stroke-linejoin="round"/>';
    (opts.marks || []).forEach(function (m) { var x = X(m.h); s += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + Y(0) + '" stroke="' + (m.c || '#2a1408') + '" stroke-width="2" stroke-dasharray="' + (m.dash || '0') + '"/><circle cx="' + x + '" cy="' + (H - B + 2) + '" r="5" fill="' + (m.c || '#2a1408') + '"/>' + (m.t ? '<text x="' + x + '" y="' + (T + 30 + (m.dy || 0)) + '" font-size="11.5" font-weight="700" text-anchor="middle" fill="' + (m.c || '#2a1408') + '" paint-order="stroke" stroke="#fff" stroke-width="3">' + m.t + '</text>' : ''); });
    for (var hh = 6; hh <= 22; hh += 2) s += '<text x="' + X(hh) + '" y="' + (H - 8) + '" font-size="11" text-anchor="middle" fill="#5a2a12">' + hh + ':00</text>';
    return s + '</svg>';
  }
  function nowMark() { var d = new Date(); return { h: d.getHours() + d.getMinutes() / 60, t: 'now', c: '#7c3aed', dash: '4 3' }; }
  var uvBox = null;
  function renderUV() {
    var S = getSun(); var out = $('#uvout'); if (!out) return;
    if (!uvBox) { uvBox = el('div', 'px-hero'); uvBox.id = 'pxUv'; out.parentNode.insertBefore(uvBox, out); }
    if (!S || !S.hourly) { uvBox.innerHTML = '<div class="px-card"><p class="px-k">Live UV</p><p>Loading today’s UV for London… pick your city or use your location.</p></div>'; return; }
    var w = S.window, peak = S.hourly.reduce(function (a, b) { return b.uv > a.uv ? b : a; }, { uv: 0, h: 12 });
    var mins = S.today >= 8 ? '≈ 10–15' : S.today >= 6 ? '≈ 15–20' : S.today >= 3 ? '≈ 20–30' : '30+';
    uvBox.innerHTML = '<div class="px-card"><p class="px-k">Today · ' + (S.place || 'your location') + '</p>' + dialSVG(S.today) + '<p style="margin:.3rem 0 0;font-size:.9rem">Live forecast from Open-Meteo. Bands follow the WHO UV index scale.</p></div>' +
      '<div class="px-card"><p class="px-k">Hour by hour</p>' + curveSVG(S.hourly, w, { marks: [nowMark()] }) +
      '<div class="px-legend"><span><i style="background:#52b788"></i>Low 0–2</span><span><i style="background:#f4a261"></i>Moderate 3–5</span><span><i style="background:#e76f51"></i>High 6–7</span><span><i style="background:#d62828"></i>Very high 8–10</span><span><i style="background:#7b2cbf"></i>Extreme 11+</span></div>' +
      '<div class="px-facts"><div class="px-fact"><b>' + peak.h + ':00</b>peak, UV ' + peak.uv.toFixed(1) + '</div><div class="px-fact"><b>' + (w ? w.from + '–' + w.to + 'h' : 'none') + '</b>protection window (UV ≥ 3)</div><div class="px-fact"><b>' + (S.today >= 8 ? 'SPF 50+' : S.today >= 3 ? 'SPF 30+' : 'SPF 30') + '</b>broad-spectrum, reapply every 2 h outdoors (AAD)</div></div>' +
      '<p class="px-legend" style="margin-top:8px">Sources: <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index" target="_blank" rel="noopener">WHO: UV index</a> · <a href="https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen" target="_blank" rel="noopener">AAD: how to apply sunscreen</a> · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p></div>';
    void mins;
  }

  // ---------- Plan: skin ring + day timeline ----------
  var NAMES = { wrinkle: 'Wrinkles', pore: 'Pores', texture: 'Texture', acne: 'Acne', redness: 'Redness', oiliness: 'Oiliness', moisture: 'Moisture', radiance: 'Radiance', age_spot: 'Spots', dark_circle_v2: 'Dark circles' };
  function ringSVG(s) {
    var keys = Object.keys(NAMES).filter(function (k) { return typeof s[k] === 'number'; });
    var overall = s.all != null ? Math.round(s.all) : Math.round(keys.reduce(function (a, k) { return a + s[k]; }, 0) / Math.max(1, keys.length));
    var cx = 120, cy = 120, R = 100, seg = (2 * Math.PI) / keys.length, out = '<svg class="px-ring" viewBox="-22 -12 284 264" width="100%" style="max-width:280px" role="img" aria-label="Skin score ring, overall ' + overall + '">';
    keys.forEach(function (k, i) {
      var a0 = -Math.PI / 2 + i * seg + 0.03, a1 = a0 + seg - 0.06, rr = 50 + (R - 50) * (s[k] / 100);
      var p = function (a, r) { return (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); };
      var c = s[k] >= 70 ? '#52b788' : s[k] >= 50 ? '#f4a261' : '#e63946';
      out += '<path d="M' + p(a0, 50) + ' L' + p(a0, R) + ' A' + R + ' ' + R + ' 0 0 1 ' + p(a1, R) + ' L' + p(a1, 50) + ' A50 50 0 0 0 ' + p(a0, 50) + 'Z" fill="' + c + '" fill-opacity=".14"/>';
      out += '<path d="M' + p(a0, 50) + ' L' + p(a0, rr) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + p(a1, rr) + ' L' + p(a1, 50) + ' A50 50 0 0 0 ' + p(a0, 50) + 'Z" fill="' + c + '"><title>' + NAMES[k] + ' ' + Math.round(s[k]) + '</title></path>';
      var am = (a0 + a1) / 2, lp = [cx + (R + 12) * Math.cos(am), cy + (R + 12) * Math.sin(am)];
      out += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" font-size="8.5" text-anchor="middle" fill="#5a2a12">' + NAMES[k].split(' ')[0] + '</text>';
    });
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="44" fill="#fff"/><text x="' + cx + '" y="' + (cy + 8) + '" font-size="30" font-weight="800" text-anchor="middle" fill="#2a1408">' + overall + '</text><text x="' + cx + '" y="' + (cy + 24) + '" font-size="9" text-anchor="middle" fill="#5a2a12">' + (s.all != null ? 'YouCam overall' : 'avg of 10') + '</text></svg>';
    return out;
  }
  var planBox = null;
  function renderPlan() {
    var s = getS(), S = getSun(), out = $('#out'); if (!out || !s || !S || typeof SunPlan === 'undefined') return;
    var p; try { var od = $('#outdoor'); p = SunPlan.plan(s, S.today, { week: S.week, outdoor: od && od.checked, window: S.window }); } catch (e) { return; }
    if (!planBox) { planBox = el('div', 'px-hero'); planBox.id = 'pxPlan'; out.parentNode.insertBefore(planBox, out); }
    var hm = function (t) { var m = String(t).match(/(\d{1,2})[:.](\d{2})/); return m ? +m[1] + m[2] / 60 : null; };
    var marks = [{ h: 7.5, t: '☀ AM: SPF', c: '#2d6a4f' }];
    (p.reapply || []).forEach(function (t, i) { var h = hm(t); if (h != null) marks.push({ h: h, t: '⏰ reapply', c: '#b23a14', dy: (i % 2) * 16 }); });
    var cal0 = p.calendar && p.calendar[0];
    marks.push({ h: 21.5, t: cal0 && cal0.retinoid ? '🌙 retinoid' : cal0 && cal0.bha ? '🌙 BHA' : '🌙 hydrate', c: '#4a1a5a' });
    var hours = S.hourly || [];
    planBox.innerHTML = '<div class="px-card" style="text-align:center"><p class="px-k" style="text-align:left">Your skin, 10 YouCam metrics</p>' + ringSVG(s) + '<p style="margin:.2rem 0 0;font-size:.85rem">Longer petal = better score. Red &lt; 50, orange 50–69, green 70+.</p></div>' +
      '<div class="px-card"><p class="px-k">Your day, timed to the sun</p>' + curveSVG(hours, S.window, { marks: marks }) +
      '<div class="px-facts"><div class="px-fact"><b>' + p.spf + '</b>today, UV ' + S.today.toFixed(1) + '</div><div class="px-fact"><b>' + ((p.reapply || []).length || 'No') + '</b>reapply reminder' + ((p.reapply || []).length === 1 ? '' : 's') + (p.reapply && p.reapply.length ? ': ' + p.reapply.join(', ') : '') + '</div><div class="px-fact"><b>' + (p.calendar || []).filter(function (d) { return d.retinoid; }).length + '</b>retinoid nights this week, only before UV &lt; 6 days</div></div></div>';
  }

  // ---------- Check a product: scanner ----------
  var TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  function loadTess() { return window.Tesseract ? Promise.resolve(window.Tesseract) : new Promise(function (res, rej) { var sc = document.createElement('script'); sc.src = TESS; sc.onload = function () { res(window.Tesseract); }; sc.onerror = function () { rej(new Error('OCR engine failed to load')); }; document.head.appendChild(sc); }); }
  function extractInci(text) {
    var t = String(text || '').replace(/\r/g, '').replace(/-\n(?=[a-z])/g, '').replace(/\n+/g, ' ');
    var m = t.match(/(ingredients|ingr[eé]dients|inci|composition)\s*[:.\-]?\s*([\s\S]+)/i);
    var body = (m ? m[2] : t).replace(/\s{2,}/g, ' ').trim();
    body = body.split(/\b(directions|warnings?|how to use|caution|made in|distributed by)\b/i)[0];
    return body.replace(/[|]/g, 'l').replace(/\s*,\s*/g, ', ').trim();
  }
  function claimsOf(text) {
    var t = String(text || ''), c = [];
    var spf = t.match(/\b[S5][P][F]\s*([0-9OoIl]{1,3})\s*(\+)?/i);
    if (spf) { var n = +spf[1].replace(/[Oo]/g, '0').replace(/[Il]/g, '1'); c.push({ t: 'SPF ' + n + (spf[2] || ''), m: n >= 30 ? 'meets the AAD minimum of SPF 30 for daily use.' : n >= 15 ? 'below the AAD-recommended SPF 30; FDA says SPF 15+ broad spectrum lowers skin-cancer risk when used with other measures.' : 'below SPF 15: FDA says it only helps prevent sunburn.', s: n >= 30 ? 'aad' : 'fda' }); }
    if (/broad[\s-]*spectrum/i.test(t)) c.push({ t: 'Broad spectrum', m: 'protects against both UVA and UVB (FDA labeling term).', s: 'fda' });
    var wr = t.match(/water[\s-]*resistant\s*\(?\s*(40|80)?/i);
    if (wr) c.push({ t: 'Water resistant' + (wr[1] ? ' ' + wr[1] + ' min' : ''), m: 'FDA allows only 40 or 80 minutes; reapply after swimming or sweating.', s: 'fda' });
    if (/water\s*proof|sweat\s*proof|sunblock/i.test(t)) c.push({ t: '“Waterproof / sunblock”', m: 'FDA does not allow these claims on sunscreens; treat with caution.', s: 'fda' });
    return c;
  }
  window.SunScan = { extractInci: extractInci, claimsOf: claimsOf };
  var SRCS = { fda: ['FDA: Sunscreen, how to help protect your skin', 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun'], aad: ['AAD: How to select a sunscreen', 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-select-sunscreen'] };
  var lastText = '';
  function addClaims() {
    var out = $('#inciOut'); if (!out) return; var old = out.querySelector('.px-claims'); if (old) old.remove();
    var c = claimsOf(lastText || ($('#inci') || {}).value); if (!c.length) return;
    var box = el('div', 'px-claims'); c.forEach(function (x) { box.appendChild(el('div', 'px-claim', '<b>' + x.t + '</b>: ' + x.m + ' <a href="' + SRCS[x.s][1] + '" target="_blank" rel="noopener">' + SRCS[x.s][0] + '</a>')); });
    var v = out.querySelector('.verdict'); if (v && v.nextSibling) out.insertBefore(box, v.nextSibling.nextSibling); else out.appendChild(box);
  }
  function buildScanner() {
    var card = $('#inciCard'); if (!card || $('#pxScan')) return;
    var wrap = el('div', 'px-scan'); wrap.id = 'pxScan';
    var left = el('div', 'px-card');
    left.innerHTML = '<p class="px-k">Scan the label</p><div class="px-view" id="pxView"><div class="px-hint" id="pxHint">📷 Point your camera at the <b>ingredients</b> on the back of the bottle,<br>or upload a photo of the label.</div><video id="pxVid" playsinline muted hidden aria-label="Label camera preview"></video><img id="pxImg" alt="Label photo" hidden><div class="px-frame"></div><div class="px-line"></div><div class="px-status" id="pxStat" role="status" aria-live="polite" hidden></div></div>' +
      '<div class="px-btns"><button type="button" id="pxCam">📷 Scan with camera</button><button type="button" id="pxSnap" hidden>● Capture</button><button type="button" class="alt" id="pxUp">⬆ Photo of label</button><button type="button" class="alt" id="pxSample">Try a sample label</button></div><input type="file" id="pxFile" accept="image/*" capture="environment" hidden aria-label="Upload a label photo">' +
      '<p style="font-size:.8rem;margin:.6rem 0 0;opacity:.8">Text is read on your device (Tesseract.js OCR). The photo is not uploaded anywhere.</p>';
    var right = el('div', 'px-card'); right.id = 'pxRight';
    right.innerHTML = '<p class="px-k">Verdict for your skin</p>';
    wrap.appendChild(left); wrap.appendChild(right);
    var h3 = card.querySelector('h3'); if (h3) h3.style.display = 'none';
    // move existing INCI UI into right column
    Array.prototype.slice.call(card.childNodes).forEach(function (n) { if (n !== h3) right.appendChild(n); });
    card.appendChild(wrap);
    card.style.background = 'transparent'; card.style.boxShadow = 'none'; card.style.border = '0'; card.style.padding = '0';
    var stream = null, vid = $('#pxVid'), view = $('#pxView'), stat = $('#pxStat'), im = $('#pxImg'), hint = $('#pxHint');
    function status(t) { stat.hidden = !t; stat.textContent = t || ''; }
    function stop() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } vid.hidden = true; $('#pxSnap').hidden = true; view.classList.remove('live'); }
    function ocr(src) {
      stop(); im.src = src; im.hidden = false; hint.hidden = true; view.classList.add('busy'); status('Loading OCR…');
      return loadTess().then(function (T) { return T.recognize(src, 'eng', { logger: function (m) { if (m.status === 'recognizing text') status('Reading label… ' + Math.round(m.progress * 100) + '%'); } }); })
        .then(function (r) {
          view.classList.remove('busy'); lastText = r.data.text || ''; window.SunScan.text = lastText; var inci = extractInci(lastText);
          if (!inci || inci.length < 8) { status('Could not read ingredients. Try closer, flat, in good light.'); return; }
          status('✓ Read ' + inci.split(',').length + ' ingredients'); $('#inci').value = inci; $('#inciGo').click();
        }).catch(function (e) { view.classList.remove('busy'); status('OCR failed: ' + e.message + '. Paste the list instead.'); });
    }
    window.SunScan.ocr = ocr;
    $('#pxCam').onclick = function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('#pxFile').click(); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false }).then(function (s) {
        stream = s; vid.srcObject = s; vid.hidden = false; im.hidden = true; hint.hidden = true; vid.play(); $('#pxSnap').hidden = false; view.classList.add('live'); status('Fit the ingredient list inside the frame, then Capture.');
      }).catch(function () { status('Camera blocked: upload a photo instead.'); $('#pxFile').click(); });
    };
    $('#pxSnap').onclick = function () { var c = document.createElement('canvas'); c.width = vid.videoWidth; c.height = vid.videoHeight; c.getContext('2d').drawImage(vid, 0, 0); ocr(c.toDataURL('image/jpeg', .92)); };
    $('#pxUp').onclick = function () { $('#pxFile').click(); };
    $('#pxFile').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { ocr(r.result); }; r.readAsDataURL(f); };
    $('#pxSample').onclick = function () { ocr('demo/label.png'); };
    var ta = $('#inci'); if (ta) ta.addEventListener('input', function () { lastText = ''; });
    new MutationObserver(function (ms) { if (ms.some(function (m) { return Array.prototype.some.call(m.addedNodes, function (n) { return n.classList && n.classList.contains('verdict'); }); })) addClaims(); }).observe($('#inciOut'), { childList: true });
  }

  // ---------- Privacy + selfie enrichment ----------
  function buildPrivacy() {
    var pv = document.querySelector('#v-privacy .hx-view-body'); if (!pv || $('#pxPriv')) return;
    var g = el('div', 'px-priv'); g.id = 'pxPriv';
    [['📷', 'Your selfie', 'Sent once to the YouCam API for analysis. SunSkin has no database and stores no photos.'], ['🏷', 'Label scans', 'Read on your own device with Tesseract.js. The label photo never leaves the browser.'], ['📍', 'Location', 'Only coordinates go to Open-Meteo for the UV forecast. Pick a city if you prefer.'], ['📈', 'Progress', 'Earlier scores stay in this browser (localStorage). Clear site data to delete them.']].forEach(function (x) { g.appendChild(el('div', 'px-card', '<div style="font-size:1.8rem">' + x[0] + '</div><h3>' + x[1] + '</h3><p style="margin:0">' + x[2] + '</p>')); });
    pv.insertBefore(g, pv.firstChild);
  }
  function buildSelfie() {
    var cam = $('#cam'); var sec = cam && cam.closest('section'); if (!sec || $('#pxSelfie')) return;
    var tips = el('div', 'px-facts'); tips.id = 'pxSelfie';
    [['☀', 'Even daylight', 'face a window, no harsh shadows'], ['🙂', 'Front-facing', 'whole face in frame, hair back'], ['🚫', 'No make-up', 'make-up hides texture and spots'], ['⚡', '3 YouCam APIs', 'Skin Analysis, Skin Tone, AI Aging']].forEach(function (x) { tips.appendChild(el('div', 'px-fact', '<b>' + x[0] + ' ' + x[1] + '</b>' + x[2])); });
    sec.appendChild(tips);
  }

  // ---------- cold-open fillers ----------
  function ensure(view) {
    var S = getSun();
    if ((view === 'uv' || view === 'plan') && !S) { try { var c = $('#city'); if (c) { c.value = '51.51,-0.13,London'; c.dispatchEvent(new Event('change')); } } catch (e) {} }
    if (view === 'plan' && !getS()) { var j = $('#judge'); if (j && !j.disabled) setTimeout(function () { j.click(); var n = 0, iv = setInterval(function () { var o = $('#out'); if ((o && o.innerText.length > 200) || ++n > 60) { clearInterval(iv); setTimeout(function () { var v = document.getElementById('v-plan'); if (v) v.scrollTo(0, 0); }, 400); } }, 100); }, 50); }
  }
  function init() {
    renderUV(); buildScanner(); buildPrivacy(); buildSelfie();
    var uo = $('#uvout'); if (uo) new MutationObserver(function () { renderUV(); renderPlan(); }).observe(uo, { childList: true });
    var o = $('#out'); if (o) new MutationObserver(function () { renderPlan(); }).observe(o, { childList: true });
    var od = $('#outdoor'); if (od) od.addEventListener('change', renderPlan);
    var cur = (location.hash || '').slice(1); if (cur) ensure(cur);
    window.addEventListener('hashchange', function () { ensure((location.hash || '').slice(1)); });
    var orig = window.ssShowView; if (orig) window.ssShowView = function (v) { orig(v); ensure(v); };
    document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.hx-tab[data-view]'); if (t) ensure(t.getAttribute('data-view')); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();