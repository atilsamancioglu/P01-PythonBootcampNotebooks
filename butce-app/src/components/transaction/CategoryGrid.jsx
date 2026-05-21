import Icon from '../ui/Icon.jsx';
import { categoriesFor } from '../../data/categories.js';

export default function CategoryGrid({ type, value, onChange }) {
  const cats = categoriesFor(type);
  return (
    <div className="cat-grid">
      {cats.map(c => {
        const sel = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            className={`cat-tile ${sel ? 'selected' : ''}`}
            onClick={() => onChange(c.id)}
          >
            <div className="cat-tile-icon" style={{ color: sel ? 'var(--accent)' : c.color }}>
              <Icon name={c.icon} size={22} />
            </div>
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
