// Data consistency checks for gta-invest. Run: node validate-data.js (or: npm test)
// data.json is the structured source of truth for cases. index.html renders the
// same numbers as static HTML and app.js holds the same presets/factors, so
// this script fails the build when the three copies drift apart.
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const c = require('./app.js');
const data = require('./data.json');

function pass(msg) { console.log('PASS ' + msg); }

// 1. Loss cases: itemised sum and rounded headline must stay as documented.
const sum = data.loss_cases.reduce((t, x) => t + x.loss, 0);
assert.strictEqual(sum, -1529999, 'loss_cases must sum to -1529999, got ' + sum);
assert.strictEqual(data.loss_total, -1530000, 'loss_total headline must be -1530000 (rounded)');
pass('loss cases sum = -1529999, headline -1530000 (rounded, $1 difference documented)');
assert.strictEqual(data.loss_cases.length, 7, 'loss_cases must have 7 cases');
for (const x of data.loss_cases) {
  assert.strictEqual(x.sell_price - x.buy_price, x.loss, 'loss mismatch for ' + x.id);
  assert.ok(x.buy_date && x.sell_date, 'missing dates for ' + x.id);
}
pass('all 7 loss cases: sell - buy == loss, dates present');

// 2. CDR factors in app.js must match data.json for tickers that have a CDR.
for (const row of data.cdr_factors) {
  if (row.has_cdr) {
    assert.strictEqual(c.CDR_FACTORS[row.ticker], row.factor, 'CDR factor mismatch for ' + row.ticker);
  } else {
    assert.strictEqual(c.CDR_FACTORS[row.ticker], undefined, row.ticker + ' has no CDR and must not be in CDR_FACTORS');
  }
}
assert.strictEqual(Object.keys(c.CDR_FACTORS).length, 3, 'CDR_FACTORS must list exactly 3 tickers');
pass('CDR factors match data.json (3 tickers with CDR, SPCX excluded)');

// 3. Split presets in app.js must match data.json split_rental_cases.
const byId = {};
for (const x of data.split_rental_cases) byId[x.id] = x;
const presetMap = { scarborough: 'scarborough-laurel', burlington: 'burlington-maryvale', markham: 'markham-southdale' };
for (const key of Object.keys(presetMap)) {
  const p = c.SPLIT_PRESETS[key];
  const d = byId[presetMap[key]];
  assert.ok(p && d, 'missing preset/case for ' + key);
  assert.strictEqual(p.price, d.sell_price, 'preset price mismatch for ' + key);
  assert.strictEqual(p.taxPerYear, d.tax_per_year, 'preset tax mismatch for ' + key);
  assert.strictEqual(p.insurancePerMonth, d.insurance_per_month, 'preset insurance mismatch for ' + key);
  assert.strictEqual(p.wholeRent, d.whole_rent_estimate, 'preset whole rent mismatch for ' + key);
  assert.strictEqual(p.splitUp, d.split_rent_up === null ? 0 : d.split_rent_up, 'preset split-up mismatch for ' + key);
  assert.strictEqual(p.splitDown, d.split_rent_down === null ? 0 : d.split_rent_down, 'preset split-down mismatch for ' + key);
  assert.ok(p.note && p.note.length > 10, 'preset note missing for ' + key);
}
pass('split presets match data.json (price, tax, insurance, rents) and carry notes');

// 4. index.html must render the same loss cases (no silent drift).
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for (const x of data.loss_cases) {
  assert.ok(html.includes(x.address), 'index.html missing address: ' + x.address);
  assert.ok(html.includes('data-sort-val="' + x.buy_price + '"'), 'index.html missing buy price for ' + x.id);
  assert.ok(html.includes('data-sort-val="' + x.sell_price + '"'), 'index.html missing sell price for ' + x.id);
}
pass('index.html loss table matches data.json (addresses + buy/sell prices)');

// 5. Honesty guards: no stale promises, no SPCX option, subscribe wired.
assert.ok(!html.includes('每周更新'), 'index.html must not promise weekly updates without a pipeline');
assert.ok(!html.includes('value="SPCX"'), 'index.html must not offer an SPCX CDR option');
assert.ok(!html.includes('buttondown.com'), 'index.html must not post to Buttondown (retired 2026-11-15, see docs/leads.md)');
assert.ok(html.includes('id="subscribe-form"'), 'subscribe form must exist in index.html');
const appSrc = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert.ok(appSrc.includes('https://property-playbooks.vercel.app/api/signup'), 'app.js must post subscribe to the shared /api/signup endpoint');
assert.ok(appSrc.includes("SUBSCRIBE_PRODUCT = 'gta-invest'"), 'app.js must carry the locked product value');
assert.ok(appSrc.includes("SUBSCRIBE_SOURCE = 'gta-invest-subscribe'"), 'app.js must carry the locked source value');
assert.ok(html.includes('rel="canonical"'), 'index.html must carry a canonical link');
assert.ok(html.includes('半年复利'), 'index.html must disclose Canadian semi-annual compounding');
pass('honesty guards: no weekly-update promise, no SPCX option, no Buttondown, shared /api/signup + locked product/source + canonical + compounding disclosed');

// 6. README must describe the live setup, not the pre-launch draft.
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
assert.ok(readme.includes('vectormotionx1.github.io/gta-invest'), 'README must link the live site');
assert.ok(!readme.includes('git init'), 'README must not contain the stale git-init push block');
assert.ok(!readme.includes('本机目前没有 GitHub token'), 'README must not contain the stale no-token push note');
assert.ok(readme.includes('MailerLite') && readme.includes('Supabase'), 'README must document the MailerLite + Supabase subscribe wiring');
assert.ok(!readme.includes('buttondown.com/api/emails'), 'README must not describe the retired Buttondown wiring as live');
pass('README describes the live setup (URL, MailerLite + Supabase, no stale push block, no live Buttondown wiring)');

console.log('ALL DATA CHECKS PASSED');
