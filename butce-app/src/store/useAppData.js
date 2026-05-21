import { useCallback, useEffect, useState } from 'react';
import { storage, debouncedSave } from '../lib/storage.js';
import { KEYS, runMigrations } from '../data/migrations.js';
import { newId } from '../lib/id.js';
import { today } from '../lib/date.js';
import { convertToTRY, getCurrentRates } from '../lib/fx.js';
import { materializeAll } from '../lib/recurring.js';

const DEFAULT_SETTINGS = {
  primaryCurrency: 'TRY',
  showInTRY: true,
  weekStartsOn: 1,
  defaultAccountId: null,
};

export function useAppData() {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [fx, setFx] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      await runMigrations();
      const [a, t, r, p, g, s] = await Promise.all([
        storage.get(KEYS.ACCOUNTS),
        storage.get(KEYS.TRANSACTIONS),
        storage.get(KEYS.RECURRING),
        storage.get(KEYS.PLANNED),
        storage.get(KEYS.GOALS),
        storage.get(KEYS.SETTINGS),
      ]);
      if (cancelled) return;

      let acc = a?.value ?? [];
      if (acc.length === 0) {
        const def = {
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
        acc = [def];
        await storage.set(KEYS.ACCOUNTS, acc);
      }

      const initialTransactions = t?.value ?? [];
      const initialPlanned = p?.value ?? [];
      const initialRecurring = r?.value ?? [];

      setAccounts(acc);
      setRecurring(initialRecurring);
      setGoals(g?.value ?? []);
      const setVal = s?.value ?? DEFAULT_SETTINGS;
      if (!setVal.defaultAccountId) setVal.defaultAccountId = acc[0]?.id;
      setSettings(setVal);

      getCurrentRates().then(rates => { if (!cancelled) setFx(rates); }).catch(() => {});

      try {
        const { transactions: newTx, planned: newPc, ruleUpdates } =
          await materializeAll(initialRecurring, acc);

        if (cancelled) return;

        if (ruleUpdates.length > 0) {
          const nextRules = initialRecurring.map(rule => {
            const upd = ruleUpdates.find(u => u.id === rule.id);
            return upd ? { ...rule, lastGeneratedDate: upd.lastGeneratedDate } : rule;
          });
          setRecurring(nextRules);
          await storage.set(KEYS.RECURRING, nextRules);
        }

        const allTx = [...newTx, ...initialTransactions];
        setTransactions(allTx);
        if (newTx.length > 0) await storage.set(KEYS.TRANSACTIONS, allTx);

        const allPc = [...initialPlanned, ...newPc];
        setPlanned(allPc);
        if (newPc.length > 0) await storage.set(KEYS.PLANNED, allPc);
      } catch (e) {
        console.error('Materialization failed', e);
        setTransactions(initialTransactions);
        setPlanned(initialPlanned);
      }

      setReady(true);
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  /* ============ ACCOUNTS ============ */
  const addAccount = useCallback((acc) => {
    const full = {
      id: newId('acc'),
      name: acc.name,
      type: acc.type ?? 'nakit',
      currency: acc.currency ?? 'TRY',
      color: acc.color ?? 'var(--acc-1)',
      icon: acc.icon ?? 'wallet',
      initialBalance: Number(acc.initialBalance) || 0,
      archived: false,
      createdAt: Date.now(),
      ...(acc.type === 'kredi_karti' ? {
        cutoffDay: acc.cutoffDay ?? 25,
        paymentDueDay: acc.paymentDueDay ?? 10,
        creditLimit: Number(acc.creditLimit) || 0,
      } : {}),
    };
    setAccounts(prev => {
      const next = [...prev, full];
      debouncedSave(KEYS.ACCOUNTS, next);
      return next;
    });
    return full;
  }, []);

  const updateAccount = useCallback((id, patch) => {
    setAccounts(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...patch } : a);
      debouncedSave(KEYS.ACCOUNTS, next);
      return next;
    });
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      debouncedSave(KEYS.ACCOUNTS, next);
      return next;
    });
  }, []);

  /* ============ TRANSACTIONS ============ */
  const addTransaction = useCallback(async (input) => {
    const account = accounts.find(a => a.id === input.accountId) || accounts[0];
    const currency = input.currency ?? account?.currency ?? 'TRY';
    const date = input.date ?? today();

    let fxRate = 1;
    let amountTRY = Number(input.amount) || 0;
    if (currency !== 'TRY') {
      const conv = await convertToTRY(amountTRY, currency, date);
      fxRate = conv.rate;
      amountTRY = conv.amount;
    }

    const tx = {
      id: newId('tx'),
      type: input.type,
      accountId: account?.id,
      toAccountId: input.toAccountId ?? null,
      category: input.category,
      amount: Number(input.amount) || 0,
      currency,
      fxRate,
      amountTRY,
      date,
      note: input.note ?? '',
      source: input.source ?? 'manual',
      sourceId: input.sourceId ?? null,
      createdAt: Date.now(),
    };

    setTransactions(prev => {
      const next = [tx, ...prev];
      debouncedSave(KEYS.TRANSACTIONS, next);
      return next;
    });
    return tx;
  }, [accounts]);

  const removeTransaction = useCallback((id) => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      debouncedSave(KEYS.TRANSACTIONS, next);
      return next;
    });
  }, []);

  const updateTransaction = useCallback((id, patch) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...patch } : t);
      debouncedSave(KEYS.TRANSACTIONS, next);
      return next;
    });
  }, []);

  /* ============ RECURRING ============ */
  const addRecurring = useCallback((input) => {
    const rule = {
      id: newId('rec'),
      name: input.name,
      type: input.type,
      category: input.category,
      accountId: input.accountId,
      amount: Number(input.amount) || 0,
      currency: input.currency ?? 'TRY',
      frequency: input.frequency ?? 'aylik',
      dayOfMonth: input.dayOfMonth ?? 1,
      dayOfWeek: input.dayOfWeek ?? 1,
      monthOfYear: input.monthOfYear ?? 1,
      startDate: input.startDate ?? today(),
      endDate: input.endDate ?? null,
      lastGeneratedDate: input.lastGeneratedDate ?? null,
      active: input.active !== false,
      exceptions: [],
      createdAt: Date.now(),
    };
    setRecurring(prev => {
      const next = [...prev, rule];
      debouncedSave(KEYS.RECURRING, next);
      return next;
    });
    return rule;
  }, []);

  const updateRecurring = useCallback((id, patch) => {
    setRecurring(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r);
      debouncedSave(KEYS.RECURRING, next);
      return next;
    });
  }, []);

  const removeRecurring = useCallback((id) => {
    setRecurring(prev => {
      const next = prev.filter(r => r.id !== id);
      debouncedSave(KEYS.RECURRING, next);
      return next;
    });
  }, []);

  /* ============ PLANNED ============ */
  const addPlanned = useCallback((input) => {
    const pc = {
      id: newId('pc'),
      accountId: input.accountId,
      name: input.name,
      category: input.category,
      amount: Number(input.amount) || 0,
      currency: input.currency ?? 'TRY',
      fxRate: input.fxRate ?? 1,
      amountTRY: input.amountTRY ?? input.amount,
      postingDate: input.postingDate,
      installmentGroupId: input.installmentGroupId ?? null,
      installmentNo: input.installmentNo ?? null,
      installmentTotal: input.installmentTotal ?? null,
      source: input.source ?? 'manual',
      sourceId: input.sourceId ?? null,
      status: input.status ?? 'beklemede',
      note: input.note ?? '',
      createdAt: Date.now(),
    };
    setPlanned(prev => {
      const next = [...prev, pc];
      debouncedSave(KEYS.PLANNED, next);
      return next;
    });
    return pc;
  }, []);

  const addPlannedBatch = useCallback((items) => {
    const next = items.map(item => ({
      id: newId('pc'),
      ...item,
      createdAt: Date.now(),
    }));
    setPlanned(prev => {
      const merged = [...prev, ...next];
      debouncedSave(KEYS.PLANNED, merged);
      return merged;
    });
    return next;
  }, []);

  const updatePlanned = useCallback((id, patch) => {
    setPlanned(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      debouncedSave(KEYS.PLANNED, next);
      return next;
    });
  }, []);

  const removePlanned = useCallback((id) => {
    setPlanned(prev => {
      const next = prev.filter(p => p.id !== id);
      debouncedSave(KEYS.PLANNED, next);
      return next;
    });
  }, []);

  const removePlannedGroup = useCallback((groupId) => {
    setPlanned(prev => {
      const next = prev.filter(p => p.installmentGroupId !== groupId);
      debouncedSave(KEYS.PLANNED, next);
      return next;
    });
  }, []);

  /* ============ GOALS ============ */
  const addGoal = useCallback((input) => {
    const g = {
      id: newId('goal'),
      category: input.category,
      monthlyLimit: Number(input.monthlyLimit) || 0,
      active: input.active !== false,
      createdAt: Date.now(),
    };
    setGoals(prev => {
      const next = [...prev, g];
      debouncedSave(KEYS.GOALS, next);
      return next;
    });
    return g;
  }, []);

  const updateGoal = useCallback((id, patch) => {
    setGoals(prev => {
      const next = prev.map(g => g.id === id ? { ...g, ...patch } : g);
      debouncedSave(KEYS.GOALS, next);
      return next;
    });
  }, []);

  const removeGoal = useCallback((id) => {
    setGoals(prev => {
      const next = prev.filter(g => g.id !== id);
      debouncedSave(KEYS.GOALS, next);
      return next;
    });
  }, []);

  /* ============ SETTINGS ============ */
  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      debouncedSave(KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  return {
    ready,
    accounts, addAccount, updateAccount, removeAccount,
    transactions, addTransaction, removeTransaction, updateTransaction,
    recurring, addRecurring, updateRecurring, removeRecurring,
    setRecurring,
    planned, addPlanned, addPlannedBatch, updatePlanned, removePlanned, removePlannedGroup,
    setPlanned,
    goals, addGoal, updateGoal, removeGoal,
    settings, updateSettings,
    fx, setFx,
  };
}
