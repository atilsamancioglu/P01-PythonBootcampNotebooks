import { useMemo, useState } from 'react';
import { Plus, CreditCard as CardIcon, ChevronRight } from 'lucide-react';
import Sheet from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import CycleSelector from '../components/card/CycleSelector.jsx';
import CardStatement from '../components/card/CardStatement.jsx';
import InstallmentForm from '../components/card/InstallmentForm.jsx';
import {
  getCurrentCycle,
  cycleByMonth,
  calculateCycleTotal,
  getNextCycles,
} from '../lib/cardCycle.js';
import { fmtTRY, fmtAmount } from '../lib/format.js';
import { formatShortDate, today } from '../lib/date.js';

export default function CardsScreen({ data }) {
  const { accounts, transactions, planned, addPlannedBatch, removePlanned, removePlannedGroup, removeTransaction } = data;
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [cycleState, setCycleState] = useState(null);
  const [installmentOpen, setInstallmentOpen] = useState(false);

  const cards = useMemo(
    () => accounts.filter(a => a.type === 'kredi_karti' && !a.archived),
    [accounts]
  );

  if (selected) {
    const cycle = cycleState || getCurrentCycle(selected);
    const totals = calculateCycleTotal(selected, cycle, transactions, planned);

    return (
      <div>
        <div className="topbar">
          <button
            onClick={() => { setSelected(null); setCycleState(null); }}
            className="btn-icon"
            aria-label="Geri"
          >
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1 style={{ flex: 1, textAlign: 'center' }}>{selected.name}</h1>
          <div style={{ width: 40 }} />
        </div>

        <div className="screen" style={{ paddingTop: 0 }}>
          <CycleSelector
            card={selected}
            cycle={cycle}
            onChange={setCycleState}
          />

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="hero-balance" style={{ padding: '12px 0' }}>
              <div className="hero-label">Bu dönem ekstre tahmini</div>
              <div className="hero-value">{fmtTRY(totals.grandTotal)}</div>
              <div className="hero-sub">Son ödeme: {formatShortDate(cycle.dueDate)}</div>
            </div>
          </div>

          <CardStatement
            card={selected}
            items={totals.items}
            plannedTotal={totals.plannedTotal}
            freeTotal={totals.freeTotal}
            onDeleteTx={(id) => { removeTransaction(id); toast.show('Silindi'); }}
            onDeletePlanned={(id) => { removePlanned(id); toast.show('Silindi'); }}
            onDeleteGroup={(gid) => { removePlannedGroup(gid); toast.show('Taksit grubu silindi'); }}
          />

          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 16, height: 52 }}
            onClick={() => setInstallmentOpen(true)}
          >
            <Plus size={18} /> Taksitli Alışveriş Ekle
          </button>
        </div>

        <Sheet open={installmentOpen} onClose={() => setInstallmentOpen(false)} title="Taksitli Alışveriş">
          {installmentOpen && (
            <InstallmentForm
              card={selected}
              onSubmit={(items) => {
                addPlannedBatch(items);
                setInstallmentOpen(false);
                toast.show(`${items.length} taksit eklendi`);
              }}
              onCancel={() => setInstallmentOpen(false)}
            />
          )}
        </Sheet>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <h1>Kartlar</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        {cards.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><CardIcon size={24} color="var(--text-3)" /></div>
            <div>Henüz kredi kartın yok</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Hesaplar ekranından "Kredi Kartı" tipinde hesap ekle</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cards.map(card => {
              const current = getCurrentCycle(card);
              const totals = calculateCycleTotal(card, current, transactions, planned);
              const nextCycles = getNextCycles(card, 6).slice(1);

              return (
                <div key={card.id} className="card" style={{ borderLeft: `3px solid ${card.color}` }}>
                  <button
                    type="button"
                    onClick={() => { setSelected(card); setCycleState(null); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: card.color }}>
                        <CardIcon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{card.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {current.label} · son ödeme {formatShortDate(current.dueDate)}
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>

                    <div className="numeric" style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 28,
                      fontWeight: 500,
                    }}>
                      {fmtTRY(totals.grandTotal)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      Planlı {fmtTRY(totals.plannedTotal)} + Serbest {fmtTRY(totals.freeTotal)}
                    </div>
                  </button>

                  {nextCycles.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Sonraki Dönemler (Planlı)
                      </div>
                      <div className="hscroll">
                        {nextCycles.map(c => {
                          const t = calculateCycleTotal(card, c, transactions, planned);
                          return (
                            <div key={c.label} style={{
                              padding: '8px 12px',
                              background: 'var(--bg-elev-2)',
                              borderRadius: 'var(--radius-sm)',
                              minWidth: 100,
                              textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.labelShort}</div>
                              <div className="numeric" style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                                {fmtTRY(t.plannedTotal)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
