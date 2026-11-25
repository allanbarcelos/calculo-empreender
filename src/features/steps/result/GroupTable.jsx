import { KindBadge } from '../../../components/ui';
import { useLabels } from '../../../hooks/useLabels.js';
import { formatMoney } from '../../../lib/format.js';

// Table of grouped items (investment or a month's costs), with subtotals and a total.
export default function GroupTable({ caption, groups, total, totalLabel, extraRows }) {
  const labels = useLabels();
  return (
    <div className="table-scroll">
      <table className="breakdown">
        <caption>{caption}</caption>
        {groups.filter((g) => g.items.length > 0).map((g) => (
          <tbody key={g.id}>
            <tr className="breakdown__group"><th scope="rowgroup" colSpan={1}>{labels.group(g.id)}</th><td className="num">{formatMoney(g.total)}</td></tr>
            {g.items.map((i) => (
              <tr key={i.id}><th scope="row" className="breakdown__item">{labels.item(i)} <KindBadge kind={i.kind} /></th><td className="num">{formatMoney(i.amount)}</td></tr>
            ))}
          </tbody>
        ))}
        <tfoot>
          {extraRows}
          <tr className="breakdown__total"><th scope="row">{totalLabel}</th><td className="num">{formatMoney(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}
