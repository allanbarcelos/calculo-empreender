import { useServices } from '../../../hooks/useServices.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { formatMoney } from '../../../lib/format.js';
import { parseInput } from '../../../lib/parseNumber.js';

// Equipment and furniture of the business: include or not, quantity and unit price.
export default function EquipmentTable({ data, set, business }) {
  const { businesses } = useServices();
  const t = useFormText();
  const rows = businesses.equipment(business, data.equipment);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const update = (id, patch) => set({ equipment: { ...data.equipment, [id]: { ...data.equipment[id], ...patch } } });

  return (
    <div className="table-scroll">
      <table className="breakdown equipment">
        <caption>{t.text('equipment', 'caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t.text('equipment', 'colItem')}</th>
            <th scope="col" className="num">{t.text('equipment', 'colQty')}</th>
            <th scope="col" className="num">{t.text('equipment', 'colUnit')}</th>
            <th scope="col" className="num">{t.text('equipment', 'colTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.on ? undefined : 'is-off'}>
              <th scope="row">
                <label className="equipment__item">
                  <input type="checkbox" checked={r.on} onChange={(e) => update(r.id, { on: e.target.checked })} />
                  <span>{r.label}{!r.essential && <span className="hint-inline"> · {t.text('equipment', 'optional')}</span>}</span>
                </label>
              </th>
              <td className="num">
                <input
                  className="input-small"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label={t.text('equipment', 'qtyAria', { item: r.label })}
                  value={r.qty}
                  onChange={(e) => update(r.id, { qty: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
              </td>
              <td className="num">
                <input
                  className="input-small input-money"
                  type="text"
                  inputMode="decimal"
                  aria-label={t.text('equipment', 'unitAria', { item: r.label })}
                  defaultValue={String(r.unitCost).replace('.', ',')}
                  key={`${business.id}-${r.id}-${r.unitCost}`}
                  onBlur={(e) => update(r.id, { unitCost: Math.max(0, parseInput(e.target.value)) })}
                />
              </td>
              <td className="num">{formatMoney(r.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row" colSpan={3}>{t.text('equipment', 'total')}</th><td className="num">{formatMoney(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}
