/* gta-invest — vanilla JS, no external dependencies, works offline.
   Pure calculation functions are exported for Node testing when available. */
'use strict';

function toNum(v, fallback) {
  var n = parseFloat(v);
  return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}

/* Canadian mortgages compound semi-annually: effective monthly rate
   = (1 + annualRate/2)^(2/12) - 1. Do NOT use the US-style annual/12 rate.
   See DECISIONS.md (2026-11-15) and test-calc.js for expected values. */
function monthlyPayment(loan, annualRatePct, years) {
  loan = toNum(loan, 0); annualRatePct = toNum(annualRatePct, 0); years = toNum(years, 0);
  if (loan <= 0 || years <= 0) return 0;
  var n = years * 12;
  if (annualRatePct === 0) return loan / n;
  var r = Math.pow(1 + annualRatePct / 100 / 2, 2 / 12) - 1;
  var f = Math.pow(1 + r, n);
  return loan * r * f / (f - 1);
}

function holdingCost(price, downPct, ratePct, years, taxPerYear, insurancePerMonth, condoFeePerMonth) {
  var loan = toNum(price, 0) * (1 - toNum(downPct, 0) / 100);
  var pay = monthlyPayment(loan, ratePct, years);
  var condo = toNum(condoFeePerMonth, 0);
  var holding = pay + toNum(taxPerYear, 0) / 12 + toNum(insurancePerMonth, 0) + condo;
  return { loan: loan, payment: pay, holding: holding, condoFee: condo };
}

function splitRentalCalc(o) {
  var h = holdingCost(o.price, o.downPct, o.ratePct, o.years, o.taxPerYear, o.insurancePerMonth, o.condoFeePerMonth);
  var whole = toNum(o.wholeRent, 0);
  var split = toNum(o.splitUp, 0) + toNum(o.splitDown, 0);
  var vacancyPct = toNum(o.vacancyPct, 0);
  var maintenance = toNum(o.maintenancePerMonth, 0);
  var kept = 1 - vacancyPct / 100;
  return {
    loan: h.loan, payment: h.payment, holding: h.holding, condoFee: h.condoFee,
    wholeRent: whole, splitRent: split,
    wholeCashflow: whole - h.holding,
    splitCashflow: split - h.holding,
    wholeNetCashflow: whole * kept - h.holding - maintenance,
    splitNetCashflow: split * kept - h.holding - maintenance,
    difference: split - whole
  };
}

function flipCalc(o) {
  var buy = toNum(o.buy, 0), reno = toNum(o.reno, 0), costs = toNum(o.costs, 0), sell = toNum(o.sell, 0);
  var commission = sell * toNum(o.commissionPct, 0) / 100;
  var holdingMonths = toNum(o.holdingMonths, 0);
  var gross = sell - buy;
  var totalCost = buy + reno + costs;
  var net = sell - totalCost - commission;
  var netReturnPct = totalCost > 0 ? net / totalCost * 100 : 0;
  return {
    gross: gross, net: net, totalCost: totalCost, commission: commission,
    holdingMonths: holdingMonths,
    netReturnPct: netReturnPct,
    annualizedReturnPct: holdingMonths > 0 ? netReturnPct * 12 / holdingMonths : 0,
    grossPct: buy > 0 ? gross / buy * 100 : 0
  };
}

function cdrCalc(usdPrice, factor) {
  return toNum(usdPrice, 0) * toNum(factor, 0);
}

function fmt(n, decimals) {
  if (!isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: decimals === undefined ? 0 : decimals, maximumFractionDigits: decimals === undefined ? 0 : decimals });
}
function fmtSigned(n, decimals) {
  if (!isFinite(n)) return '—';
  var sign = n < 0 ? '−' : (n > 0 ? '+' : '');
  return sign + fmt(Math.abs(n), decimals);
}
function fmtPct(n, decimals) {
  if (!isFinite(n)) return '—';
  return n.toFixed(decimals === undefined ? 1 : decimals) + '%';
}

/* CDR factors are approximations from the October 2026 case period and move
   daily. They must match data.json cdr_factors (validate-data.js checks this).
   Only tickers with a real CDR are listed here. SPCX has no CDR and is kept
   only in data.json as a reference row; it must NOT appear in the selector. */
