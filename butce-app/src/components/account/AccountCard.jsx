import Icon from '../ui/Icon.jsx';
import { fmtAmount, fmtTRY, CURRENCY_SYMBOLS } from '../../lib/format.js';
import { calculateNativeBalance, calculateTRYBalance, calculateCardDebt } from '../../lib/balance.js';

const TYPE_LABEL = {
  nakit: 'Nakit',
  banka: 'Banka',
  kredi_karti: 'Kredi Kartı',
};

const TYPE_ICON = {
  nakit: 'Wallet',
  banka: 'Landmark',
  kredi_karti: 'CreditCard',
};

export default function AccountCard({ account, transactions, planned, fxRates, onClick }) {
  const isCard = account.type === 'kredi_karti';
  const native = calculateNativeBalance(account, transactions, planned);
  const tryBal = calculateTRYBalance(account, transactions, planned, fxRates);

  let limitPct = null;
  if (isCard && account.creditLimit > 0) {
    const debt = calculateCardDebt(account, transactions, planned, fxRates).native;
    limitPct = Math.min(100, (debt / account.creditLimit) * 100);
  }

  return (
    <button
      type="button"
      className="card card-tight"
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        display: 'block',
        borderLeft: `3px solid ${account.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="row-icon" style={{ background: 'var(--bg-elev-2)', color: account.color }}>
          <Icon name={TYPE_ICON[account.type]} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{account.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {TYPE_LABEL[account.type]} · {account.currency}
          </div>
        </div>
      </div>

      <div className="numeric" style={{
        fontSize: 22,
        fontWeight: 500,
        color: native < 0 ? 'var(--negative)' : 'var(--text-1)',
      }}>
        {isCard
          ? `-${fmtAmount(Math.max(0, -native), account.currency)}`
          : fmtAmount(native, account.currency)
        }
      </div>
      {account.currency !== 'TRY' && tryBal != null && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          ≈ {isCard
            ? `-${fmtTRY(Math.max(0, -tryBal))}`
            : fmtTRY(tryBal)
          }
        </div>
      )}

      {isCard && account.creditLimit > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            height: 6, background: 'var(--bg-elev-2)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${limitPct}%`,
              background: limitPct > 85 ? 'var(--negative)' : limitPct > 60 ? 'var(--warning)' : 'var(--accent)',
              transition: 'width 200ms',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            <span>Kullanılan {limitPct.toFixed(0)}%</span>
            <span className="numeric">{CURRENCY_SYMBOLS[account.currency]}{account.creditLimit.toLocaleString('tr-TR')} limit</span>
          </div>
        </div>
      )}
    </button>
  );
}
