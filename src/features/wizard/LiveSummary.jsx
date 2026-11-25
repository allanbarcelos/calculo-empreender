import { useLabels } from '../../hooks/useLabels.js';
import { formatMoney } from '../../lib/format.js';

export default function LiveSummary({ result, onReset }) {
  const { label } = useLabels();
  const { investment, mature, projection } = result;
  return (
    <aside className="card live-summary no-print" aria-labelledby="live-title">
      <h2 id="live-title" className="live-summary__title">{label('liveTitle')}</h2>
      <p className="live-summary__value" aria-live="polite" aria-atomic="true">{formatMoney(investment.total)}</p>
      <ul className="live-summary__list">
        <li><span>{label('liveMonthlyRevenue')}</span><strong>{formatMoney(mature.revenue)}</strong></li>
        <li><span>{label('liveMonthlyCosts')}</span><strong>{formatMoney(mature.costs)}</strong></li>
        <li><span>{label('liveMonthlyProfit')}</span><strong className={mature.profit < 0 ? 'negative' : undefined}>{formatMoney(mature.profit)}</strong></li>
        <li><span>{label('livePayback')}</span><strong>{projection.payback ? label('months', { months: projection.payback }) : label('paybackNone')}</strong></li>
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
