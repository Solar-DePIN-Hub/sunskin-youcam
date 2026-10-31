// Cold-open every hash, click-test every home link, OCR a sample label. URL=... node e2e/panels.cjs
const { chromium } = require('playwright'); const U = (process.env.URL || 'http://127.0.0.1:8790/').replace(/#.*/, '');
const SH = process.env.SHOTS || 'e2e'; const chk = []; const ok = (n, c, d = '') => chk.push([n, !!c, d]);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  for (const h of ['selfie', 'uv', 'plan', 'check', 'privacy']) {
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(U + '?cold=' + Date.now() + '#' + h); await p.waitForTimeout(h === 'plan' || h === 'uv' ? 5000 : 1500);
    const r = await p.evaluate(v => { const s = document.getElementById('v-' + v); return { vis: s && !s.hidden, txt: s ? s.innerText.length : 0, svg: s ? s.querySelectorAll('svg').length : 0 }; }, h);
    ok(`cold #${h}: view visible and rich`, r.vis && r.txt > 300, JSON.stringify(r));
    if (h === 'uv') ok('uv: dial + hourly curve', r.svg >= 2 && await p.$('#pxUv .px-dial') && await p.$('#pxUv .px-curve'));
    if (h === 'plan') ok('plan: score ring + day timeline', await p.$('#pxPlan .px-ring') && await p.$('#pxPlan .px-curve'));
    ok(`cold #${h}: no JS errors`, !errs.length, errs.join('|').slice(0, 200));
    await p.screenshot({ path: `${SH}/cold_${h}.png` }); await p.close();
  }
  // click-test every home control
  const p = await ctx.newPage(); await p.goto(U);
  const ctrls = await p.$$eval('.hx-tab[data-view],.hx-step[data-view],.hx-get[data-view]', a => a.map((x, i) => [i, x.getAttribute('data-view'), x.className.split(' ')[0]]));
  for (const [i, v, c] of ctrls) {
    await p.goto(U); await p.waitForTimeout(300);
    await (await p.$$('.hx-tab[data-view],.hx-step[data-view],.hx-get[data-view]'))[i].click(); await p.waitForTimeout(400);
    const st = await p.evaluate(v => ({ view: document.body.dataset.view, vis: !document.getElementById('v-' + v).hidden }), v);
    ok(`click ${c}#${i} -> ${v}`, st.view === v && st.vis, JSON.stringify(st));
  }
  // hero CTAs
  for (const sel of ['.hx-cta .judge', '.hx-cta .alt']) { await p.goto(U); const e = await p.$(sel); if (!e) continue; await e.click(); await p.waitForTimeout(2500); ok(`cta ${sel} -> plan with result`, await p.evaluate(() => document.body.dataset.view === 'plan' && document.querySelector('#out').innerText.length > 200)); }
  // OCR sample label
  await p.goto(U + '#check'); await p.waitForTimeout(800); await p.click('#pxSample');
  await p.waitForSelector('#inciOut .verdict', { timeout: 90000, state: 'attached' }).catch(() => {});
  const inci = await p.$eval('#inci', x => x.value).catch(() => '');
  ok('OCR: label read into INCI box', /zinc oxide/i.test(inci) && /glycerin/i.test(inci), inci.slice(0, 120));
  ok('OCR: verdict cards with sources', (await p.$$('#inciOut .ing')).length >= 4 && (await p.$$('#inciOut a[href^="https://"]')).length >= 4);
  ok('OCR: SPF / broad spectrum / water resistant claims', /SPF 50/.test(await p.$eval('#inciOut', x => x.innerText).catch(() => '')) && (await p.$$('#inciOut .px-claim')).length >= 3, await p.evaluate(() => JSON.stringify((window.SunScan.text || '').slice(0, 220))));
  await p.waitForTimeout(500); await p.screenshot({ path: `${SH}/check_ocr.png`, fullPage: false });
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  for (const h of ['uv', 'plan', 'check']) { await m.goto(U + '?m=' + Date.now() + '#' + h); await m.waitForTimeout(4000); ok(`mobile #${h}: no horizontal overflow`, await m.evaluate(() => { const v = document.querySelector('.hx-view:not([hidden])'); return v && v.scrollWidth <= innerWidth + 1; })); await m.screenshot({ path: `${SH}/m_${h}.png` }); }
  await b.close(); let f = 0; chk.forEach(([n, c, d]) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (d && !c ? ' (' + d + ')' : '')); f += !c; });
  console.log(`${chk.length - f}/${chk.length} passed`); process.exit(f ? 1 : 0);
})();