var CDR_FACTORS = { GOOG: 0.1593, NVDA: 0.223, ISRG: 0.0517 };

var SPLIT_PRESETS = {
  scarborough: { label: 'Scarborough 31A Laurel Ave', price: 881000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3352, splitUp: 2999, splitDown: 2149, taxPerYear: 3589, insurancePerMonth: 150, condoFeePerMonth: 0, vacancyPct: 0, maintenancePerMonth: 0, note: '分租 $5,148 为挂牌要价，不是已签合同。先看毛账，再自己填空置和维修预留看净账。' },
  burlington: { label: 'Burlington 2379 Maryvale Ct', price: 766000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3156, splitUp: 0, splitDown: 0, taxPerYear: 3420, insurancePerMonth: 120, condoFeePerMonth: 0, vacancyPct: 0, maintenancePerMonth: 0, note: '本案例无分租记录，分租栏为 0，仅供你自己试算；这套的重点是翻新转手，请看翻新计算器。' },
  markham: { label: 'Markham 23 Southdale Dr（未售出）', price: 1450000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3570, splitUp: 3100, splitDown: 2500, taxPerYear: 5692, insurancePerMonth: 200, condoFeePerMonth: 0, vacancyPct: 0, maintenancePerMonth: 0, note: '价格为挂牌价，不是成交价；该房挂牌 137 天后终止，未售出。下层未写明已是合法套间，须向市政核实。' }
};

function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }

function renderSplit() {
  var downPct = toNum(getVal('sp-down'), 20);
  var r = splitRentalCalc({
    price: getVal('sp-price'), downPct: downPct, ratePct: getVal('sp-rate'),
    years: getVal('sp-years'), wholeRent: getVal('sp-whole'),
    splitUp: getVal('sp-up'), splitDown: getVal('sp-down-rent'),
    taxPerYear: getVal('sp-tax'), insurancePerMonth: getVal('sp-ins'),
    condoFeePerMonth: getVal('sp-condo'),
    vacancyPct: getVal('sp-vacancy'), maintenancePerMonth: getVal('sp-maint')
  });
  var set = function (id, text, cls) { var el = document.getElementById(id); if (!el) return; el.textContent = text; el.className = cls || ''; };
  set('sp-loan', fmt(r.loan));
  set('sp-payment', fmt(r.payment));
  set('sp-holding', fmt(r.holding), 'big');
  set('sp-whole-cf', fmtSigned(r.wholeCashflow), r.wholeCashflow < 0 ? 'neg' : 'pos');
  set('sp-split-cf', fmtSigned(r.splitCashflow), r.splitCashflow < 0 ? 'neg' : 'pos');
  set('sp-whole-net', fmtSigned(r.wholeNetCashflow), r.wholeNetCashflow < 0 ? 'neg' : 'pos');
  set('sp-split-net', fmtSigned(r.splitNetCashflow), r.splitNetCashflow < 0 ? 'neg' : 'pos');
  set('sp-diff', fmtSigned(r.difference), r.difference < 0 ? 'neg' : 'pos');
  var warn = document.getElementById('sp-cmhc-warning');
  if (warn) {
    warn.style.display = (downPct >= 0 && downPct < 20) ? '' : 'none';
  }
}

function renderFlip() {
  var r = flipCalc({ buy: getVal('fl-buy'), reno: getVal('fl-reno'), costs: getVal('fl-costs'), sell: getVal('fl-sell'), commissionPct: getVal('fl-commission'), holdingMonths: getVal('fl-months') });
  var set = function (id, text, cls) { var el = document.getElementById(id); if (!el) return; el.textContent = text; el.className = cls || ''; };
  set('fl-gross', fmtSigned(r.gross), r.gross < 0 ? 'neg' : 'pos');
  set('fl-gross-pct', fmtPct(r.grossPct), r.grossPct < 0 ? 'neg' : 'pos');
  set('fl-commission-out', fmt(r.commission));
  set('fl-total', fmt(r.totalCost));
  set('fl-net', fmtSigned(r.net), r.net < 0 ? 'neg' : 'pos');
  set('fl-return', fmtPct(r.netReturnPct), r.netReturnPct < 0 ? 'neg' : 'pos');
  set('fl-annualized', r.holdingMonths > 0 ? fmtPct(r.annualizedReturnPct) : '—', r.annualizedReturnPct < 0 ? 'neg' : 'pos');
}

