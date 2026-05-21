import { useState, useEffect, useMemo } from 'react';
import CategoryGrid from '../transaction/CategoryGrid.jsx';
import { categoriesFor } from '../../data/categories.js';
import { today, parseIso, toIso, MONTHS_TR } from '../../lib/date.js';
import { fmtTRY, CURRENCY_SYMBOLS } from '../../lib/format.js';
import { CURRENCIES } from '../../data/currencies.js';
import { getCurrentRates } from '../../lib/fx.js';
import { newId } from '../../lib/id.js';
import { cycleByMonth } from '../../lib/cardCycle.js';

export default function InstallmentForm({ card, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState(12);
  const [currency, setCurrency] = useState(card?.currency || 'TRY');
  const [category, setCategory] = useState('elektronik');
  const [firstDate, setFirstDate] = useState(today());
  const [rates, setRates] = useState(null);

  useEffect(() => {
    if (currency !== 'TRY') getCurrentRates().then(setRates).catch(() => {});
  }, [currency]);

  const totalNum = Number(total.replace(',', '.')) || 0;
  const perInstallment = count > 0 ? totalNum / count : 0;
  const rate = currency === 'TRY' ? 1 : rates?.rates?.[currency] || 1;

  const previewDates = useMemo(() => {
    if (count <= 0 || !card) return [];
    const out = [];
    const d = parseIso(firstDate);
    for (let i = 0; i < Math.min(count, 12); i++) {
      const month = new Date(d.getFullYear(), d.getMonth() + i, d.getDate());
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      month.setDate(Math.min(d.getDate(), lastDay));
      out.push(toIso(month));
    }
    return out;
  }, [firstDate, count, card]);

  const canSubmit = name.trim() && totalNum > 0 && count > 0 && card;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const groupId = newId('ig');
    const items = [];
    const d = parseIso(firstDate);
    for (let i = 0; i < count; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
      const lastDay = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      m.setDate(Math.min(d.getDate(), lastDay));
      const postingDate = toIso(m);
      const amountTRY = perInstallment * rate;
      items.push({
        accountId: card.id,
        name: `${name.trim()} ${i + 1}/${count}`,
        category,
        amount: perInstallment,
        currency,
        fxRate: rate,
        amountTRY,
        postingDate,
        installmentGroupId: groupId,
        installmentNo: i + 1,
        installmentTotal: count,
        source: 'manual',
        sourceId: null,
        status: postingDate <= today() ? 'kesildi' : 'beklemede',
        note: '',
      });
    }

    onSubmit(items);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label">Alışveriş Adı</label>
        <input
          type="text" className="input"
          placeholder="Örn: MacBook"
          value={name} onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="field" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <label className="field-label">Toplam Tutar</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text" inputMode="decimal"
              className="input numeric"
              placeholder="0"
              value={total} onChange={(e) => setTotal(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
            <span style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }}>{CURRENCY_SYMBOLS[currency]}</span>
          </div>
        </div>
        <div>
          <label className="field-label">Taksit</label>
          <input
            type="number" min="1" max="36"
            className="input numeric"
            value={count} onChange={(e) => setCount(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
          />
        </div>
      </div>

      {totalNum > 0 && count > 0 && (
        <div className="card card-tight" style={{ marginBottom: 16, background: 'var(--bg-elev-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Aylık taksit</span>
            <span className="numeric" style={{ fontWeight: 500 }}>
              {CURRENCY_SYMBOLS[currency]}{perInstallment.toFixed(2)}
            </span>
          </div>
          {currency !== 'TRY' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              <span>≈ TL karşılığı</span>
              <span className="numeric">{fmtTRY(perInstallment * rate)}</span>
            </div>
          )}
        </div>
      )}

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
        <CategoryGrid type="gider" value={category} onChange={setCategory} />
      </div>

      <div className="field">
        <label className="field-label">İlk Taksit Tarihi</label>
        <input
          type="date" className="input"
          value={firstDate} onChange={(e) => setFirstDate(e.target.value)}
        />
      </div>

      {previewDates.length > 0 && (
        <div className="card card-tight" style={{ marginBottom: 16, background: 'var(--bg-elev-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Posting tarihleri {count > 12 && `(ilk 12 / ${count})`}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
            {previewDates.map((d, i) => {
              const date = parseIso(d);
              return (
                <span key={d} className="numeric" style={{
                  padding: '4px 8px', background: 'var(--bg-elev-3)', borderRadius: 4,
                }}>
                  {i + 1}. {date.getDate()} {MONTHS_TR[date.getMonth()].slice(0, 3)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>İptal</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!canSubmit}>
          {count} Taksit Oluştur
        </button>
      </div>
    </form>
  );
}
