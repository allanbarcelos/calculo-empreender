import { DataTable } from '../../../components/ui';
import { useLabels } from '../../../hooks/useLabels.js';
import { formatMoney } from '../../../lib/format.js';

export default function HorizonTable({ projection }) {
  const { label } = useLabels();
  const rows = projection.horizons.map((h) => ({
    id: h.months,
    period: label('months', { months: h.months }),
    revenue: formatMoney(h.revenue),
    costs: formatMoney(h.costs),
    profit: formatMoney(h.profit),
    average: formatMoney(h.averageProfit),
    position: formatMoney(h.position),
    negative: h.position < 0,
  }));
  return (
    <DataTable
      caption={label('horizonCaption')}
      columns={[
        { key: 'period', label: label('colPeriod'), rowHeader: true },
        { key: 'revenue', label: label('colRevenue'), numeric: true },
        { key: 'costs', label: label('colCosts'), numeric: true },
        { key: 'profit', label: label('colProfit'), numeric: true },
        { key: 'average', label: label('colAverage'), numeric: true },
        { key: 'position', label: label('colPosition'), numeric: true },
      ]}
      rows={rows}
      rowClassName={(r) => (r.negative ? 'is-negative' : undefined)}
    />
  );
}
