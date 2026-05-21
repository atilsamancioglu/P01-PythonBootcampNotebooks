import { addMonths, today, parseIso, toIso, monthKey, MONTHS_SHORT_TR } from './date.js';
import { generateBetween } from './recurring.js';
import { getCurrentCycle, cycleByMonth, calculateCycleTotal, inCycle } from './cardCycle.js';
import { calculateTRYBalance } from './balance.js';

function monthsBetween(startIso, endIso) {
  const out = [];
  const start = parseIso(startIso);
  const end = parseIso(endIso);
  let y = start.getFullYear();
  let m = start.getMonth();
  while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
    out.push({ year: y, month: m, key: `${y}-${String(m + 1).padStart(2, '0')}` });
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
}

export function projectMonthlyPosition({
  startDate,
  monthsAhead,
  accounts,
  transactions,
  recurring,
  planned,
  fxRates,
}) {
  const startIso = startDate || today().slice(0, 7) + '-01';
  const endIso = addMonths(startIso, monthsAhead - 1);
  const months = monthsBetween(startIso, endIso);

  const initialWealth = accounts.reduce((sum, a) => {
    if (a.archived) return sum;
    if (a.type === 'kredi_karti') return sum;
    const bal = calculateTRYBalance(a, transactions, planned, fxRates);
    return sum + (bal ?? 0);
  }, 0);

  const series = [];
  let cumulative = initialWealth;

  for (const { year, month, key } of months) {
    const monthStart = `${key}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${key}-${String(lastDay).padStart(2, '0')}`;

    let income = 0, expense = 0;

    for (const rule of recurring) {
      if (!rule.active) continue;
      const account = accounts.find(a => a.id === rule.accountId);
      if (!account) continue;
      const dates = generateBetween(rule, monthStart, monthEnd);
      if (dates.length === 0) continue;
      const rate = rule.currency === 'TRY' ? 1 : (fxRates?.rates?.[rule.currency] ?? 1);
      const amount = rule.amount * rate * dates.length;
      if (account.type === 'kredi_karti') {
        continue;
      }
      if (rule.type === 'gelir') income += amount;
      else expense += amount;
    }

    for (const card of accounts.filter(a => a.type === 'kredi_karti' && !a.archived)) {
      const cycle = cycleByMonth(card, year, month);
      if (cycle.dueDate.slice(0, 7) !== key) continue;
      const totals = calculateCycleTotal(card, cycle, transactions, planned);
      expense += totals.grandTotal;
    }

    const net = income - expense;
    cumulative += net;
    series.push({
      key,
      label: `${MONTHS_SHORT_TR[month]} ${String(year).slice(2)}`,
      year,
      month,
      income,
      expense,
      net,
      cumulative,
    });
  }

  return {
    initialWealth,
    series,
  };
}

export function projectAccountBalance(accountId, monthsAhead, { accounts, transactions, recurring, planned, fxRates }) {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return [];
  const startIso = today().slice(0, 7) + '-01';
  const endIso = addMonths(startIso, monthsAhead - 1);
  const months = monthsBetween(startIso, endIso);

  let balance = calculateTRYBalance(account, transactions, planned, fxRates) ?? 0;
  const series = [];

  for (const { year, month, key } of months) {
    const monthStart = `${key}-01`;
    const monthEnd = `${key}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
    let delta = 0;
    for (const rule of recurring) {
      if (!rule.active) continue;
      if (rule.accountId !== accountId) continue;
      const dates = generateBetween(rule, monthStart, monthEnd);
      const rate = rule.currency === 'TRY' ? 1 : (fxRates?.rates?.[rule.currency] ?? 1);
      const amount = rule.amount * rate * dates.length;
      if (rule.type === 'gelir') delta += amount;
      else delta -= amount;
    }
    balance += delta;
    series.push({ key, label: `${MONTHS_SHORT_TR[month]} ${String(year).slice(2)}`, balance });
  }

  return series;
}
