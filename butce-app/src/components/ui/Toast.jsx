import { createContext, useCallback, useContext, useRef, useState } from 'react';

const Ctx = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((text) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(text);
    timerRef.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className={`toast ${msg ? 'open' : ''}`} role="status">{msg}</div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
