import { storage } from '../lib/storage.js';
import { newId } from '../lib/id.js';

const KEY_VERSION = 'schema:version';
const LEGACY_KEY = 'butce:transactions';
const KEY_ACCOUNTS = 'accounts:list';
const KEY_TRANSACTIONS = 'transactions:list';
const KEY_RECURRING = 'recurring:list';
const KEY_PLANNED = 'planned:list';
const KEY_GOALS = 'goals:list';
const KEY_FX = 'fx:cache';
const KEY_SETTINGS = 'settings';

const CURRENT_VERSION = 2;

async function migrateV1ToV2() {
  let existing = null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY) ?? localStorage.getItem('app:butce:transactions');
    if (raw) existing = JSON.parse(raw);
  } catch (e) {
    console.warn('Legacy migration parse failed', e);
  }

  const defaultAccount = {
    id: newId('acc'),
    name: 'Nakit TRY',
    type: 'nakit',
    currency: 'TRY',
    color: 'var(--acc-1)',
    icon: 'wallet',
    initialBalance: 0,
    archived: false,
    createdAt: Date.now(),
  };

  const accounts = [defaultAccount];

  const transactions = (existing || []).map(t => ({
    id: t.id || newId('tx'),
    type: t.type === 'gelir' ? 'gelir' : 'gider',
    accountId: defaultAccount.id,
    toAccountId: null,
    category: t.category,
    amount: Number(t.amount) || 0,
    currency: 'TRY',
    fxRate: 1,
    amountTRY: Number(t.amount) || 0,
    date: t.date,
    note: t.note || '',
    source: 'manual',
    sourceId: null,
    createdAt: t.createdAt || Date.now(),
  }));

  await storage.set(KEY_ACCOUNTS, accounts);
  await storage.set(KEY_TRANSACTIONS, transactions);
  await storage.set(KEY_RECURRING, []);
  await storage.set(KEY_PLANNED, []);
  await storage.set(KEY_GOALS, []);
  await storage.set(KEY_SETTINGS, {
    primaryCurrency: 'TRY',
    showInTRY: true,
    weekStartsOn: 1,
    defaultAccountId: defaultAccount.id,
  });
  await storage.set(KEY_VERSION, 2);

  try {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem('app:butce:transactions');
  } catch {}
}

export async function runMigrations() {
  const cur = await storage.get(KEY_VERSION);
  const version = cur?.value ?? 0;
  if (version >= CURRENT_VERSION) return version;

  if (version < 2) await migrateV1ToV2();

  return CURRENT_VERSION;
}

export const KEYS = {
  VERSION: KEY_VERSION,
  ACCOUNTS: KEY_ACCOUNTS,
  TRANSACTIONS: KEY_TRANSACTIONS,
  RECURRING: KEY_RECURRING,
  PLANNED: KEY_PLANNED,
  GOALS: KEY_GOALS,
  FX: KEY_FX,
  SETTINGS: KEY_SETTINGS,
};
