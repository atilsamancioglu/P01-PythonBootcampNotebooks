import { storage } from './storage.js';
import { today } from './date.js';
import { KEYS } from '../data/migrations.js';

const SOURCE_URL_LATEST = 'https://api.frankfurter.app/latest?from=USD&to=TRY';
const FETCH_TIMEOUT_MS = 8000;

const HISTORICAL_CACHE_KEY = 'fx:historical';

let inFlight = null;

function isStale(cache) {
  if (!cache) return true;
  const cacheDate = cache.date;
  if (!cacheDate) return true;
  if (cacheDate !== today()) return true;
  return false;
}

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(tid);
  }
}

async function fetchLatestRates() {
  const out = { USD: null, EUR: null, GBP: null };
  const urls = [
    { ccy: 'USD', url: 'https://api.frankfurter.app/latest?from=USD&to=TRY' },
    { ccy: 'EUR', url: 'https://api.frankfurter.app/latest?from=EUR&to=TRY' },
    { ccy: 'GBP', url: 'https://api.frankfurter.app/latest?from=GBP&to=TRY' },
  ];
  const results = await Promise.allSettled(urls.map(u => fetchWithTimeout(u.url)));
  results.forEach((res, i) => {
    if (res.status === 'fulfilled' && res.value?.rates?.TRY) {
      out[urls[i].ccy] = res.value.rates.TRY;
    }
  });
  return out;
}

export async function getCurrentRates() {
  const cached = await storage.get(KEYS.FX);
  if (cached?.value && !isStale(cached.value)) {
    return cached.value;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const rates = await fetchLatestRates();
      const useable = Object.values(rates).some(v => v != null);
      if (!useable) throw new Error('No rates returned');

      const merged = {
        USD: rates.USD ?? cached?.value?.rates?.USD ?? null,
        EUR: rates.EUR ?? cached?.value?.rates?.EUR ?? null,
        GBP: rates.GBP ?? cached?.value?.rates?.GBP ?? null,
      };

      const next = {
        date: today(),
        rates: merged,
        source: 'frankfurter',
        fetchedAt: Date.now(),
      };
      await storage.set(KEYS.FX, next);
      return next;
    } catch (e) {
      console.warn('FX fetch failed, using cache', e);
      if (cached?.value) return { ...cached.value, stale: true };
      const fallback = {
        date: today(),
        rates: { USD: 32, EUR: 35, GBP: 41 },
        source: 'fallback',
        fetchedAt: Date.now(),
      };
      await storage.set(KEYS.FX, fallback);
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export async function getRateForDate(currency, date) {
  if (currency === 'TRY') return 1;
  const isToday = date === today();

  if (isToday) {
    const cur = await getCurrentRates();
    return cur.rates[currency] ?? 1;
  }

  const histCache = await storage.get(HISTORICAL_CACHE_KEY);
  const cache = histCache?.value || {};
  const key = `${currency}_${date}`;
  if (cache[key]) return cache[key];

  try {
    const url = `https://api.frankfurter.app/${date}?from=${currency}&to=TRY`;
    const data = await fetchWithTimeout(url);
    const rate = data?.rates?.TRY;
    if (rate) {
      cache[key] = rate;
      await storage.set(HISTORICAL_CACHE_KEY, cache);
      return rate;
    }
  } catch (e) {
    console.warn('historical FX failed', e);
  }

  const cur = await getCurrentRates();
  return cur.rates[currency] ?? 1;
}

export async function convertToTRY(amount, currency, date) {
  if (currency === 'TRY') return { amount, rate: 1 };
  const rate = await getRateForDate(currency, date || today());
  return { amount: amount * rate, rate };
}

export async function setManualRate(currency, rate) {
  const cur = await storage.get(KEYS.FX);
  const base = cur?.value || { date: today(), rates: {}, source: 'manual', fetchedAt: Date.now() };
  const next = {
    ...base,
    rates: { ...base.rates, [currency]: rate },
    source: 'manual',
    fetchedAt: Date.now(),
  };
  await storage.set(KEYS.FX, next);
  return next;
}
