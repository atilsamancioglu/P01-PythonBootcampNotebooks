export const EXPENSE_CATEGORIES = [
  { id: 'market',        label: 'Market',       icon: 'ShoppingBasket', color: 'var(--cat-1)' },
  { id: 'yemek',         label: 'Yemek',        icon: 'UtensilsCrossed', color: 'var(--cat-2)' },
  { id: 'ulasim',        label: 'Ulaşım',       icon: 'Bus',             color: 'var(--cat-3)' },
  { id: 'fatura',        label: 'Fatura',       icon: 'Receipt',         color: 'var(--cat-4)' },
  { id: 'kira',          label: 'Kira',         icon: 'Home',            color: 'var(--cat-5)' },
  { id: 'eglence',       label: 'Eğlence',      icon: 'Gamepad2',        color: 'var(--cat-6)' },
  { id: 'saglik',        label: 'Sağlık',       icon: 'HeartPulse',      color: 'var(--cat-7)' },
  { id: 'giyim',         label: 'Giyim',        icon: 'Shirt',           color: 'var(--cat-8)' },
  { id: 'elektronik',    label: 'Elektronik',   icon: 'Smartphone',      color: 'var(--cat-1)' },
  { id: 'abonelik',      label: 'Abonelik',     icon: 'Repeat',          color: 'var(--cat-2)' },
  { id: 'egitim',        label: 'Eğitim',       icon: 'GraduationCap',   color: 'var(--cat-3)' },
  { id: 'diger_gider',   label: 'Diğer',        icon: 'Wallet',          color: 'var(--cat-4)' },
];

export const INCOME_CATEGORIES = [
  { id: 'maas',          label: 'Maaş',         icon: 'BadgeDollarSign', color: 'var(--cat-5)' },
  { id: 'freelance',     label: 'Freelance',    icon: 'Briefcase',       color: 'var(--cat-7)' },
  { id: 'yatirim',       label: 'Yatırım',      icon: 'TrendingUp',      color: 'var(--cat-1)' },
  { id: 'hediye',        label: 'Hediye',       icon: 'Gift',            color: 'var(--cat-3)' },
  { id: 'iade',          label: 'İade',         icon: 'Undo2',           color: 'var(--cat-2)' },
  { id: 'diger_gelir',   label: 'Diğer',        icon: 'Wallet',          color: 'var(--cat-4)' },
];

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategory(id) {
  return ALL.find(c => c.id === id) || { id, label: id, icon: 'Wallet', color: 'var(--cat-1)' };
}

export function categoriesFor(type) {
  if (type === 'gelir') return INCOME_CATEGORIES;
  return EXPENSE_CATEGORIES;
}
