import { useMemo, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import BudgetGoalRow from '../components/budget/BudgetGoalRow.jsx';
import BudgetGoalForm from '../components/budget/BudgetGoalForm.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { fmtTRY } from '../lib/format.js';
import { today, monthKey, formatMonth } from '../lib/date.js';

export default function BudgetScreen({ data }) {
  const { goals, transactions, addGoal, updateGoal, removeGoal } = data;
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const curMonth = today().slice(0, 7);

  const spentByCategory = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== 'gider') continue;
      if (monthKey(t.date) !== curMonth) continue;
      map.set(t.category, (map.get(t.category) || 0) + t.amountTRY);
    }
    return map;
  }, [transactions, curMonth]);

  const totalLimit = goals.filter(g => g.active).reduce((s, g) => s + g.monthlyLimit, 0);
  const totalSpent = goals.filter(g => g.active).reduce((s, g) => s + (spentByCategory.get(g.category) || 0), 0);
  const overGoals = goals.filter(g => g.active && (spentByCategory.get(g.category) || 0) > g.monthlyLimit).length;

  const sorted = useMemo(
    () => [...goals].sort((a, b) => {
      if (a.active !== b.active) return Number(b.active) - Number(a.active);
      const aPct = (spentByCategory.get(a.category) || 0) / (a.monthlyLimit || 1);
      const bPct = (spentByCategory.get(b.category) || 0) / (b.monthlyLimit || 1);
      return bPct - aPct;
    }),
    [goals, spentByCategory]
  );

  const handleCreate = (payload) => {
    addGoal(payload);
    setCreating(false);
    toast.show('Hedef eklendi');
  };

  const handleUpdate = (payload) => {
    if (!editing) return;
    updateGoal(editing.id, payload);
    setEditing(null);
    toast.show('Güncellendi');
  };

  const handleDelete = () => {
    if (!editing) return;
    if (!window.confirm('Hedef silinsin mi?')) return;
    removeGoal(editing.id);
    setEditing(null);
    toast.show('Silindi');
  };

  return (
    <div>
      <div className="topbar">
        <h1>Bütçe</h1>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatMonth(curMonth + '-01')}</div>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {goals.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="hero-balance" style={{ padding: '12px 0' }}>
              <div className="hero-label">Bu Ay Harcanan / Limit</div>
              <div className="hero-value" style={{
                color: totalSpent > totalLimit ? 'var(--negative)' : 'var(--text-1)',
              }}>
                {fmtTRY(totalSpent)}
                <span style={{ color: 'var(--text-3)', fontSize: 18 }}> / {fmtTRY(totalLimit)}</span>
              </div>
              {overGoals > 0 && (
                <div className="hero-sub" style={{ color: 'var(--negative)' }}>
                  {overGoals} kategori limit aştı
                </div>
              )}
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Target size={24} color="var(--text-3)" /></div>
            <div>Henüz bütçe hedefi yok</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Kategori bazında aylık harcama limiti belirle</div>
          </div>
        ) : (
          <div>
            {sorted.map(g => (
              <BudgetGoalRow
                key={g.id}
                goal={g}
                spent={spentByCategory.get(g.category) || 0}
                onClick={() => setEditing(g)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', height: 52, borderStyle: 'dashed', borderWidth: 1, borderColor: 'var(--border-strong)' }}
          onClick={() => setCreating(true)}
        >
          <Plus size={18} />
          Yeni Hedef Ekle
        </button>
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Yeni Bütçe Hedefi">
        {creating && (
          <BudgetGoalForm
            existingCategories={goals.map(g => g.category)}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Hedefi Düzenle">
        {editing && (
          <BudgetGoalForm
            initial={editing}
            existingCategories={goals.map(g => g.category)}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            onDelete={handleDelete}
          />
        )}
      </Sheet>
    </div>
  );
}