function renderCdr() {
  var sel = document.getElementById('cdr-ticker');
  var ticker = sel ? sel.value : 'GOOG';
  var factor = CDR_FACTORS[ticker] || 0;
  var usd = toNum(getVal('cdr-usd'), 0);
  var out = document.getElementById('cdr-out');
  if (out) out.textContent = usd > 0 ? '约 ' + fmt(cdrCalc(usd, factor), 2) + ' 加元 / CDR' : '—';
  var note = document.getElementById('cdr-note');
  if (note) {
    note.textContent = '因子约 ' + factor + '（2026 年 10 月案例期间的约算值），每日浮动，仅为约算值。CDR 价格还受汇率对冲、费用等因素影响，请以 CIBC 官网为准。';
  }
}

function applyPreset(key) {
  var p = SPLIT_PRESETS[key]; if (!p) return;
  setVal('sp-price', p.price); setVal('sp-down', p.downPct); setVal('sp-rate', p.ratePct);
  setVal('sp-years', p.years); setVal('sp-whole', p.wholeRent); setVal('sp-up', p.splitUp);
  setVal('sp-down-rent', p.splitDown); setVal('sp-tax', p.taxPerYear); setVal('sp-ins', p.insurancePerMonth);
  setVal('sp-condo', p.condoFeePerMonth); setVal('sp-vacancy', p.vacancyPct); setVal('sp-maint', p.maintenancePerMonth);
  var note = document.getElementById('sp-preset-note');
  if (note) note.textContent = p.note || '';
  var btns = document.querySelectorAll('[data-preset]');
  btns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-preset') === key); });
  renderSplit();
}

function sortLossTable(th) {
  var table = th.closest('table'); if (!table) return;
  var tbody = table.querySelector('tbody'); if (!tbody) return;
  var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
  var asc = th.getAttribute('data-sort') !== 'asc';
  table.querySelectorAll('th').forEach(function (h) { h.removeAttribute('data-sort'); });
  th.setAttribute('data-sort', asc ? 'asc' : 'desc');
  var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr:not(.total)'));
  rows.sort(function (a, b) {
    var av = a.children[idx].getAttribute('data-sort-val') || a.children[idx].textContent;
    var bv = b.children[idx].getAttribute('data-sort-val') || b.children[idx].textContent;
    var an = parseFloat(String(av).replace(/[^0-9.\-]/g, ''));
    var bn = parseFloat(String(bv).replace(/[^0-9.\-]/g, ''));
    if (isFinite(an) && isFinite(bn)) return asc ? an - bn : bn - an;
    return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
  rows.forEach(function (r) { tbody.appendChild(r); });
  var total = tbody.querySelector('tr.total');
  if (total) tbody.appendChild(total);
}

function init() {
  ['sp-price', 'sp-down', 'sp-rate', 'sp-years', 'sp-whole', 'sp-up', 'sp-down-rent', 'sp-tax', 'sp-ins', 'sp-condo', 'sp-vacancy', 'sp-maint']
    .forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('input', renderSplit); });
  ['fl-buy', 'fl-reno', 'fl-costs', 'fl-sell', 'fl-commission', 'fl-months']
    .forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('input', renderFlip); });
  document.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () { applyPreset(b.getAttribute('data-preset')); });
  });
  document.querySelectorAll('#loss-table th').forEach(function (th) {
    th.addEventListener('click', function () { sortLossTable(th); });
  });
  var usd = document.getElementById('cdr-usd'), sel = document.getElementById('cdr-ticker');
  if (usd) usd.addEventListener('input', renderCdr);
  if (sel) sel.addEventListener('change', renderCdr);
  // Subscribe form is a plain HTML POST to Buttondown (embed-subscribe/xiong).
  // Do not intercept it with fetch/preventDefault: Buttondown may need its
  // own confirmation/CAPTCHA flow in the new tab.
  applyPreset('scarborough'); renderFlip(); renderCdr();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { monthlyPayment: monthlyPayment, holdingCost: holdingCost, splitRentalCalc: splitRentalCalc, flipCalc: flipCalc, cdrCalc: cdrCalc, SPLIT_PRESETS: SPLIT_PRESETS, CDR_FACTORS: CDR_FACTORS };
}
