import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cycleByMonth } from '../../lib/cardCycle.js';
import { formatShortDate } from '../../lib/date.js';

export default function CycleSelector({ card, cycle, onChange }) {
  function shift(delta) {
    let m = cycle.monthIdx0 + delta;
    let y = cycle.year;
    while (m > 11) { m -= 12; y += 1; }
    while (m < 0) { m += 12; y -= 1; }
    onChange(cycleByMonth(card, y, m));
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
    }}>
      <button className="btn-icon" onClick={() => shift(-1)} aria-label="Önceki dönem">
        <ChevronLeft size={20} />
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 500 }}>{cycle.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {formatShortDate(cycle.start)} — {formatShortDate(cycle.end)}
        </div>
      </div>
      <button className="btn-icon" onClick={() => shift(1)} aria-label="Sonraki dönem">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
