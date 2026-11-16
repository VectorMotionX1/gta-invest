// Calculator verification for gta-invest. Run: node test-calc.js (or: npm test)
// Expected values are computed from data.json cases with the Canadian
// semi-annual compounding formula in app.js monthlyPayment(). If you change
// the formula, recompute every expected value here AND the preset-result
// copy in index.html, and record the change in DECISIONS.md.
// Scarborough: $881k, 20% down, 4.79%, 25yr -> payment ~$4,015, holding ~$4,464,
//   whole cashflow ~-$1,112, split cashflow ~+$684.
// Burlington flip: $540,000 -> $766,000 -> gross $226,000.
const c = require('./app.js');
const assert = require('assert');
function approx(a, b, tol, label) {
  if (Math.abs(a - b) > tol) throw new Error(label + ': got ' + a + ' expected ~' + b);
  console.log('PASS', label, '=', a.toFixed(2));
}
const s = c.splitRentalCalc({ price: 881000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3352, splitUp: 2999, splitDown: 2149, taxPerYear: 3589, insurancePerMonth: 150 });
approx(s.loan, 704800, 0.01, 'Scarborough loan');
approx(s.payment, 4015, 2, 'Scarborough monthly payment (Canadian compounding)');
approx(s.holding, 4464, 2, 'Scarborough holding');
approx(s.wholeCashflow, -1112, 2, 'Scarborough whole cashflow');
approx(s.splitCashflow, 684, 2, 'Scarborough split cashflow');
const b = c.splitRentalCalc(c.SPLIT_PRESETS.burlington);
approx(b.payment, 3491, 2, 'Burlington payment');
approx(b.holding, 3896, 2, 'Burlington holding');
approx(b.wholeCashflow, -740, 2, 'Burlington whole cashflow');
const m = c.splitRentalCalc(c.SPLIT_PRESETS.markham);
approx(m.payment, 6609, 2, 'Markham payment');
approx(m.holding, 7283, 2, 'Markham holding');
approx(m.splitCashflow, -1683, 2, 'Markham split cashflow');
// Holding extras: condo fee joins holding; vacancy + maintenance hit net only.
const condo = c.splitRentalCalc({ price: 500000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 2500, splitUp: 0, splitDown: 0, taxPerYear: 3000, insurancePerMonth: 100, condoFeePerMonth: 500 });
approx(condo.holding, 3129, 2, 'Condo holding includes $500 condo fee');
const net = c.splitRentalCalc({ price: 881000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3352, splitUp: 2999, splitDown: 2149, taxPerYear: 3589, insurancePerMonth: 150, vacancyPct: 5, maintenancePerMonth: 200 });
approx(net.splitCashflow, 684, 2, 'Net test: gross split cashflow unchanged');
approx(net.splitNetCashflow, 226, 2, 'Net test: split net after 5% vacancy + $200 maintenance');
approx(c.monthlyPayment(120000, 0, 10), 1000, 0.01, 'Zero-rate payment');
const f = c.flipCalc({ buy: 540000, reno: 0, costs: 0, sell: 766000 });
approx(f.gross, 226000, 0.01, 'Burlington flip gross');
approx(f.net, 226000, 0.01, 'Burlington flip net (reno/costs/commission 0)');
const f2 = c.flipCalc({ buy: 540000, reno: 0, costs: 0, sell: 766000, commissionPct: 5, holdingMonths: 5 });
approx(f2.commission, 38300, 0.01, 'Flip commission 5% of sell price');
approx(f2.net, 187700, 0.01, 'Flip net after 5% commission');
approx(f2.netReturnPct, 34.76, 0.05, 'Flip net return pct');
approx(f2.annualizedReturnPct, 83.42, 0.05, 'Flip annualised return pct (5 months)');
assert(Math.abs(c.cdrCalc(280, 0.1593) - 44.604) < 0.01, 'CDR GOOG');
console.log('PASS CDR GOOG 280 USD = 44.60 CAD');
assert.strictEqual(c.CDR_FACTORS.SPCX, undefined, 'SPCX must not be in CDR_FACTORS (no CDR exists)');
console.log('PASS CDR_FACTORS has no SPCX');
const data = require('./data.json');
const sum = data.loss_cases.reduce((t, x) => t + x.loss, 0);
assert.strictEqual(sum, -1529999, 'loss cases sum');
// Headline total $1,530,000 in the scripts is the rounded figure; see data.json meta.notes.
console.log('PASS loss cases sum = -1529999 (headline $1,530,000 is rounded)');
// Subscribe payload: locked contract with property-playbooks /api/signup.
// See docs/leads.md. Changing product/source breaks list segmentation.
assert.strictEqual(c.SUBSCRIBE_ENDPOINT, 'https://property-playbooks.vercel.app/api/signup', 'subscribe endpoint');
assert.deepStrictEqual(
  c.subscribePayload('  Test@Example.com '),
  { email: 'Test@Example.com', name: null, product: 'gta-invest', source: 'gta-invest-subscribe' },
  'subscribe payload trims email and carries locked product/source'
);
console.log('PASS subscribe payload contract (endpoint + product/source)');
console.log('ALL CALCULATOR CHECKS PASSED');
