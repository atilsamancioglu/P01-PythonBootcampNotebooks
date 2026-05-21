import Icon from '../ui/Icon.jsx';
import { getCategory } from '../../data/categories.js';
import { fmtTRY } from '../../lib/format.js';

export default function BudgetGoalRow({ goal, spent, onClick }) {
  const cat = getCategory(goal.category);
  const limit = goal.monthlyLimit || 0;
  const pct = limit > 0 ? Math.min(150, (spent / limit) * 100) : 0;
  const remaining = limit - spent;

  const tone = pct >= 100 ? 'var(--negative)' : pct >= 80 ? 'var(--warning)' : 'var(--positive)';

  return (
    <button
      type="button"
      onClick={onClick}
      className="card card-tight"
      style={{
        width: '100%',
        textAlign: 'left',
        marginBottom: 12,
        opacity: goal.active ? 1 : 0.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: cat.color }}>
          <Icon name={cat.icon} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{cat.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {pct >= 100
              ? <span style={{ color: 'var(--negative)' }}>Limit aşıldı</span>
              : <>Kalan <span className="numeric">{fmtTRY(Math.max(0, remaining))}</span></>
            }
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="numeric" style={{ fontWeight: 500, color: tone }}>
            {fmtTRY(spent)}
          </div>
          <div className="numeric" style={{ fontSize: 11, color: 'var(--text-3)' }}>
            / {fmtTRY(limit)}
          </div>
        </div>
      </div>

      <div style={{
        height: 8, background: 'var(--bg-elev-2)', borderRadius: 4, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, pct)}%`,
          background: tone,
          transition: 'width 240ms',
        }} />
        {pct > 100 && (
          <div style={{
            position: 'absolute', top: 0, right: 0, height: '100%',
            width: `${Math.min(50, pct - 100)}%`,
            background: 'repeating-linear-gradient(45deg, var(--negative) 0 4px, transparent 4px 8px)',
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
        <span>%{pct.toFixed(0)}</span>
        {!goal.active && <span>duraklatıldı</span>}
      </div>
    </button>
  );
}
