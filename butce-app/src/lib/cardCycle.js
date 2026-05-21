import { parseIso, toIso, clampDayToMonth, addDays, addMonths, MONTHS_TR, MONTHS_SHORT_TR } from './date.js';

export function getCycleForDate(card, isoDate) {
  const cutoff = card.cutoffDay || 25;
  const d = parseIso(isoDate);
  const day = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth();

  let cycleYear, cycleMonth;
  if (day > cutoff) {
    cycleMonth = month + 1;
    cycleYear = year;
    if (cycleMonth > 11) { cycleMonth = 0; cycleYear = year + 1; }
  } else {
    cycleYear = year;
    cycleMonth = month;
  }

  return cycleByMonth(card, cycleYear, cycleMonth);
}

export function cycleByMonth(card, year, monthIdx0) {
  const cutoff = card.cutoffDay || 25;

  let startYear = year;
  let startM = monthIdx0 - 1;
  if (startM < 0) { startM = 11; startYear -= 1; }
  const startMonthDays = new Date(startYear, startM + 1, 0).getDate();
  const startDay = Math.min(cutoff + 1, startMonthDays);
  const start = `${startYear}-${String(startM + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

  const endDay = clampDayToMonth(year, monthIdx0, cutoff);
  const end = `${year}-${String(monthIdx0 + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  let dueYear = year;
  let dueMonth = monthIdx0;
  const due = card.paymentDueDay || 10;
  if (due <= cutoff) {
    dueMonth = monthIdx0 + 1;
    if (dueMonth > 11) { dueMonth = 0; dueYear = year + 1; }
  }
  const dueDay = clampDayToMonth(dueYear, dueMonth, due);
  const dueIso = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  return {
    start,
    end,
    dueDate: dueIso,
    label: `${MONTHS_TR[monthIdx0]} ${year}`,
    labelShort: `${MONTHS_SHORT_TR[monthIdx0]} ${year}`,
    year,
    monthIdx0,
  };
}

export function getCurrentCycle(card, isoToday) {
  return getCycleForDate(card, isoToday || toIso(new Date()));
}

export function getNextCycles(card, count, isoFrom) {
  const current = getCurrentCycle(card, isoFrom);
  const out = [current];
  for (let i = 1; i < count; i++) {
    let m = current.monthIdx0 + i;
    let y = current.year;
    while (m > 11) { m -= 12; y += 1; }
    out.push(cycleByMonth(card, y, m));
  }
  return out;
}

export function getPrevCycles(card, count, isoFrom) {
  const current = getCurrentCycle(card, isoFrom);
  const out = [current];
  for (let i = 1; i <= count; i++) {
    let m = current.monthIdx0 - i;
    let y = current.year;
    while (m < 0) { m += 12; y -= 1; }
    out.unshift(cycleByMonth(card, y, m));
  }
  return out;
}

export function inCycle(cycle, isoDate) {
  return isoDate >= cycle.start && isoDate <= cycle.end;
}

export function calculateCycleTotal(card, cycle, transactions, planned) {
  let plannedTotal = 0;
  let freeTotal = 0;
  const items = [];

  for (const p of planned) {
    if (p.accountId !== card.id) continue;
    if (!inCycle(cycle, p.postingDate)) continue;
    plannedTotal += p.amountTRY ?? p.amount;
    items.push({ kind: 'planned', item: p });
  }
  for (const t of transactions) {
    if (t.accountId !== card.id) continue;
    if (!inCycle(cycle, t.date)) continue;
    if (t.type !== 'gider') continue;
    freeTotal += t.amountTRY;
    items.push({ kind: 'transaction', item: t });
  }

  items.sort((a, b) => {
    const da = a.item.postingDate || a.item.date;
    const db = b.item.postingDate || b.item.date;
    return db.localeCompare(da);
  });

  return {
    plannedTotal,
    freeTotal,
    grandTotal: plannedTotal + freeTotal,
    items,
  };
}
