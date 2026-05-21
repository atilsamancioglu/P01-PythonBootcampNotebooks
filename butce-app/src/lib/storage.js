const PREFIX = 'app:';

function fullKey(key) {
  return key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
}

export const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw === null) return null;
      return { key, value: JSON.parse(raw) };
    } catch (e) {
      console.error('storage.get', key, e);
      return null;
    }
  },

  async set(key, value) {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
    return { key, value };
  },

  async delete(key) {
    localStorage.removeItem(fullKey(key));
  },

  async list(prefix = '') {
    const out = [];
    const full = fullKey(prefix);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(full)) {
        out.push(k.slice(PREFIX.length));
      }
    }
    return out;
  },
};

let saveTimers = new Map();

export function debouncedSave(key, value, delay = 250) {
  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    storage.set(key, value);
    saveTimers.delete(key);
  }, delay);
  saveTimers.set(key, t);
}

export function flushSaves() {
  for (const [, t] of saveTimers) clearTimeout(t);
  saveTimers.clear();
}
