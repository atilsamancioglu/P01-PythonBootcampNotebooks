import { useEffect } from 'react';

export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`sheet-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-handle" onClick={onClose} />
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </>
  );
}
