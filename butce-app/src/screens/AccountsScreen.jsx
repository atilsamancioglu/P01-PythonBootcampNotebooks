import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import AccountCard from '../components/account/AccountCard.jsx';
import AccountForm from '../components/account/AccountForm.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { fmtTRY, fmtRate } from '../lib/format.js';
import { calculateTotalWealthTRY } from '../lib/balance.js';
import { getCurrentRates } from '../lib/fx.js';

export default function AccountsScreen({ data }) {
  const { accounts, transactions, planned, addAccount, updateAccount, removeAccount, fx, setFx } = data;
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const grouped = useMemo(() => {
    const order = ['banka', 'nakit', 'kredi_karti'];
    const out = { banka: [], nakit: [], kredi_karti: [] };
    for (const a of accounts) {
      if (a.archived) continue;
      (out[a.type] ?? (out[a.type] = [])).push(a);
    }
    return order.flatMap(k => out[k] || []);
  }, [accounts]);

  const totalWealth = useMemo(
    () => calculateTotalWealthTRY(accounts, transactions, planned, fx),
    [accounts, transactions, planned, fx]
  );

  const handleCreate = (payload) => {
    addAccount(payload);
    setCreating(false);
    toast.show('Hesap eklendi');
  };

  const handleUpdate = (payload) => {
    updateAccount(editing.id, payload);
    setEditing(null);
    toast.show('Güncellendi');
  };

  const handleDelete = () => {
    if (!editing) return;
    const usage = transactions.filter(t => t.accountId === editing.id || t.toAccountId === editing.id).length;
    const msg = usage > 0
      ? `Bu hesaba bağlı ${usage} işlem var. Yine de silinsin mi? İşlemler silinecek.`
      : 'Hesap silinsin mi?';
    if (!window.confirm(msg)) return;
    removeAccount(editing.id);
    setEditing(null);
    toast.show('Hesap silindi');
  };

  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      const next = await getCurrentRates();
      setFx({ ...next, date: new Date().toISOString().slice(0, 10) });
      toast.show('Kurlar güncellendi');
    } catch {
      toast.show('Kurlar alınamadı');
    }
    setRefreshing(false);
  };

  return (
    <div>
      <div className="topbar">
        <h1>Hesaplar</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="hero-balance">
            <div className="hero-label">Toplam Servet</div>
            <div className="hero-value">{fmtTRY(totalWealth)}</div>
            <div className="hero-sub">{grouped.filter(a => a.type !== 'kredi_karti').length} aktif hesap</div>
          </div>
        </div>

        {fx && (
          <div className="card card-tight" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kurlar {fx.stale && <span style={{ color: 'var(--warning)' }}>(eski)</span>}
              </div>
              <button
                className="btn-icon"
                onClick={handleRefreshRates}
                disabled={refreshing}
                style={{ width: 32, height: 32, background: 'transparent' }}
                aria-label="Yenile"
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 13 }}>
              {['USD', 'EUR', 'GBP'].map(c => fx.rates?.[c] && (
                <div key={c} style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{c}/TRY</div>
                  <div className="numeric" style={{ fontWeight: 500 }}>{fmtRate(fx.rates[c])}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
              {fx.source === 'frankfurter' ? 'frankfurter.app · ECB' : fx.source}
              {fx.date && ` · ${fx.date}`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {grouped.map(a => (
            <AccountCard
              key={a.id}
              account={a}
              transactions={transactions}
              planned={planned}
              fxRates={fx}
              onClick={() => setEditing(a)}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 16, height: 52, borderStyle: 'dashed', borderWidth: 1, borderColor: 'var(--border-strong)' }}
          onClick={() => setCreating(true)}
        >
          <Plus size={18} />
          Yeni Hesap Ekle
        </button>
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Yeni Hesap">
        {creating && (
          <AccountForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Hesabı Düzenle">
        {editing && (
          <AccountForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            onDelete={accounts.length > 1 ? handleDelete : null}
          />
        )}
      </Sheet>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
