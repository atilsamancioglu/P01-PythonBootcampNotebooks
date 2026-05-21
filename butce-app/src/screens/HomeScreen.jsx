import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import TransactionForm from '../components/transaction/TransactionForm.jsx';
import TransactionRow from '../components/transaction/TransactionRow.jsx';
import CategoryDonut from '../components/transaction/CategoryDonut.jsx';
import { addMonths, formatMonth, monthKey, today } from '../lib/date.js';
import { fmtTRY, fmtCompact } from '../lib/format.js';
import { calculateTotalWealthTRY } from '../lib/balance.js';

export default function HomeScreen({ data }) {
  const { accounts, transactions, planned, recurring, updateRecurring, addTransaction, removeTransaction, settings, fx } = data;
  const toast = useToast();
  const [cursor, setCursor] = useState(today().slice(0, 7) + '-01');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState('all');

  const curMonth = cursor.slice(0, 7);

  const txByAccount = useMemo(() => (
    accountFilter === 'all'
      ? transactions
      : transactions.filter(t => t.accountId === accountFilter || t.toAccountId === accountFilter)
  ), [transactions, accountFilter]);

  const monthTx = useMemo(
    () => txByAccount.filter(t => monthKey(t.date) === curMonth)
                     .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [txByAccount, curMonth]
  );

  const stats = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of monthTx) {
      if (t.type === 'gelir') income += t.amountTRY;
      else if (t.type === 'gider') expense += t.amountTRY;
    }
    return { income, expense, net: income - expense };
  }, [monthTx]);

  const donutData = useMemo(() => {
    const map = new Map();
    for (const t of monthTx) {
      if (t.type !== 'gider') continue;
      map.set(t.category, (map.get(t.category) || 0) + t.amountTRY);
    }
    return Array.from(map.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const handleSubmit = async (input) => {
    await addTransaction(input);
    setSheetOpen(false);
    toast.show('İşlem eklendi');
  };

  const handleDelete = (id) => {
    removeTransaction(id);
    toast.show('Silindi');
  };

  const handleSkipRecurring = (tx) => {
    const rule = recurring.find(r => r.id === tx.sourceId);
    if (!rule) { removeTransaction(tx.id); return; }
    const nextExceptions = [...(rule.exceptions || []), { date: tx.date, action: 'skip' }];
    updateRecurring(rule.id, { exceptions: nextExceptions });
    removeTransaction(tx.id);
    toast.show('Bu ay atlandı');
  };

  const isCurrentMonth = curMonth === today().slice(0, 7);
  const totalWealth = useMemo(
    () => calculateTotalWealthTRY(accounts, transactions, planned, fx),
    [accounts, transactions, planned, fx]
  );
  const hasMultiAccountsOrFx = accounts.length > 1 || accounts.some(a => a.currency !== 'TRY');

  return (
    <div>
      <div className="topbar">
        <h1>Bütçe</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn-icon" onClick={() => setCursor(addMonths(cursor, -1))} aria-label="Önceki ay">
            <ChevronLeft size={20} />
          </button>
          <div style={{ minWidth: 130, textAlign: 'center', fontWeight: 500 }}>
            {formatMonth(cursor)}
          </div>
          <button
            className="btn-icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Sonraki ay"
            disabled={isCurrentMonth}
            style={isCurrentMonth ? { opacity: 0.3 } : undefined}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {hasMultiAccountsOrFx && (
          <div className="card card-tight" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Toplam Servet</div>
              <div className="numeric" style={{ fontSize: 18, fontWeight: 500 }}>{fmtTRY(totalWealth)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {accounts.slice(0, 4).map(a => (
                <span key={a.id} style={{
                  width: 10, height: 10, borderRadius: 5, background: a.color, display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
        )}

        {accounts.length > 1 && (
          <div className="hscroll" style={{ marginBottom: 16 }}>
            <button
              className={`chip ${accountFilter === 'all' ? 'chip-active' : ''}`}
              onClick={() => setAccountFilter('all')}
            >Tümü</button>
            {accounts.map(a => (
              <button
                key={a.id}
                className={`chip ${accountFilter === a.id ? 'chip-active' : ''}`}
                onClick={() => setAccountFilter(a.id)}
              >
                <span style={{ width: 8, height: 8, borderRadius: 4, background: a.color, display: 'inline-block' }} />
                {a.name}
              </button>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="hero-balance">
            <div className="hero-label">Net</div>
            <div className="hero-value" style={{
              color: stats.net >= 0 ? 'var(--text-1)' : 'var(--negative)'
            }}>
              {fmtTRY(stats.net, { signed: true })}
            </div>
            <div className="hero-sub">{monthTx.length} işlem · {formatMonth(cursor)}</div>
          </div>

          <div className="stats-row">
            <div className="stat-tile">
              <div className="stat-label" style={{ color: 'var(--positive)' }}>Gelir</div>
              <div className="stat-value">{fmtTRY(stats.income)}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label" style={{ color: 'var(--negative)' }}>Gider</div>
              <div className="stat-value">{fmtTRY(stats.expense)}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
            Kategori Dağılımı
          </h2>
          <CategoryDonut data={donutData} total={stats.expense} />
          {donutData.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12 }}>
              {donutData.slice(0, 6).map(d => {
                const pct = stats.expense > 0 ? (d.value / stats.expense * 100) : 0;
                return (
                  <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: `var(--cat-${(donutData.indexOf(d) % 8) + 1})`
                    }} />
                    <span style={{ color: 'var(--text-2)' }}>{d.category}</span>
                    <span className="numeric" style={{ color: 'var(--text-3)' }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section-header">
          <h2>İşlemler</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{monthTx.length} adet</span>
        </div>

        {monthTx.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Plus size={24} color="var(--text-3)" />
            </div>
            <div>Bu ay henüz işlem yok</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Aşağıdaki + tuşuyla ekleyebilirsin</div>
          </div>
        ) : (
          <div className="card card-tight">
            {monthTx.map(tx => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                account={accounts.find(a => a.id === tx.accountId)}
                onDelete={() => handleDelete(tx.id)}
                onSkipRecurring={() => handleSkipRecurring(tx)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-fab"
        onClick={() => setSheetOpen(true)}
        aria-label="Yeni işlem"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Yeni İşlem">
        {sheetOpen && (
          <TransactionForm
            accounts={accounts}
            defaultAccountId={settings.defaultAccountId}
            onSubmit={handleSubmit}
            onCancel={() => setSheetOpen(false)}
          />
        )}
      </Sheet>
    </div>
  );
}
