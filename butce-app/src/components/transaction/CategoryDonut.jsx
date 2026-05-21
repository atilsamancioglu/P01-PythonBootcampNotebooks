import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getCategory } from '../../data/categories.js';
import { fmtTRY } from '../../lib/format.js';

export default function CategoryDonut({ data, total }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty" style={{ padding: '20px 0' }}>
        <div style={{ fontSize: 13 }}>Bu ay gider yok</div>
      </div>
    );
  }

  const palette = data.map(d => getCategory(d.category).color);

  return (
    <div style={{ position: 'relative', width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={80}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => <Cell key={i} fill={palette[i]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Toplam gider</div>
        <div className="numeric" style={{ fontSize: 22, fontWeight: 500, marginTop: 2 }}>
          {fmtTRY(total)}
        </div>
      </div>
    </div>
  );
}
