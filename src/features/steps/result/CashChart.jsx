import { useLabels } from '../../../hooks/useLabels.js';
import { formatMoney } from '../../../lib/format.js';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };

// Cash position month by month: profit accumulated minus what was spent to open. Below zero the
// investment has not been paid back yet. The numbers are in the table above.
export default function CashChart({ projection, investment }) {
  const { label } = useLabels();
  const points = projection.months.map((m) => m.position);
  const min = Math.min(0, ...points, -investment.spent);
  const max = Math.max(0, ...points);
  const span = max - min || 1;
  const x = (i) => PAD.left + (i / Math.max(1, points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v) => PAD.top + ((max - v) / span) * (H - PAD.top - PAD.bottom);
  const path = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = points.at(-1);
  const payback = projection.payback;

  return (
    <figure className="chart">
      <figcaption>{label('chartCaption')}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label('chartAria', { months: points.length, last: formatMoney(last), payback: payback ? label('months', { months: payback }) : label('paybackNone') })}>
        <line className="chart__zero" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        <path className="chart__line" d={path} fill="none" />
        {payback && <circle className="chart__mark" cx={x(payback - 1)} cy={y(points[payback - 1])} r="4" />}
        <text className="chart__label" x={PAD.left} y={H - 8}>{label('chartStart')}</text>
        <text className="chart__label" x={W - PAD.right} y={H - 8} textAnchor="end">{label('months', { months: points.length })}</text>
        <text className="chart__label" x={W - PAD.right} y={Math.max(PAD.top + 10, y(last) - 8)} textAnchor="end">{formatMoney(last)}</text>
        <text className="chart__label" x={PAD.left + 4} y={y(0) - 6}>{label('chartZero')}</text>
      </svg>
    </figure>
  );
}
