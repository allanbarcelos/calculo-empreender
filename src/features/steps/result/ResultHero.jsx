import { useLabels } from '../../../hooks/useLabels.js';
import { formatMoney, formatPercent } from '../../../lib/format.js';

export default function ResultHero({ result }) {
  const { label } = useLabels();
  const { investment, mature, projection, place, business } = result;
  return (
    <section className="result-hero" aria-labelledby="total-label">
      <p id="total-label" className="result-hero__label">{label('heroLabel', { business: business.label, place: place.placeName })}</p>
      <p className="result-hero__value">{formatMoney(investment.total)}</p>
      <dl className="result-hero__facts">
        <div><dt>{label('heroSpent')}</dt><dd>{formatMoney(investment.spent)}</dd></div>
        <div><dt>{label('heroReserve')}</dt><dd>{formatMoney(investment.reserve)}</dd></div>
        <div><dt>{label('heroRevenue')}</dt><dd>{formatMoney(mature.revenue)}</dd></div>
        <div><dt>{label('heroProfit')}</dt><dd>{formatMoney(mature.profit)} ({formatPercent(result.matureMargin)})</dd></div>
        <div><dt>{label('heroBreakEven')}</dt><dd>{result.breakEvenRevenue === null ? '—' : formatMoney(result.breakEvenRevenue)}</dd></div>
        <div><dt>{label('heroPayback')}</dt><dd>{projection.payback ? label('months', { months: projection.payback }) : label('paybackNone')}</dd></div>
      </dl>
      <p className="result-hero__note">{label('heroNote', { month: mature.month })}</p>
    </section>
  );
}
