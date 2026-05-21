import { useEffect, useState } from 'react';
import CategoryGrid from './CategoryGrid.jsx';
import { categoriesFor } from '../../data/categories.js';
import { today } from '../../lib/date.js';
import { fmtTRY, CURRENCY_SYMBOLS } from '../../lib/format.js';
import { getCurrentRates } from '../../lib/fx.js';

export default function TransactionForm({ accounts, defaultAccountId, onSubmit, onCancel }) {
  const [type, setType] = useState('gider');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(defaultAccountId || accounts[0]?.id);
  const [category, setCategory] = useState(categoriesFor('gider')[0].id);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [rates, setRates] = useState(null);

  const account = accounts.find(a => a.id === accountId) || accounts[0];
  const currency = account?.currency || 'TRY';
  const symbol = CURRENCY_SYMBOLS[currency] || '';

  useEffect(() => {
    if (currency !== 'TRY') {
      getCurrentRates().then(setRates).catch(() => {});
    }
  }, [currency]);

  useEffect(() => {
    const list = categoriesFor(type);
    if (!list.find(c => c.id === category)) setCategory(list[0].id);
  }, [type, category]);

  const numAmount = Number(amount.replace(',', '.')) || 0;
  const tryPreview = currency !== 'TRY' && rates?.rates?.[currency]
    ? numAmount * rates.rates[currency]
    : null;

  const canSubmit = numAmount > 0 && !!category && !!accountId;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      type,
      amount: numAmount,
      accountId,
      currency,
      category,
      date,
      note: note.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="segmented" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`segmented-item ${type === 'gider' ? 'active' : ''}`}
          onClick={() => setType('gider')}
        >Gider</button>
        <button
          type="button"
          className={`segmented-item ${type === 'gelir' ? 'active' : ''}`}
          onClick={() => setType('gelir')}
        >Gelir</button>
      </div>

      <div className="field">
        <label className="field-label">Tutar</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode="decimal"
            className="input numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ paddingLeft: 40, fontSize: 22 }}
            autoFocus
          />
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', fontSize: 18,
          }}>{symbol}</span>
        </div>
        {tryPreview != null && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, marginLeft: 4 }}>
            ≈ {fmtTRY(tryPreview)} (kur {rates?.rates?.[currency]?.toFixed(2)})
          </div>
        )}
      </div>

      {accounts.length > 1 && (
        <div className="field">
          <label className="field-label">Hesap</label>
          <div className="hscroll">
            {accounts.map(a => (
              <button
                key={a.id}
                type="button"
                className={`chip ${a.id === accountId ? 'chip-active' : ''}`}
                onClick={() => setAccountId(a.id)}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: 4, background: a.color, display: 'inline-block'
                }} />
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label className="field-label">Kategori</label>
        <CategoryGrid type={type} value={category} onChange={setCategory} />
      </div>

      <div className="field">
        <label className="field-label">Tarih</label>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Not (opsiyonel)</label>
        <input
          type="text"
          className="input"
          placeholder="Açıklama..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
          İptal
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!canSubmit}>
          Kaydet
        </button>
      </div>
    </form>
  );
}
