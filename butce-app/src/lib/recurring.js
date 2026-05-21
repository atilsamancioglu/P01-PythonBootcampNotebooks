import { toIso, parseIso, addDays, addMonths, clampDayToMonth, today } from './date.js';
import { convertToTRY } from './fx.js';
import { newId } from './id.js';

export function nextOccurrence(rule, fromIso) {
  const start = rule.startDate;
  const cursor = fromIso < start ? start : fromIso;

  if (rule.frequency === 'haftalik') {
    const d = parseIso(cursor);
    let delta = (rule.dayOfWeek - d.getDay() + 7) % 7;
    if (delta === 0) delta = 0;
    const next = addDays(toIso(d), delta);
    if (rule.endDate && next > rule.endDate) return null;
    return next;
  }

  if (rule.frequency === 'aylik') {
    const d = parseIso(cursor);
    const year = d.getFullYear();
    const month = d.getMonth();
    const candidate = `${year}-${String(month + 1).padStart(2, '0')}-${String(clampDayToMonth(year, month, rule.dayOfMonth)).padStart(2, '0')}`;
    if (candidate >= cursor) {
      if (rule.endDate && candidate > rule.endDate) return null;
      return candidate;
    }
    const nextMonth = new Date(year, month + 1, 1);
    const ny = nextMonth.getFullYear();
    const nm = nextMonth.getMonth();
    const nd = clampDayToMonth(ny, nm, rule.dayOfMonth);
    const out = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
    if (rule.endDate && out > rule.endDate) return null;
    return out;
  }

  if (rule.frequency === 'yillik') {
    const d = parseIso(cursor);
    const year = d.getFullYear();
    const monthIdx0 = (rule.monthOfYear || 1) - 1;
    const day = clampDayToMonth(year, monthIdx0, rule.dayOfMonth || 1);
    const candidate = `${year}-${String(monthIdx0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (candidate >= cursor) {
      if (rule.endDate && candidate > rule.endDate) return null;
      return candidate;
    }
    const ny = year + 1;
    const nd = clampDayToMonth(ny, monthIdx0, rule.dayOfMonth || 1);
    const out = `${ny}-${String(monthIdx0 + 1).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
    if (rule.endDate && out > rule.endDate) return null;
    return out;
  }

  return null;
}

export function* iterateOccurrences(rule, startIso, endIso) {
  let cursor = startIso;
  for (let i = 0; i < 600; i++) {
    const next = nextOccurrence(rule, cursor);
    if (!next || next > endIso) return;
    yield next;
    cursor = addDays(next, 1);
  }
}

export function generateBetween(rule, startIso, endIso) {
  const out = [];
  const skipped = new Set(
    (rule.exceptions || [])
      .filter(e => e.action === 'skip')
      .map(e => e.date)
  );
  for (const date of iterateOccurrences(rule, startIso, endIso)) {
    if (skipped.has(date)) continue;
    out.push(date);
  }
  return out;
}

export function findOverride(rule, date) {
  return (rule.exceptions || []).find(e => e.date === date && e.action === 'override');
}

function cycleAdjustedPostingDate(card, isoDate) {
  return isoDate;
}

export async function materializeAll(rules, accounts, opts = {}) {
  const todayIso = opts.today || today();
  const transactions = [];
  const planned = [];
  const ruleUpdates = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    const account = accounts.find(a => a.id === rule.accountId);
    if (!account) continue;

    const startCursor = rule.lastGeneratedDate
      ? addDays(rule.lastGeneratedDate, 1)
      : rule.startDate;

    if (startCursor > todayIso) continue;

    const occurrences = generateBetween(rule, startCursor, todayIso);
    if (occurrences.length === 0) continue;

    for (const date of occurrences) {
      const override = findOverride(rule, date);
      const amount = override?.amount ?? rule.amount;
      const note = override?.note ?? '';

      if (account.type === 'kredi_karti') {
        let fxRate = 1;
        let amountTRY = amount;
        if (rule.currency !== 'TRY') {
          const conv = await convertToTRY(amount, rule.currency, date);
          fxRate = conv.rate;
          amountTRY = conv.amount;
        }
        planned.push({
          id: newId('pc'),
          createdAt: Date.now(),
          accountId: account.id,
          name: rule.name,
          category: rule.category,
          amount: Number(amount) || 0,
          currency: rule.currency,
          fxRate,
          amountTRY,
          postingDate: date,
          installmentGroupId: null,
          installmentNo: null,
          installmentTotal: null,
          source: 'recurring',
          sourceId: rule.id,
          status: date <= todayIso ? 'kesildi' : 'beklemede',
          note,
        });
      } else {
        let fxRate = 1;
        let amountTRY = amount;
        if (rule.currency !== 'TRY') {
          const conv = await convertToTRY(amount, rule.currency, date);
          fxRate = conv.rate;
          amountTRY = conv.amount;
        }
        transactions.push({
          id: newId('tx'),
          type: rule.type,
          accountId: rule.accountId,
          toAccountId: null,
          category: rule.category,
          amount: Number(amount) || 0,
          currency: rule.currency,
          fxRate,
          amountTRY,
          date,
          note,
          source: 'recurring',
          sourceId: rule.id,
          createdAt: Date.now(),
        });
      }
    }

    ruleUpdates.push({ id: rule.id, lastGeneratedDate: todayIso });
  }

  return { transactions, planned, ruleUpdates };
}

export function summarizeRule(rule) {
  if (rule.frequency === 'haftalik') {
    const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `Her ${DAYS[rule.dayOfWeek] || 'Pazartesi'}`;
  }
  if (rule.frequency === 'aylik') {
    return `Her ayın ${rule.dayOfMonth}'i`;
  }
  if (rule.frequency === 'yillik') {
    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `Her yıl ${rule.dayOfMonth} ${MONTHS[(rule.monthOfYear || 1) - 1]}`;
  }
  return '';
}
