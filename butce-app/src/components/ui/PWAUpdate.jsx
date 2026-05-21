import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download } from 'lucide-react';

export default function PWAUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(80px + var(--safe-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-elev-3)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-full)',
      padding: '8px 12px 8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 13,
      zIndex: 110,
      boxShadow: 'var(--shadow-md)',
      maxWidth: 'calc(var(--max-w) - 32px)',
    }}>
      <Download size={16} color="var(--accent)" />
      <span>Yeni sürüm hazır</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="btn-soft"
        style={{ height: 32, padding: '0 14px', borderRadius: 'var(--radius-full)', fontSize: 13 }}
      >
        Yenile
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{ color: 'var(--text-3)', padding: 4 }}
        aria-label="Kapat"
      >
        ✕
      </button>
    </div>
  );
}
