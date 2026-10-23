const $ = s => document.querySelector(s); let img = null, sun = null, keyOk = null;
const SAMPLE = { wrinkle: 62, pore: 58, texture: 60, acne: 70, redness: 55, oiliness: 47, moisture: 42, radiance: 61, age_spot: 69, dark_circle_v2: 50 };
const uvColor = u => u < 3 ? '#52b788' : u < 6 ? '#f4a261' : u < 8 ? '#e76f51' : u < 11 ? '#d62828' : '#7b2cbf';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
fetch('/api/health').then(r => r.json()).then(j => { keyOk = j.youcamKeyConfigured; $('#mode').textContent = keyOk ? 'Live: real YouCam API' : 'Demo mode: no YouCam key on this server, sample scores will be shown'; }).catch(() => {});
const ready = () => { $('#go').disabled = !img; };
$('#up').onclick = () => $('#file').click();
$('#file').onchange = e => { const f = e.target.files[0]; if (f) shrink(URL.createObjectURL(f)); };
$('#cam').onclick = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } } }); $('#v').srcObject = s; $('#v').hidden = false; $('#snap').hidden = false; } catch (e) { alert('Camera blocked. Upload a photo instead.'); } };
$('#snap').onclick = () => { const v = $('#v'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); v.srcObject.getTracks().forEach(t => t.stop()); v.hidden = true; $('#snap').hidden = true; shrink(c.toDataURL('image/jpeg', .92)); };
// Resize to YouCam SD limits (long side <= 2560, short side >= 480) and check lighting before spending API units.
function shrink(src) {
  const i = new Image(); i.onerror = () => { $('#qc').innerHTML = '<div class="warn">⚠️ Could not read this file. Please use a JPG or PNG photo.</div>'; }; i.onload = () => {
    const k = Math.min(1, 1600 / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
    const g = c.getContext('2d'); g.drawImage(i, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; let lum = 0; for (let p = 0; p < d.length; p += 16) lum += .2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]; lum /= d.length / 16;
    const issues = []; if (Math.min(c.width, c.height) < 480) issues.push('Photo is small: the short side should be at least 480 px.'); if (lum < 70) issues.push('Photo is dark: face a window or turn on a light.'); if (lum > 215) issues.push('Photo is overexposed: avoid direct flash or sun.');
    $('#qc').innerHTML = issues.length ? `<div class="warn">⚠️ ${issues.join(' ')} Results may be less accurate.</div>` : '<div class="note">✓ Lighting and size look good.</div>';
    img = c.toDataURL('image/jpeg', .9); $('#shot').src = img; $('#shot').hidden = false; ready();
  }; i.src = src;
}
async function loadSun(lat, lon, place) {
  $('#uvout').textContent = 'Loading UV forecast…';
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&hourly=uv_index&timezone=auto&forecast_days=7`).then(r => r.json());
    const today = r.hourly.time.map((t, i) => ({ t, uv: r.hourly.uv_index[i] })).filter(x => x.t.startsWith(r.daily.time[0])).map(x => ({ h: +x.t.slice(11, 13), uv: x.uv ?? 0 }));
    sun = { today: r.daily.uv_index_max[0] ?? 0, week: r.daily.uv_index_max.map(x => x ?? 0), days: r.daily.time, window: SunPlan.uvWindow(today), place };
    const w = sun.window, dn = d => new Date(d + 'T12:00').toLocaleDateString('en', { weekday: 'short' });
    $('#uvout').innerHTML = `<span class="uvbig" style="color:${uvColor(sun.today)}">UV ${sun.today.toFixed(1)}</span> ${SunPlan.uvLabel(sun.today)} today${place ? ' in ' + esc(place) : ''}<br>
      <span class="note">${w ? `Protect your skin from <b>${w.from}:00 to ${w.to}:00</b> (UV ≥ 3), peak at ${w.peakHour}:00.` : 'UV stays below 3 all day.'}</span>
      <div class="week">${sun.week.map((u, i) => `<div style="background:${uvColor(u)}">${dn(sun.days[i])}<br>${u.toFixed(0)}</div>`).join('')}</div><div class="note">7-day max UV (Open-Meteo)</div>`;
  } catch (e) { sun = { today: 5, week: [5], window: null }; $('#uvout').textContent = 'UV forecast unavailable, using UV 5 (moderate).'; }
}
$('#loc').onclick = () => navigator.geolocation.getCurrentPosition(p => loadSun(p.coords.latitude, p.coords.longitude, ''), () => loadSun(50.45, 30.52, 'Kyiv (location blocked)'));
$('#city').onchange = e => { const [a, b, n] = e.target.value.split(','); if (n) loadSun(+a, +b, n); };
$('#go').onclick = async () => {
  if (!sun) await loadSun(50.45, 30.52, 'Kyiv (default)');
  $('#out').innerHTML = '<p>Analyzing with YouCam AI Skin Analysis… (usually 5–15 s)</p>'; $('#go').disabled = true;
  let s, masks = {}, demo = false, ms = null, tone = null, aging = null;
  try {
    const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: img, tone: $('#optTone').checked, aging: $('#optAge').checked }) }).then(r => r.json());
    if (r.demo) { demo = true; s = SAMPLE; } else if (r.error) throw new Error(r.error); else { const n = SunPlan.norm(r.result); s = n.scores; masks = n.masks; ms = r.ms; tone = r.tone; aging = r.aging; if (!Object.keys(s).length) throw new Error('No scores returned. Try a clearer, front-facing photo.'); }
  } catch (e) { $('#out').innerHTML = `<p class="warn">Could not analyze: ${esc(e.message)}</p>`; ready(); return; }
  ready(); render(s, masks, demo, ms, tone, aging, false);
};
$('#sample').onclick = async () => { if (!sun) await loadSun(50.45, 30.52, 'Kyiv (default)'); render(SAMPLE, {}, true, null, $('#optTone').checked ? { skin_color: '#c69c7f' } : null, null, true); };
function render(s, masks, demo, ms, tone, aging, sample) {
  const p = SunPlan.plan(s, sun.today, { week: sun.week, outdoor: $('#outdoor').checked, window: sun.window });
  const ta = tone && !tone.error ? SunPlan.toneAdvice(tone.skin_color) : null;
  if (ta) { const i = p.buy.findIndex(b => !b.must); if (i < 0) p.buy.push(ta.product); else p.buy.splice(i, 0, ta.product); }
  // Progress: compare with the previous real scan saved on this device (localStorage only).
  let prev = null, hist = [];
  if (!demo && !sample) { try { hist = JSON.parse(localStorage.getItem('sunskin.hist') || '[]'); } catch (e) {} prev = hist[hist.length - 1] || null; hist.push({ t: Date.now(), s }); localStorage.setItem('sunskin.hist', JSON.stringify(hist.slice(-12))); }
  const pr = prev ? SunPlan.progress(prev.s, s) : [];
  const fr = aging && !aging.error && aging.raw && Array.isArray(aging.raw.output) ? aging.raw.output.filter(f => f.url && typeof f.res_age === 'number') : [];
  const nowAge = s.skin_age != null ? Math.round(s.skin_age) : null;
  const pick = fr.length ? SunPlan.agingPick(fr, nowAge != null ? [nowAge, nowAge + 20] : [fr[0].res_age, fr[fr.length - 1].res_age]) : [];
  const N = SunPlan.NAMES, dn = i => i === 0 ? 'Tonight' : new Date((sun.days || [])[i] + 'T12:00').toLocaleDateString('en', { weekday: 'short' });
  const list = p.buy.map(b => `• ${b.name}: ${b.why}`).join('\n');
  $('#out').innerHTML = (sample ? '<p class="demo">Sample result: example scores to show the layout, <b>not your skin</b>. Upload a selfie and press "Analyze my skin" for your real YouCam result.</p>' : demo ? '<p class="demo">Demo mode: this server has no YouCam API key, so these are SAMPLE scores, not your skin.</p>' : `<p class="note">YouCam AI Skin Analysis · 10 metrics${ms ? ` · ${(ms / 1000).toFixed(1)} s` : ''}</p>${s.all != null || s.skin_age != null ? `<p>${s.all != null ? `Overall skin score <b>${Math.round(s.all)}</b>/100` : ''}${s.all != null && s.skin_age != null ? ' · ' : ''}${s.skin_age != null ? `AI skin age <b>${Math.round(s.skin_age)}</b>` : ''}</p>` : ''}`) +
  `<div class="grid2"><div><h3>Your skin <small class="note">(YouCam score, 100 = best)</small></h3><div class="bars">${Object.keys(N).filter(k => s[k] != null).map(k => `<div>${N[k]}: <b>${Math.round(s[k])}</b><div class="bar"><i style="width:${s[k]}%;background:${s[k] >= 70 ? '#52b788' : s[k] >= 50 ? '#f4a261' : '#e63946'}"></i></div></div>`).join('')}</div></div>
  <div><h3>Focus areas</h3>${p.top.map(k => `<span class="pill">${N[k]} ${Math.round(s[k])}</span>`).join('')}
  ${Object.keys(masks).length ? `<div class="masks">${p.top.filter(k => masks[k]).map(k => `<figure><img src="${esc(masks[k])}" alt="${N[k]} map"><figcaption>${N[k]}: where YouCam found it</figcaption></figure>`).join('')}</div>` : ''}
  <h3 style="margin-top:14px">Today · UV ${sun.today.toFixed(1)} <span class="pill">${SunPlan.uvLabel(sun.today)}</span></h3>
  ${p.reapply.length ? `<p>⏰ Reapply sunscreen at <b>${p.reapply.join(', ')}</b></p>` : '<p class="note">No reapply reminders needed today.</p>'}</div></div>
  ${pr.length ? `<div class="card" style="box-shadow:none;background:#faf6ee;padding:10px 14px;margin:10px 0"><b>Since your last scan</b> (${new Date(prev.t).toLocaleDateString('en')}): <span class="prog">${pr.map(x => `<span class="${x.d > 0 ? 'up' : x.d < 0 ? 'down' : ''}">${x.name} ${x.d > 0 ? '+' : ''}${x.d}</span>`).join('')}</span></div>` : ''}
  ${ta ? `<h3>🧴 Your sunscreen shade <small class="note">(YouCam Skin Tone Analysis)</small></h3><p><span class="sw2" style="background:${esc(tone.skin_color)}"></span>Skin tone <b>${esc(tone.skin_color)}</b> · ITA ${ta.ita}° (<b>${ta.band}</b>) → tinted SPF shade <b>${ta.shade}</b>${sample ? ' <span class="pill">sample</span>' : ''}</p><p class="note">${esc(ta.note)} Lighting changes measured colour, so shoot in daylight.</p>` : (tone && tone.error ? `<p class="note">Skin tone: ${esc(tone.error)}</p>` : '')}
  ${pick.length ? `<h3>⏳ Why today's SPF matters <small class="note">(YouCam AI Aging)</small></h3><div class="age">${pick.map((f, i) => `<figure><img src="${esc(f.url)}" alt="AI aging preview at ${f.res_age}"><figcaption>${i === 0 ? 'Around now' : '+20 years'} · age ${f.res_age}</figcaption></figure>`).join('')}<figure style="width:200px;text-align:left"><img id="ageImg" src="${esc(fr[0].url)}" alt="AI aging slider"><input type="range" id="ageR" min="0" max="${fr.length - 1}" value="0"><figcaption id="ageL">age ${fr[0].res_age}</figcaption></figure></div><p class="note">Generative preview, not a prediction. UV exposure is linked to about 80% of visible signs of facial ageing (Flament et al., <i>Clin Cosmet Investig Dermatol</i> 2013), and daily sunscreen is the most proven way to slow it.</p>` : (aging && aging.error ? `<p class="note">AI Aging: ${esc(aging.error)}</p>` : '')}
  <div class="grid2"><div><h3>☀️ Morning</h3><ol>${p.am.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div><div><h3>🌙 Night</h3><ol>${p.pm.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></div>
  <h3>📅 Your UV-aware week</h3><div class="cal">${p.calendar.map((d, i) => `<div><b>${dn(i)}</b><br>UV ${d.uv.toFixed(0)}<br>${d.retinoid ? '🌙 retinoid' : d.bha ? '🧪 BHA' : '💧 hydrate'}</div>`).join('')}</div>
  <p class="note">SunSkin rule: retinoids make skin more sun-sensitive, so they are scheduled only on nights before a day with max UV below 6.</p>
  <h3>🛒 Shopping list</h3><div class="prod">${p.buy.map(b => `<div class="${b.must ? 'must' : ''}">${b.must ? '<span class="pill">today</span><br>' : ''}<b>${esc(b.name)}</b><br><span class="note">key: ${esc(b.key)}</span><br><small>why: ${esc(b.why)}</small><br><a target="_blank" rel="noopener" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(b.name)}">Find it →</a></div>`).join('')}</div>
  <div class="row" style="margin-top:10px"><button class="alt" id="copy">📋 Copy shopping list</button></div>`;
  if ($('#ageR')) $('#ageR').oninput = e => { const f = fr[+e.target.value]; $('#ageImg').src = f.url; $('#ageL').textContent = 'age ' + f.res_age; };
  $('#copy').onclick = () => navigator.clipboard.writeText('SunSkin shopping list\n' + list).then(() => { $('#copy').textContent = '✓ Copied'; });
}
