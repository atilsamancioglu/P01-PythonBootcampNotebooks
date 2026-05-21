import Icon from '../ui/Icon.jsx';
import { getCategory } from '../../data/categories.js';
import { fmtAmount, fmtTRY } from '../../lib/format.js';
import { formatShortDate } from '../../lib/date.js';
import { Trash2 } from 'lucide-react';

export default function CardStatement({ card, items, plannedTotal, freeTotal, onDeleteTx, onDeletePlanned, onDeleteGroup }) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div>Bu dönemde hareket yok</div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat-tile">
          <div className="stat-label">Planlı</div>
          <div className="stat-value">{fmtTRY(plannedTotal)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Serbest</div>
          <div className="stat-value">{fmtTRY(freeTotal)}</div>
        </div>
      </div>

      <div className="card card-tight">
        {items.map((entry, i) => {
          const t = entry.item;
          const cat = getCategory(t.category);
          const isPlanned = entry.kind === 'planned';
          const date = t.postingDate || t.date;
          return (
            <div key={isPlanned ? `pc-${t.id}` : `tx-${t.id}`} className="row">
              <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: cat.color }}>
                <Icon name={cat.icon} size={18} />
              </div>
              <div className="row-main">
                <div className="row-title">
                  {isPlanned ? t.name : cat.label}
                  {isPlanned && t.installmentGroupId && (
                    <span className="badge badge-installment" style={{ marginLeft: 6 }}>
                      {t.installmentNo}/{t.installmentTotal}
                    </span>
                  )}
                  {isPlanned && t.source === 'recurring' && (
                    <span className="badge badge-recurring" style={{ marginLeft: 6 }}>↻</span>
                  )}
                </div>
                <div className="row-sub">
                  {formatShortDate(date)}
                  {t.note && <> · {t.note}</>}
                </div>
              </div>
              <div className="row-amount" style={{ textAlign: 'right' }}>
                <div>−{fmtAmount(t.amount, t.currency).replace(/^[+−]/, '')}</div>
                {t.currency !== 'TRY' && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>
                    ≈ −{fmtAmount(t.amountTRY, 'TRY').replace(/^[+−]/, '')}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  if (isPlanned) {
                    if (t.installmentGroupId && window.confirm('Bütün taksit grubunu sil?')) {
                      onDeleteGroup(t.installmentGroupId);
                    } else if (!t.installmentGroupId) {
                      onDeletePlanned(t.id);
                    } else {
                      onDeletePlanned(t.id);
                    }
                  } else {
                    onDeleteTx(t.id);
                  }
                }}
                style={{ width: 32, height: 32, background: 'transparent', color: 'var(--text-muted)' }}
                aria-label="Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
