// Calculator verification for gta-invest. Run: node test-calc.js
// Expected values come from the two source scripts in ~/workspace/your_files/.
// Scarborough: $881k, 20% down, 4.79%, 25yr -> payment ~$4,034, holding ~$4,484,
//   whole cashflow ~-$1,132, split cashflow ~+$664.
// Burlington flip: $540,000 -> $766,000 -> gross $226,000.
const c = require('./app.js');
const assert = require('assert');
function approx(a, b, tol, label) {
  if (Math.abs(a - b) > tol) throw new Error(label + ': got ' + a + ' expected ~' + b);
  console.log('PASS', label, '=', a.toFixed(2));
}
const s = c.splitRentalCalc({ price: 881000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3352, splitUp: 2999, splitDown: 2149, taxPerYear: 3589, insurancePerMonth: 150 });
approx(s.loan, 704800, 0.01, 'Scarborough loan');
approx(s.payment, 4034, 2, 'Scarborough monthly payment');
approx(s.holding, 4484, 2, 'Scarborough holding');
approx(s.wholeCashflow, -1132, 2, 'Scarborough whole cashflow');
approx(s.splitCashflow, 664, 2, 'Scarborough split cashflow');
const b = c.splitRentalCalc(c.SPLIT_PRESETS.burlington);
approx(b.payment, 3508, 2, 'Burlington payment');
approx(b.holding, 3913, 2, 'Burlington holding');
approx(b.wholeCashflow, -757, 2, 'Burlington whole cashflow');
const m = c.splitRentalCalc(c.SPLIT_PRESETS.markham);
approx(m.payment, 6640, 2, 'Markham payment');
approx(m.holding, 7314, 2, 'Markham holding');
approx(m.splitCashflow, -1714, 2, 'Markham split cashflow');
const f = c.flipCalc({ buy: 540000, reno: 0, costs: 0, sell: 766000 });
approx(f.gross, 226000, 0.01, 'Burlington flip gross');
approx(f.net, 226000, 0.01, 'Burlington flip net (reno/costs 0)');
assert(Math.abs(c.cdrCalc(280, 0.1593) - 44.604) < 0.01, 'CDR GOOG');
console.log('PASS CDR GOOG 280 USD = 44.60 CAD');
const data = require('./data.json');
const sum = data.loss_cases.reduce((t, x) => t + x.loss, 0);
assert.strictEqual(sum, -1529999, 'loss cases sum');
// Headline total $1,530,000 in the scripts is the rounded figure; see data.json meta.notes.
console.log('PASS loss cases sum = -1529999 (headline $1,530,000 is rounded)');
console.log('ALL CALCULATOR CHECKS PASSED');
