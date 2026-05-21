export const CURRENCIES = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺', flag: '🇹🇷' },
  { code: 'USD', name: 'Dolar',       symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',        symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'Sterlin',     symbol: '£', flag: '🇬🇧' },
];

export const CURRENCY_CODES = CURRENCIES.map(c => c.code);

export function getCurrency(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export const ACCOUNT_COLORS = [
  'var(--acc-1)', 'var(--acc-2)', 'var(--acc-3)', 'var(--acc-4)',
  'var(--acc-5)', 'var(--acc-6)', 'var(--acc-7)', 'var(--acc-8)',
];
