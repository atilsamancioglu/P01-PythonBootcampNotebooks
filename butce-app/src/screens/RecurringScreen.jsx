import { useMemo, useState } from 'react';
import { Plus, Pause, Play } from 'lucide-react';
import RecurringRow from '../components/recurring/RecurringRow.jsx';
import RecurringForm from '../components/recurring/RecurringForm.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { fmtTRY } from '../lib/format.js';
import { convertToTRY } from '../lib/fx.js';
import { today, addMonths } from '../lib/date.js';
import { generateBetween } from '../lib/recurring.js';

export default function RecurringScreen({ data }) {
  const { accounts, recurring, addRecurring, updateRecurring, removeRecurring, transactions, removeTransaction, fx } = data;
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const monthSummary = useMemo(() => {
    const startIso = today();
    const endIso = addMonths(startIso, 1);
    let income = 0, expense = 0;
    for (const rule of recurring) {
      if (!rule.active) continue;
      const dates = generateBetween(rule, startIso, endIso);
      const rate = rule.currency === 'TRY' ? 1 : (fx?.rates?.[rule.currency] ?? 1);
      const tryAmount = rule.amount * rate * dates.length;
      if (rule.type === 'gelir') income += tryAmount;
      else expense += tryAmount;
    }
    return { income, expense, net: income - expense };
  }, [recurring, fx]);

  const handleCreate = (payload) => {
    addRecurring(payload);
    setCreating(false);
    toast.show('Kural eklendi');
  };

  const handleUpdate = (payload) => {
    if (!editing) return;
    updateRecurring(editing.id, payload);
    setEditing(null);
    toast.show('Güncellendi');
  };

  const handleDelete = () => {
    if (!editing) return;
    const linked = transactions.filter(t => t.sourceId === editing.id);
    const msg = linked.length > 0
      ? `Bu kuraldan ${linked.length} işlem üretilmiş. Kural ve işlemler birlikte silinsin mi?`
      : 'Kural silinsin mi?';
    if (!window.confirm(msg)) return;
    for (const t of linked) removeTransaction(t.id);
    removeRecurring(editing.id);
    setEditing(null);
    toast.show('Silindi');
  };

  const toggleActive = (rule) => {
    updateRecurring(rule.id, { active: !rule.active });
    toast.show(rule.active ? 'Duraklatıldı' : 'Yeniden başlatıldı');
  };

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => Number(b.active) - Number(a.active) || b.amount - a.amount),
    [recurring]
  );

  return (
    <div>
      <div className="topbar">
        <h1>Tekrar Eden</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {recurring.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 6 }}>
              Önümüzdeki 30 Gün Tahmini
            </div>
            <div className="hero-balance" style={{ padding: '12px 0' }}>
              <div className="hero-value" style={{ fontSize: 32, color: monthSummary.net >= 0 ? 'var(--text-1)' : 'var(--negative)' }}>
                {fmtTRY(monthSummary.net, { signed: true })}
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-tile">
                <div className="stat-label" style={{ color: 'var(--positive)' }}>Gelir</div>
                <div className="stat-value">{fmtTRY(monthSummary.income)}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label" style={{ color: 'var(--negative)' }}>Gider</div>
                <div className="stat-value">{fmtTRY(monthSummary.expense)}</div>
              </div>
            </div>
          </div>
        )}

        {recurring.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Plus size={24} color="var(--text-3)" /></div>
            <div>Henüz tekrar eden kuralın yok</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Maaş, kira, abonelik gibi düzenli işlemleri ekle</div>
          </div>
        ) : (
          <div className="card card-tight" style={{ marginBottom: 16 }}>
            {sorted.map(r => {
              const account = accounts.find(a => a.id === r.accountId);
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RecurringRow rule={r} account={account} onClick={() => setEditing(r)} />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => { e.stopPropagation(); toggleActive(r); }}
                    style={{ width: 32, height: 32, background: 'transparent', color: 'var(--text-muted)' }}
                    aria-label={r.active ? 'Duraklat' : 'Başlat'}
                  >
                    {r.active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', height: 52, borderStyle: 'dashed', borderWidth: 1, borderColor: 'var(--border-strong)' }}
          onClick={() => setCreating(true)}
        >
          <Plus size={18} />
          Yeni Kural Ekle
        </button>
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Yeni Tekrar Eden">
        {creating && (
          <RecurringForm
            accounts={accounts}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Kuralı Düzenle">
        {editing && (
          <RecurringForm
            accounts={accounts}
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            onDelete={handleDelete}
          />
        )}
      </Sheet>
    </div>
  );
}
