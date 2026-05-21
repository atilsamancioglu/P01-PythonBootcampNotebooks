import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { getCategory } from '../../data/categories.js';
import { fmtAmount } from '../../lib/format.js';
import { formatShortDate } from '../../lib/date.js';
import { Trash2, MoreVertical } from 'lucide-react';

export default function TransactionRow({ tx, account, onDelete, onSkipRecurring }) {
  const cat = getCategory(tx.category);
  const sign = tx.type === 'gelir' ? '+' : '−';
  const tone = tx.type === 'gelir' ? 'var(--positive)' : 'var(--text-1)';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (tx.source === 'recurring') {
      setMenuOpen(true);
    } else {
      onDelete?.();
    }
  };

  return (
    <div className="row" style={{ position: 'relative' }}>
      <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: cat.color }}>
        <Icon name={cat.icon} size={18} />
      </div>
      <div className="row-main">
        <div className="row-title">
          {cat.label}
          {tx.source === 'recurring' && (
            <span className="badge badge-recurring" style={{ marginLeft: 6 }}>↻</span>
          )}
        </div>
        <div className="row-sub">
          {formatShortDate(tx.date)}
          {tx.note && <> · {tx.note}</>}
          {account && tx.currency !== 'TRY' && <> · {account.name}</>}
        </div>
      </div>
      <div className="row-amount" style={{ color: tone, textAlign: 'right' }}>
        <div>{sign}{fmtAmount(tx.amount, tx.currency).replace(/^[+−]/, '')}</div>
        {tx.currency !== 'TRY' && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>
            ≈ {sign}{fmtAmount(tx.amountTRY, 'TRY').replace(/^[+−]/, '')}
          </div>
        )}
      </div>
      <button
        type="button"
        className="btn-icon"
        onClick={tx.source === 'recurring' ? () => setMenuOpen(v => !v) : handleDelete}
        style={{ width: 32, height: 32, background: 'transparent', color: 'var(--text-muted)' }}
        aria-label={tx.source === 'recurring' ? 'Seçenekler' : 'Sil'}
      >
        {tx.source === 'recurring' ? <MoreVertical size={16} /> : <Trash2 size={16} />}
      </button>

      {menuOpen && tx.source === 'recurring' && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 30 }}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 40,
            background: 'var(--bg-elev-3)', borderRadius: 'var(--radius-md)',
            padding: 6, minWidth: 200, boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-soft)',
          }}>
            <button
              type="button"
              onClick={() => { onSkipRecurring?.(); setMenuOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: 10, borderRadius: 8, fontSize: 13 }}
            >Sadece bu ayı atla</button>
            <button
              type="button"
              onClick={() => { onDelete?.(); setMenuOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: 10, borderRadius: 8, fontSize: 13, color: 'var(--negative)' }}
            >Sadece bu işlemi sil</button>
          </div>
        </>
      )}
    </div>
  );
}
