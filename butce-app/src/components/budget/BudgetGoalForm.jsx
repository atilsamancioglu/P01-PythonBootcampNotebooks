import { useState } from 'react';
import CategoryGrid from '../transaction/CategoryGrid.jsx';
import { EXPENSE_CATEGORIES } from '../../data/categories.js';
import { CURRENCY_SYMBOLS } from '../../lib/format.js';

export default function BudgetGoalForm({ initial, existingCategories, onSubmit, onCancel, onDelete }) {
  const [category, setCategory] = useState(initial?.category ?? EXPENSE_CATEGORIES[0].id);
  const [limit, setLimit] = useState(initial?.monthlyLimit ? String(initial.monthlyLimit) : '');
  const [active, setActive] = useState(initial?.active !== false);

  const conflict = !initial && existingCategories?.includes(category);
  const canSubmit = !conflict && Number(limit.replace(',', '.')) > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      category,
      monthlyLimit: Number(limit.replace(',', '.')) || 0,
      active,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label">Kategori</label>
        <CategoryGrid type="gider" value={category} onChange={setCategory} />
        {conflict && (
          <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 8 }}>
            Bu kategori için zaten bir hedef var. Mevcut hedefi düzenle.
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label">Aylık Limit (TL)</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text" inputMode="decimal"
            className="input numeric"
            placeholder="0"
            value={limit} onChange={(e) => setLimit(e.target.value)}
            style={{ paddingLeft: 40, fontSize: 22 }}
            autoFocus
          />
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', fontSize: 18,
          }}>{CURRENCY_SYMBOLS.TRY}</span>
        </div>
      </div>

      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox" id="goal-active"
          checked={active} onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="goal-active">Aktif</label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {onDelete && <button type="button" className="btn btn-danger" onClick={onDelete}>Sil</button>}
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>İptal</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!canSubmit}>
          {initial ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
