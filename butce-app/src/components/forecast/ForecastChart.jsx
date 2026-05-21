import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { fmtCompact, fmtTRY } from '../../lib/format.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-elev-3)',
      border: '1px solid var(--border-soft)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div className="numeric" style={{ color: 'var(--accent)' }}>{fmtTRY(p.cumulative)}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
        Net: <span className="numeric" style={{ color: p.net >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
          {fmtTRY(p.net, { signed: true })}
        </span>
      </div>
    </div>
  );
}

export default function ForecastChart({ series, initialWealth }) {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ top: 10, right: 5, bottom: 0, left: 5 }}>
          <defs>
            <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtCompact(v)}
            width={50}
          />
          <ReferenceLine y={initialWealth} stroke="var(--text-muted)" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#cumGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
