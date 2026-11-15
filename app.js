/* gta-invest — vanilla JS, no external dependencies, works offline.
   Pure calculation functions are exported for Node testing when available. */
'use strict';

function toNum(v, fallback) {
  var n = parseFloat(v);
  return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}

/* Standard amortisation: P * r(1+r)^n / ((1+r)^n - 1) */
function monthlyPayment(loan, annualRatePct, years) {
  loan = toNum(loan, 0); annualRatePct = toNum(annualRatePct, 0); years = toNum(years, 0);
  if (loan <= 0 || years <= 0) return 0;
  var r = annualRatePct / 100 / 12, n = years * 12;
  if (r === 0) return loan / n;
  var f = Math.pow(1 + r, n);
  return loan * r * f / (f - 1);
}

function holdingCost(price, downPct, ratePct, years, taxPerYear, insurancePerMonth) {
  var loan = toNum(price, 0) * (1 - toNum(downPct, 0) / 100);
  var pay = monthlyPayment(loan, ratePct, years);
  var holding = pay + toNum(taxPerYear, 0) / 12 + toNum(insurancePerMonth, 0);
  return { loan: loan, payment: pay, holding: holding };
}

function splitRentalCalc(o) {
  var h = holdingCost(o.price, o.downPct, o.ratePct, o.years, o.taxPerYear, o.insurancePerMonth);
  var whole = toNum(o.wholeRent, 0);
  var split = toNum(o.splitUp, 0) + toNum(o.splitDown, 0);
  return {
    loan: h.loan, payment: h.payment, holding: h.holding,
    wholeRent: whole, splitRent: split,
    wholeCashflow: whole - h.holding,
    splitCashflow: split - h.holding,
    difference: split - whole
  };
}

function flipCalc(o) {
  var buy = toNum(o.buy, 0), reno = toNum(o.reno, 0), costs = toNum(o.costs, 0), sell = toNum(o.sell, 0);
  var gross = sell - buy;
  var net = sell - buy - reno - costs;
  var totalCost = buy + reno + costs;
  return {
    gross: gross, net: net, totalCost: totalCost,
    netReturnPct: totalCost > 0 ? net / totalCost * 100 : 0,
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

var CDR_FACTORS = { GOOG: 0.1593, NVDA: 0.223, ISRG: 0.0517, SPCX: 0.1662 };

var SPLIT_PRESETS = {
  scarborough: { label: 'Scarborough 31A Laurel Ave', price: 881000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3352, splitUp: 2999, splitDown: 2149, taxPerYear: 3589, insurancePerMonth: 150 },
  burlington: { label: 'Burlington 2379 Maryvale Ct', price: 766000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3156, splitUp: 0, splitDown: 0, taxPerYear: 3420, insurancePerMonth: 120 },
  markham: { label: 'Markham 23 Southdale Dr（未售出）', price: 1450000, downPct: 20, ratePct: 4.79, years: 25, wholeRent: 3570, splitUp: 3100, splitDown: 2500, taxPerYear: 5692, insurancePerMonth: 200 }
};

function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }

function renderSplit() {
  var r = splitRentalCalc({
    price: getVal('sp-price'), downPct: getVal('sp-down'), ratePct: getVal('sp-rate'),
    years: getVal('sp-years'), wholeRent: getVal('sp-whole'),
    splitUp: getVal('sp-up'), splitDown: getVal('sp-down-rent'),
    taxPerYear: getVal('sp-tax'), insurancePerMonth: getVal('sp-ins')
  });
  var set = function (id, text, cls) { var el = document.getElementById(id); if (!el) return; el.textContent = text; el.className = cls || ''; };
  set('sp-loan', fmt(r.loan));
  set('sp-payment', fmt(r.payment));
  set('sp-holding', fmt(r.holding), 'big');
  set('sp-whole-cf', fmtSigned(r.wholeCashflow), r.wholeCashflow < 0 ? 'neg' : 'pos');
  set('sp-split-cf', fmtSigned(r.splitCashflow), r.splitCashflow < 0 ? 'neg' : 'pos');
  set('sp-diff', fmtSigned(r.difference), r.difference < 0 ? 'neg' : 'pos');
}

function renderFlip() {
  var r = flipCalc({ buy: getVal('fl-buy'), reno: getVal('fl-reno'), costs: getVal('fl-costs'), sell: getVal('fl-sell') });
  var set = function (id, text, cls) { var el = document.getElementById(id); if (!el) return; el.textContent = text; el.className = cls || ''; };
  set('fl-gross', fmtSigned(r.gross), r.gross < 0 ? 'neg' : 'pos');
  set('fl-net', fmtSigned(r.net), r.net < 0 ? 'neg' : 'pos');
  set('fl-total', fmt(r.totalCost));
  set('fl-return', fmtPct(r.netReturnPct), r.netReturnPct < 0 ? 'neg' : 'pos');
  set('fl-gross-pct', fmtPct(r.grossPct), r.grossPct < 0 ? 'neg' : 'pos');
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
    note.textContent = ticker === 'SPCX'
      ? '注意：SPCX 没有 CDR，此处仅为参考换算（因子约 0.1662），不能直接按 CDR 买卖。'
      : '因子约 ' + factor + '，每日浮动，仅为约算值。CDR 价格还受汇率对冲、费用等因素影响。';
  }
}

function applyPreset(key) {
  var p = SPLIT_PRESETS[key]; if (!p) return;
  setVal('sp-price', p.price); setVal('sp-down', p.downPct); setVal('sp-rate', p.ratePct);
  setVal('sp-years', p.years); setVal('sp-whole', p.wholeRent); setVal('sp-up', p.splitUp);
  setVal('sp-down-rent', p.splitDown); setVal('sp-tax', p.taxPerYear); setVal('sp-ins', p.insurancePerMonth);
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
  ['sp-price', 'sp-down', 'sp-rate', 'sp-years', 'sp-whole', 'sp-up', 'sp-down-rent', 'sp-tax', 'sp-ins']
    .forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('input', renderSplit); });
  ['fl-buy', 'fl-reno', 'fl-costs', 'fl-sell']
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
  var form = document.getElementById('subscribe-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = getVal('sub-email').trim();
      var msg = document.getElementById('sub-msg');
      if (!email || email.indexOf('@') < 0) { if (msg) { msg.textContent = '请填写有效的邮箱地址。'; msg.style.color = '#c8102e'; } return; }
      if (msg) { msg.textContent = '已收到！资料包为占位订阅（本站无后端），请留意邮箱。也可以直接发邮件到北美雄吉频道留言。'; msg.style.color = '#0b7a3e'; }
      form.reset();
    });
  }
  renderSplit(); renderFlip(); renderCdr();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { monthlyPayment: monthlyPayment, holdingCost: holdingCost, splitRentalCalc: splitRentalCalc, flipCalc: flipCalc, cdrCalc: cdrCalc, SPLIT_PRESETS: SPLIT_PRESETS, CDR_FACTORS: CDR_FACTORS };
}
