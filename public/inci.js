// SunSkin INCI check: ~25 well-known ingredients, rules taken from the cited public sources only.
// "Concern" thresholds are SunSkin's own trigger (YouCam score below 70, the same line where SunSkin's score bars turn orange), not a clinical cut-off.
(function (root) {
const SRC = {
  fda_aha: ['FDA: Alpha Hydroxy Acids', 'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids'],
  aad_retinoid: ['AAD: Retinoid or retinol?', 'https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol'],
  aad_acne: ['AAD: Adult acne treatment', 'https://www.aad.org/public/diseases/acne/DIY/adult-acne-treatment'],
  aad_acne_tips: ['AAD: Acne tips for managing', 'https://www.aad.org/public/diseases/acne/skin-care/tips'],
  aad_oily: ['AAD: How to control oily skin', 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/oily-skin'],
  aad_rosacea: ['AAD: Rosacea skin care tips', 'https://www.aad.org/public/diseases/rosacea/triggers/tips'],
  aad_dry: ['AAD: Tips for relieving dry skin', 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin'],
  aad_patch: ['AAD: How to test skin care products', 'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products'],
  pmc_rosacea: ['Levin & Miller 2011, OTC cleansers & moisturizers for rosacea (PMC3168246)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3168246/'],
};
// tags: sun = raises sun sensitivity; irr_red = avoid with redness/sensitive; dry_bad = avoid with dry skin;
// dry_good = helps dry skin; acne_good = helps acne/pores; oil_bad = oil-based (avoid if oily/acne); patch = known irritant, test first
const ING = [
  { n: 'Retinol', a: ['retinol'], t: ['sun', 'dry_bad', 'patch', 'night'], s: ['aad_retinoid', 'aad_dry', 'aad_patch'] },
  { n: 'Retinyl Palmitate', a: ['retinyl palmitate'], t: ['sun', 'dry_bad', 'night'], s: ['aad_retinoid', 'aad_dry'] },
  { n: 'Adapalene', a: ['adapalene'], t: ['sun', 'dry_bad', 'acne_good', 'night'], s: ['aad_acne', 'aad_retinoid', 'aad_dry'] },
  { n: 'Glycolic Acid (AHA)', a: ['glycolic acid'], t: ['sun', 'irr_red', 'patch'], s: ['fda_aha', 'aad_rosacea', 'aad_patch'] },
  { n: 'Lactic Acid (AHA)', a: ['lactic acid'], t: ['sun', 'irr_red', 'dry_good'], s: ['fda_aha', 'aad_rosacea', 'aad_dry'] },
  { n: 'Salicylic Acid (BHA)', a: ['salicylic acid'], t: ['acne_good'], s: ['aad_acne', 'aad_oily'] },
  { n: 'Benzoyl Peroxide', a: ['benzoyl peroxide'], t: ['acne_good', 'dry_bad'], s: ['aad_acne', 'aad_acne_tips'] },
  { n: 'Azelaic Acid', a: ['azelaic acid'], t: ['acne_good', 'spots_good'], s: ['aad_acne'] },
  { n: 'Hyaluronic Acid', a: ['hyaluronic acid', 'sodium hyaluronate'], t: ['dry_good'], s: ['aad_dry'] },
  { n: 'Glycerin', a: ['glycerin', 'glycerol'], t: ['dry_good'], s: ['aad_dry'] },
  { n: 'Dimethicone', a: ['dimethicone'], t: ['dry_good'], s: ['aad_dry'] },
  { n: 'Petrolatum', a: ['petrolatum'], t: ['dry_good', 'oil_bad'], s: ['aad_dry', 'aad_oily'] },
  { n: 'Shea Butter', a: ['butyrospermum parkii butter', 'shea butter'], t: ['dry_good'], s: ['aad_dry'] },
  { n: 'Mineral Oil', a: ['mineral oil', 'paraffinum liquidum'], t: ['dry_good', 'oil_bad'], s: ['aad_dry', 'aad_oily'] },
  { n: 'Lanolin', a: ['lanolin'], t: ['dry_good', 'patch'], s: ['aad_dry', 'pmc_rosacea'] },
  { n: 'Ceramides', a: ['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide 3'], t: ['dry_good', 'red_good'], s: ['pmc_rosacea'] },
  { n: 'Alcohol (denatured)', a: ['alcohol denat', 'alcohol denat.', 'sd alcohol', 'alcohol', 'ethanol'], t: ['irr_red', 'dry_bad', 'acne_bad'], s: ['aad_rosacea', 'aad_dry', 'aad_acne_tips'] },
  { n: 'Fragrance (Parfum)', a: ['parfum', 'fragrance', 'aroma'], t: ['irr_red', 'dry_bad', 'patch'], s: ['aad_rosacea', 'aad_dry', 'aad_patch'] },
  { n: 'Menthol', a: ['menthol'], t: ['irr_red'], s: ['aad_rosacea'] },
  { n: 'Camphor', a: ['camphor'], t: ['irr_red'], s: ['aad_rosacea'] },
  { n: 'Sodium Lauryl Sulfate', a: ['sodium lauryl sulfate'], t: ['irr_red'], s: ['aad_rosacea'] },
  { n: 'Urea', a: ['urea'], t: ['irr_red', 'dry_good'], s: ['aad_rosacea', 'pmc_rosacea'] },
  { n: 'Propylene Glycol', a: ['propylene glycol'], t: ['patch'], s: ['pmc_rosacea'] },
  { n: 'Zinc Oxide', a: ['zinc oxide', 'ci 77947'], t: ['spf_good', 'red_good', 'acne_ok'], s: ['aad_oily', 'aad_retinoid'] },
  { n: 'Titanium Dioxide', a: ['titanium dioxide', 'ci 77891'], t: ['spf_good', 'red_good', 'acne_ok'], s: ['aad_oily', 'aad_retinoid'] },
];
const norm = x => x.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 .]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
function parse(text) { return String(text || '').split(/[,;\n•]+/).map(norm).filter(Boolean); }
function profile(s, uvToday, week) {
  s = s || {}; const keys = ['wrinkle', 'pore', 'texture', 'acne', 'redness', 'oiliness', 'moisture', 'radiance', 'age_spot', 'dark_circle_v2'].filter(k => typeof s[k] === 'number');
  const c = k => typeof s[k] === 'number' && s[k] < 70;
  const highUv = (uvToday || 0) >= 6 || (week || []).filter(u => u >= 6).length >= 3;
  return { dry: c('moisture'), red: c('redness'), acne: c('acne') || c('pore'), oily: c('oiliness'), highUv, uv: uvToday || 0, hasScores: keys.length > 0, s };
}
// Returns {verdict: 'buy'|'patch-test'|'skip', found:[...], unknown:n, total:n, reasons}
function check(text, s, uvToday, week) {
  const items = parse(text), p = profile(s, uvToday, week), found = [];
  let unknown = 0;
  items.forEach(it => {
    const g = ING.find(x => x.a.some(a => it === a || (a.length > 6 && it.startsWith(a + ' '))));
    if (!g) { unknown++; return; }
    if (found.find(f => f.n === g.n)) return;
    const T = g.t, notes = []; let level = 'ok';
    const bump = (l, m) => { const r = { ok: 0, good: 1, patch: 2, skip: 3 }; if (r[l] > r[level]) level = l; notes.push(m); };
    if (T.includes('irr_red') && p.red) bump('skip', 'redness is a focus area for you, and dermatologists list it among ingredients to avoid on red, sensitive skin');
    if (T.includes('dry_bad') && p.dry) bump(T.includes('night') || T.includes('acne_good') ? 'patch' : 'skip', 'moisture is a focus area for you, and it can dry the skin');
    if (T.includes('oil_bad') && (p.oily || p.acne)) bump('patch', 'oil-based: choose "oil-free / non-comedogenic" if your skin is oily or breakout-prone');
    if (T.includes('sun')) bump(p.highUv ? 'patch' : 'ok', `raises sun sensitivity: use at night, daily SPF${p.highUv ? `, and this week your UV is high (${p.uv.toFixed(1)} today)` : ''}`);
    if (T.includes('patch') && level === 'ok') bump('patch', 'known to irritate some skin: patch-test 7–10 days first');
    if (T.includes('dry_good') && p.dry) bump('good', 'hydrates: matches your moisture focus');
    if (T.includes('acne_good') && p.acne) bump('good', 'fights breakouts / clogged pores: matches your focus area');
    if (T.includes('red_good') && p.red) bump('good', 'gentle option for red, sensitive skin');
    if (T.includes('spf_good')) bump('good', 'mineral UV filter, recommended for sensitive and breakout-prone skin');
    if (T.includes('spots_good')) bump('good', 'can also fade dark spots left by acne');
    found.push({ n: g.n, level, notes, src: g.s.map(k => ({ t: SRC[k][0], u: SRC[k][1] })) });
  });
  const verdict = found.some(f => f.level === 'skip') ? 'skip' : found.some(f => f.level === 'patch') ? 'patch-test' : 'buy';
  return { verdict, found, unknown, total: items.length, profile: p };
}
const EXAMPLE = 'Aqua, Glycerin, Niacinamide, Alcohol Denat., Retinol, Dimethicone, Sodium Hyaluronate, Parfum, Limonene, Zinc Oxide, Phenoxyethanol';
const api = { ING, SRC, parse, profile, check, EXAMPLE };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SunInci = api;
})(typeof self !== 'undefined' ? self : this);
