import { KindBadge } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney } from '../../lib/format.js';
import { parseInput } from '../../lib/parseNumber.js';

// Tools, gear and courses: include or not, quantity and unit price. Items with a useful life
// are replaced over time; that replacement is a monthly cost.
export default function ItemsTable({ data, set, occupation }) {
  const { occupations } = useServices();
  const t = useFormText();
  const rows = occupations.items(occupation, data.items);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const update = (id, patch) => set({ items: { ...data.items, [id]: { ...data.items[id], ...patch } } });

  return (
    <div className="table-scroll">
      <table className="breakdown equipment">
        <caption>{t.text('items', 'caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t.text('items', 'colItem')}</th>
            <th scope="col" className="num">{t.text('items', 'colQty')}</th>
            <th scope="col" className="num">{t.text('items', 'colUnit')}</th>
            <th scope="col" className="num">{t.text('items', 'colTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.on ? undefined : 'is-off'}>
              <th scope="row">
                <label className="equipment__item">
                  <input type="checkbox" checked={r.on} onChange={(e) => update(r.id, { on: e.target.checked })} />
                  <span>
                    {r.label} <KindBadge kind={r.kind} />
                    {r.essential === false && <span className="hint-inline"> · {t.text('items', 'optional')}</span>}
                    {r.lifeYears && <span className="hint-inline"> · {t.text('items', 'life', { years: String(r.lifeYears).replace('.', ',') })}</span>}
                  </span>
                </label>
              </th>
              <td className="num">
                <input
                  className="input-small"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label={t.text('items', 'qtyAria', { item: r.label })}
                  value={r.qty}
                  onChange={(e) => update(r.id, { qty: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
              </td>
              <td className="num">
                <input
                  className="input-small input-money"
                  type="text"
                  inputMode="decimal"
                  aria-label={t.text('items', 'unitAria', { item: r.label })}
                  defaultValue={String(r.unitCost).replace('.', ',')}
                  key={`${occupation.id}-${r.id}-${r.unitCost}`}
                  onBlur={(e) => update(r.id, { unitCost: Math.max(0, parseInput(e.target.value)) })}
                />
              </td>
              <td className="num">{formatMoney(r.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row" colSpan={3}>{t.text('items', 'total')}</th><td className="num">{formatMoney(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}
