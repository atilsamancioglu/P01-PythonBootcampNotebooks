const TRY_FMT = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function fmtAmount(value, currency = 'TRY', opts = {}) {
  const sign = opts.signed && value !== 0
    ? (value > 0 ? '+' : '−')
    : '';
  const abs = Math.abs(value);
  const formatted = TRY_FMT.format(abs);
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return `${sign}${sym}${formatted}`;
}

export function fmtTRY(value, opts = {}) {
  return fmtAmount(value, 'TRY', opts);
}

export function fmtCompact(value, currency = 'TRY') {
  const abs = Math.abs(value);
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  if (abs >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sym}${(value / 1000).toFixed(0)}K`;
  if (abs >= 1000) return `${sym}${(value / 1000).toFixed(1)}K`;
  return fmtAmount(value, currency);
}

export function fmtPercent(value, digits = 0) {
  return `%${(value * 100).toFixed(digits)}`;
}

export function fmtRate(rate) {
  return rate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
