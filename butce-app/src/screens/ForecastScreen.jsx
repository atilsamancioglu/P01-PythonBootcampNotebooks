import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import ForecastChart from '../components/forecast/ForecastChart.jsx';
import { projectMonthlyPosition } from '../lib/forecast.js';
import { fmtTRY } from '../lib/format.js';
import { today } from '../lib/date.js';

const RANGES = [
  { id: 3, label: '3 Ay' },
  { id: 6, label: '6 Ay' },
  { id: 12, label: '12 Ay' },
];

export default function ForecastScreen({ data }) {
  const { accounts, transactions, recurring, planned, fx } = data;
  const [range, setRange] = useState(6);
  const [expanded, setExpanded] = useState(null);

  const projection = useMemo(
    () => projectMonthlyPosition({
      startDate: today().slice(0, 7) + '-01',
      monthsAhead: range,
      accounts,
      transactions,
      recurring,
      planned,
      fxRates: fx,
    }),
    [range, accounts, transactions, recurring, planned, fx]
  );

  const series = projection.series;
  const endingPosition = series[series.length - 1]?.cumulative ?? projection.initialWealth;
  const delta = endingPosition - projection.initialWealth;

  const peakMonth = series.reduce((acc, m) => m.cumulative > (acc?.cumulative ?? -Infinity) ? m : acc, null);
  const troughMonth = series.reduce((acc, m) => m.cumulative < (acc?.cumulative ?? Infinity) ? m : acc, null);

  return (
    <div>
      <div className="topbar">
        <h1>Projeksiyon</h1>
      </div>

      <div className="screen" style={{ paddingTop: 0 }}>
        <div className="segmented" style={{ marginBottom: 16 }}>
          {RANGES.map(r => (
            <button
              key={r.id} type="button"
              className={`segmented-item ${range === r.id ? 'active' : ''}`}
              onClick={() => setRange(r.id)}
            >{r.label}</button>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="hero-balance" style={{ padding: '12px 0' }}>
            <div className="hero-label">Dönem Sonu Beklenen</div>
            <div className="hero-value" style={{
              color: endingPosition >= projection.initialWealth ? 'var(--text-1)' : 'var(--negative)',
            }}>
              {fmtTRY(endingPosition)}
            </div>
            <div className="hero-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {delta >= 0 ? <TrendingUp size={14} color="var(--positive)" /> : <TrendingDown size={14} color="var(--negative)" />}
              <span className="numeric" style={{ color: delta >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {fmtTRY(delta, { signed: true })}
              </span>
              <span style={{ color: 'var(--text-3)' }}>· {range} ayda</span>
            </div>
          </div>
          <ForecastChart series={series} initialWealth={projection.initialWealth} />
        </div>

        {peakMonth && troughMonth && (
          <div className="stats-row" style={{ marginBottom: 16 }}>
            <div className="stat-tile">
              <div className="stat-label" style={{ color: 'var(--positive)' }}>En Yüksek</div>
              <div className="stat-value">{fmtTRY(peakMonth.cumulative)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{peakMonth.label}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label" style={{ color: 'var(--negative)' }}>En Düşük</div>
              <div className="stat-value">{fmtTRY(troughMonth.cumulative)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{troughMonth.label}</div>
            </div>
          </div>
        )}

        <div className="section-header"><h2>Ay Bazında</h2></div>

        <div className="card card-tight">
          {series.map(m => (
            <div key={m.key}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === m.key ? null : m.key)}
                className="row"
                style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
              >
                <div className="row-main">
                  <div className="row-title">{m.label}</div>
                  <div className="row-sub">
                    <span style={{ color: 'var(--positive)' }}>+{fmtTRY(m.income).replace('₺', '₺')}</span>
                    {' · '}
                    <span style={{ color: 'var(--negative)' }}>−{fmtTRY(m.expense).replace('−', '').replace('₺', '₺')}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="row-amount" style={{ color: m.net >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {fmtTRY(m.net, { signed: true })}
                  </div>
                  <div className="numeric" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    Σ {fmtTRY(m.cumulative)}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Projeksiyon: aktif recurring kuralları + planlı kart hareketleri.<br />
          Manuel işlemler ileri tarih için varsayılmaz.
        </div>
      </div>
    </div>
  );
}
