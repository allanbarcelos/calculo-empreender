import { useLabels } from '../../hooks/useLabels.js';
import { formatMoney } from '../../lib/format.js';

export default function WorkSummary({ result, onReset }) {
  const { label } = useLabels();
  const { net, revenue, costs, taxes, netPerHour, comparison } = result;
  return (
    <aside className="card live-summary no-print" aria-labelledby="live-title">
      <h2 id="live-title" className="live-summary__title">{label('liveTitle')}</h2>
      <p className={`live-summary__value${net < 0 ? ' negative' : ''}`} aria-live="polite" aria-atomic="true">{formatMoney(net)}</p>
      <ul className="live-summary__list">
        <li><span>{label('liveRevenue')}</span><strong>{formatMoney(revenue)}</strong></li>
        <li><span>{label('liveCosts')}</span><strong>{formatMoney(costs + taxes.total)}</strong></li>
        <li><span>{label('livePerHour')}</span><strong className={netPerHour < 0 ? 'negative' : undefined}>{formatMoney(netPerHour)}</strong></li>
        <li><span>{label('liveEquivalent')}</span><strong>{formatMoney(comparison.equivalentSalary)}</strong></li>
      </ul>
      <p className="hint">{label('liveHint')}</p>
      {onReset && (
        <button
          type="button"
          className="btn btn--ghost live-summary__reset"
          onClick={() => {
            if (window.confirm(label('resetConfirm'))) onReset();
          }}
        >
          {label('resetButton')}
        </button>
      )}
    </aside>
  );
}
