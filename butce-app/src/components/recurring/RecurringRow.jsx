import Icon from '../ui/Icon.jsx';
import { getCategory } from '../../data/categories.js';
import { fmtAmount } from '../../lib/format.js';
import { nextOccurrence, summarizeRule } from '../../lib/recurring.js';
import { formatShortDate, today } from '../../lib/date.js';

export default function RecurringRow({ rule, account, onClick }) {
  const cat = getCategory(rule.category);
  const sign = rule.type === 'gelir' ? '+' : '−';
  const tone = rule.type === 'gelir' ? 'var(--positive)' : 'var(--text-1)';
  const next = nextOccurrence(rule, today());

  return (
    <button type="button" className="row" onClick={onClick} style={{
      display: 'flex', textAlign: 'left', width: '100%', background: 'transparent',
      opacity: rule.active ? 1 : 0.5,
    }}>
      <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: cat.color }}>
        <Icon name={cat.icon} size={18} />
      </div>
      <div className="row-main">
        <div className="row-title">{rule.name}</div>
        <div className="row-sub">
          {summarizeRule(rule)}
          {account && <> · {account.name}</>}
          {next && rule.active && <> · sonraki {formatShortDate(next)}</>}
          {!rule.active && <> · duraklatıldı</>}
        </div>
      </div>
      <div className="row-amount" style={{ color: tone }}>
        {sign}{fmtAmount(rule.amount, rule.currency).replace(/^[+−]/, '')}
      </div>
    </button>
  );
}
