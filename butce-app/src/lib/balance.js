export function calculateNativeBalance(account, transactions, planned = []) {
  let balance = Number(account.initialBalance) || 0;

  for (const t of transactions) {
    if (t.accountId === account.id) {
      if (t.type === 'gelir') balance += t.amount;
      else if (t.type === 'gider') balance -= t.amount;
      else if (t.type === 'transfer') balance -= t.amount;
    }
    if (t.toAccountId === account.id) {
      balance += t.amount;
    }
  }

  if (account.type === 'kredi_karti') {
    for (const p of planned) {
      if (p.accountId === account.id && p.status === 'kesildi') {
        balance -= p.amount;
      }
    }
  }

  return balance;
}

export function calculateTRYBalance(account, transactions, planned, fxRates) {
  const native = calculateNativeBalance(account, transactions, planned);
  if (account.currency === 'TRY') return native;
  const rate = fxRates?.rates?.[account.currency];
  if (!rate) return null;
  return native * rate;
}

export function calculateTotalWealthTRY(accounts, transactions, planned, fxRates) {
  let total = 0;
  for (const acc of accounts) {
    if (acc.archived) continue;
    if (acc.type === 'kredi_karti') continue;
    const tryBal = calculateTRYBalance(acc, transactions, planned, fxRates);
    if (tryBal != null) total += tryBal;
  }
  return total;
}

export function calculateCardDebt(card, transactions, planned, fxRates) {
  const native = -calculateNativeBalance(card, transactions, planned);
  const rate = card.currency === 'TRY' ? 1 : (fxRates?.rates?.[card.currency] ?? null);
  return {
    native: Math.max(0, native),
    try: rate != null ? Math.max(0, native) * rate : null,
  };
}
