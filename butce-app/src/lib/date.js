const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const MONTHS_SHORT_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

const DAYS_SHORT_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function today() {
  return toIso(new Date());
}

export function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}

export function startOfMonth(iso) {
  return iso.slice(0, 7) + '-01';
}

export function endOfMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${iso.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export function addMonths(iso, n) {
  const d = parseIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toIso(d);
}

export function addDays(iso, n) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function diffDays(a, b) {
  const da = parseIso(a);
  const db = parseIso(b);
  return Math.round((db - da) / 86400000);
}

export function formatMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

export function formatShortDate(iso) {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS_SHORT_TR[d.getMonth()]}`;
}

export function formatLongDate(iso) {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatWeekday(iso) {
  return DAYS_SHORT_TR[parseIso(iso).getDay()];
}

export function isSameMonth(a, b) {
  return monthKey(a) === monthKey(b);
}

export function daysInMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function clampDayToMonth(year, monthIdx0, day) {
  const last = new Date(year, monthIdx0 + 1, 0).getDate();
  return Math.min(day, last);
}

export { MONTHS_TR, MONTHS_SHORT_TR, DAYS_SHORT_TR };
