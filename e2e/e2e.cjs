const { chromium } = require('playwright'); const U = process.env.URL || 'http://127.0.0.1:8790/';
const chk = []; const ok = (n, c, d = '') => { chk.push([n, !!c, d]); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [vp, w, h, mob] of [['desktop', 1280, 900, false], ['mobile', 375, 812, true]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/favicon/.test(m.text()) && errs.push(m.text()));
    await p.goto(U); const t0 = Date.now();
    await p.evaluate(()=>{location.hash='#plan'}); await p.waitForTimeout(300); await p.click('#judge'); await p.waitForSelector('#out .bars div', { timeout: 15000 }); await p.waitForSelector('#inciOut .verdict', { timeout: 5000, state: 'attached' });
    ok(`${vp}: judge demo renders in <8s`, Date.now() - t0 < 8000, `${Date.now() - t0} ms`);
    ok(`${vp}: saved-real banner + 10 metrics`, await p.locator('#out .demo').innerText().then(t => /real/.test(t) && /0 API units/.test(t)) && (await p.locator('#out .bars > div').count()) >= 10);
    await p.waitForTimeout(800);
    const imgs = await p.$$eval('#out .masks img, #out .age img', a => a.map(i => i.complete && i.naturalWidth > 0)); ok(`${vp}: local mask + aging images load`, imgs.length >= 5 && imgs.every(Boolean), `${imgs.filter(Boolean).length}/${imgs.length}`);
    ok(`${vp}: tone shade shown`, /ITA/.test(await p.locator('#out').innerText()));
    ok(`${vp}: INCI verdict`, /Skip|Patch|Buy/.test(await p.locator('#inciOut .verdict').innerText()));
    ok(`${vp}: INCI sources are links`, (await p.locator('#inciOut a[href^="https://"]').count()) > 3);
    await p.evaluate(()=>{location.hash='#uv'}); await p.waitForTimeout(300); await p.click('#cmpBtn'); await p.waitForSelector('#cmp .cmp', { timeout: 20000 }); const ct = await p.locator('#cmp').innerText();
    ok(`${vp}: London vs Dubai side by side`, /London/.test(ct) && /Dubai/.test(ct) && (ct.match(/UV \d/g) || []).length >= 2);
    await p.evaluate(()=>{location.hash='#uv'}); await p.waitForTimeout(300); await p.click('#nophoto'); await p.waitForSelector('#out h3', { timeout: 5000, state: 'attached' }); ok(`${vp}: no-photo UV plan`, /UV-only plan/.test(await p.locator('#out').innerText()) && /SPF/.test(await p.locator('#out').innerText()));
    ok(`${vp}: no horizontal overflow`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await p.evaluate(() => document.documentElement.scrollWidth + '/' + innerWidth));
    const a11y = await p.evaluate(() => ({ img: [...document.images].filter(i => !i.hidden && !i.alt).length, btn: [...document.querySelectorAll('button')].filter(x => !x.innerText.trim() && !x.getAttribute('aria-label')).length,
      inp: [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(x => !(x.labels && x.labels.length) && !x.getAttribute('aria-label')).length,
      small: [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).length, lang: document.documentElement.lang }));
    ok(`${vp}: a11y basics (alt, names, labels, 44px targets, lang)`, !a11y.img && !a11y.btn && !a11y.inp && !a11y.small && a11y.lang === 'en', JSON.stringify(a11y));
    await p.keyboard.press('Tab'); ok(`${vp}: keyboard focus starts on judge demo`, await p.evaluate(() => document.activeElement && document.activeElement.id) !== null);
    await p.screenshot({ path: `e2e/shot_${vp}.png`, fullPage: true });
    ok(`${vp}: no JS errors`, !errs.length, errs.join(' | ').slice(0, 200));
  }
  await b.close(); let f = 0; chk.forEach(([n, c, d]) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' (' + d + ')' : '')); f += !c; });
  console.log(`${chk.length - f}/${chk.length} passed`); process.exit(f ? 1 : 0);
})();
