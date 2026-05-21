import { useState } from 'react';
import { CURRENCIES, ACCOUNT_COLORS } from '../../data/currencies.js';

const TYPES = [
  { id: 'nakit', label: 'Nakit', icon: 'Wallet' },
  { id: 'banka', label: 'Banka', icon: 'Landmark' },
  { id: 'kredi_karti', label: 'Kredi Kartı', icon: 'CreditCard' },
];

export default function AccountForm({ initial, onSubmit, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? 'banka');
  const [currency, setCurrency] = useState(initial?.currency ?? 'TRY');
  const [initialBalance, setInitialBalance] = useState(String(initial?.initialBalance ?? ''));
  const [color, setColor] = useState(initial?.color ?? ACCOUNT_COLORS[0]);
  const [cutoffDay, setCutoffDay] = useState(initial?.cutoffDay ?? 25);
  const [paymentDueDay, setPaymentDueDay] = useState(initial?.paymentDueDay ?? 10);
  const [creditLimit, setCreditLimit] = useState(String(initial?.creditLimit ?? ''));

  const canSubmit = name.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      type,
      currency,
      color,
      initialBalance: Number(initialBalance.replace(',', '.')) || 0,
    };
    if (type === 'kredi_karti') {
      payload.cutoffDay = Number(cutoffDay) || 25;
      payload.paymentDueDay = Number(paymentDueDay) || 10;
      payload.creditLimit = Number(creditLimit.replace(',', '.')) || 0;
    }
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label">Ad</label>
        <input
          type="text"
          className="input"
          placeholder="Örn: Garanti TL"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field-label">Tip</label>
        <div className="segmented">
          {TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              className={`segmented-item ${type === t.id ? 'active' : ''}`}
              onClick={() => setType(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Para Birimi</label>
        <div className="hscroll">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              type="button"
              className={`chip ${currency === c.code ? 'chip-active' : ''}`}
              onClick={() => setCurrency(c.code)}
            >
              <span>{c.flag}</span>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">
          {type === 'kredi_karti' ? 'Mevcut Borç' : 'Başlangıç Bakiyesi'}
        </label>
        <input
          type="text"
          inputMode="decimal"
          className="input numeric"
          placeholder="0"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
        {type === 'kredi_karti' && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            Mevcut borcunuzu negatif değer olarak girin (örn: -1500)
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label">Renk</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ACCOUNT_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid var(--text-1)' : '2px solid transparent',
                cursor: 'pointer',
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {type === 'kredi_karti' && (
        <>
          <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Kesim Günü</label>
              <input
                type="number" min="1" max="31"
                className="input numeric"
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Son Ödeme Günü</label>
              <input
                type="number" min="1" max="31"
                className="input numeric"
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Kredi Limiti (opsiyonel)</label>
            <input
              type="text"
              inputMode="decimal"
              className="input numeric"
              placeholder="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Sil
          </button>
        )}
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
          İptal
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!canSubmit}>
          {initial ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
