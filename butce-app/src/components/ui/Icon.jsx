import * as L from 'lucide-react';

export default function Icon({ name, size = 18, color, strokeWidth = 2, className }) {
  const Cmp = L[name] || L.Circle;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} className={className} />;
}
