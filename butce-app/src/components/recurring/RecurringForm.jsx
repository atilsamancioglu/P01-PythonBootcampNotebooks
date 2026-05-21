import { useEffect, useState } from 'react';
import CategoryGrid from '../transaction/CategoryGrid.jsx';
import { categoriesFor } from '../../data/categories.js';
import { today, MONTHS_TR } from '../../lib/date.js';
import { CURRENCY_SYMBOLS } from '../../lib/format.js';
import { CURRENCIES } from '../../data/currencies.js';

const FREQUENCIES = [
  { id: 'aylik', label: 'Aylık' },
  { id: 'haftalik', label: 'Haftalık' },
  { id: 'yillik', label: 'Yıllık' },
];

const WEEK_DAYS = [
  { id: 1, label: 'Pzt' },
  { id: 2, label: 'Sal' },
  { id: 3, label: 'Çar' },
  { id: 4, label: 'Per' },
  { id: 5, label: 'Cum' },
  { id: 6, label: 'Cmt' },
  { id: 0, label: 'Paz' },
];

export default function RecurringForm({ accounts, initial, onSubmit, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? 'gider');
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id);
  const [category, setCategory] = useState(initial?.category ?? categoriesFor(initial?.type ?? 'gider')[0].id);
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? accounts[0]?.currency ?? 'TRY');
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'aylik');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth ?? 1);
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 1);
  const [monthOfYear, setMonthOfYear] = useState(initial?.monthOfYear ?? 1);
  const [startDate, setStartDate] = useState(initial?.startDate ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [active, setActive] = useState(initial?.active !== false);

  const account = accounts.find(a => a.id === accountId);
  const symbol = CURRENCY_SYMBOLS[currency] || '';

  useEffect(() => {
    if (account && account.currency !== currency) setCurrency(account.currency);
  }, [accountId, account, currency]);

  useEffect(() => {
    const list = categoriesFor(type);
    if (!list.find(c => c.id === category)) setCategory(list[0].id);
  }, [type, category]);

  const canSubmit = name.trim() && Number(amount.replace(',', '.')) > 0 && accountId;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      type,
      category,
      accountId,
      amount: Number(amount.replace(',', '.')) || 0,
      currency,
      frequency,
      dayOfMonth: Number(dayOfMonth) || 1,
      dayOfWeek: Number(dayOfWeek) || 1,
      monthOfYear: Number(monthOfYear) || 1,
      startDate,
      endDate: endDate || null,
      active,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label">Ad</label>
        <input
          type="text" className="input"
          placeholder="Örn: Maaş, Netflix..."
          value={name} onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="field">
        <div className="segmented">
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
      </div>

      <div className="field">
        <label className="field-label">Tutar</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text" inputMode="decimal"
            className="input numeric"
            placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)',
          }}>{symbol}</span>
        </div>
      </div>

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
              <span style={{ width: 8, height: 8, borderRadius: 4, background: a.color, display: 'inline-block' }} />
              {a.name}
            </button>
          ))}
        </div>
        {account?.type === 'kredi_karti' && (
          <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>
            Bu kart hesabı seçildi: abonelik olarak ekstreye düşecek
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label">Para Birimi</label>
        <div className="hscroll">
          {CURRENCIES.map(c => (
            <button
              key={c.code} type="button"
              className={`chip ${currency === c.code ? 'chip-active' : ''}`}
              onClick={() => setCurrency(c.code)}
            >{c.flag} {c.code}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Kategori</label>
        <CategoryGrid type={type} value={category} onChange={setCategory} />
      </div>

      <div className="field">
        <label className="field-label">Periyot</label>
        <div className="segmented">
          {FREQUENCIES.map(f => (
            <button
              key={f.id} type="button"
              className={`segmented-item ${frequency === f.id ? 'active' : ''}`}
              onClick={() => setFrequency(f.id)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {frequency === 'aylik' && (
        <div className="field">
          <label className="field-label">Ayın Günü</label>
          <input
            type="number" min="1" max="31"
            className="input numeric"
            value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </div>
      )}

      {frequency === 'haftalik' && (
        <div className="field">
          <label className="field-label">Haftanın Günü</label>
          <div className="hscroll">
            {WEEK_DAYS.map(d => (
              <button
                key={d.id} type="button"
                className={`chip ${dayOfWeek === d.id ? 'chip-active' : ''}`}
                onClick={() => setDayOfWeek(d.id)}
              >{d.label}</button>
            ))}
          </div>
        </div>
      )}

      {frequency === 'yillik' && (
        <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="field-label">Ay</label>
            <select
              className="select"
              value={monthOfYear} onChange={(e) => setMonthOfYear(e.target.value)}
            >
              {MONTHS_TR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Gün</label>
            <input
              type="number" min="1" max="31"
              className="input numeric"
              value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="field-label">Başlangıç</label>
          <input
            type="date" className="input"
            value={startDate} onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Bitiş (opsiyonel)</label>
          <input
            type="date" className="input"
            value={endDate} onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox" id="rec-active"
          checked={active} onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="rec-active">Aktif</label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>Sil</button>
        )}
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>İptal</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!canSubmit}>
          {initial ? 'Güncelle' : 'Oluştur'}
        </button>
      </div>
    </form>
  );
}
