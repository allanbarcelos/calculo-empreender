import { Explainer, NumberField, SourcesInline } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatPercent } from '../../lib/format.js';
import ItemsTable from './ItemsTable.jsx';

export default function CostsStep({ data, set, result }) {
  const { repositories } = useServices();
  const t = useFormText();
  const { occupation, investment } = result;
  const costs = occupation.costs;
  const phone = repositories.workReference.phone();

  return (
    <>
      <fieldset className="subsection">
        <legend>{t.section('items')}</legend>
        <ItemsTable data={data} set={set} occupation={occupation} />
        <p className="hint" aria-live="polite">{t.text('items', 'investment', { total: formatMoney(investment.total) })}</p>
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('monthly')}</legend>
        <div className="grid-2">
          <NumberField {...t.field('materialsPct', { reference: formatPercent(costs.materialsRate) })} value={data.materialsPct} max={90} onChange={(v) => set({ materialsPct: v })} />
          <NumberField {...t.field('platformFeePct', { reference: formatPercent(costs.platformFeeRate) })} value={data.platformFeePct} max={90} onChange={(v) => set({ platformFeePct: v })} />
          <NumberField {...t.field('leadCostMonthly')} value={data.leadCostMonthly} onChange={(v) => set({ leadCostMonthly: v })} />
          <NumberField {...t.field('phoneMonthly', { reference: formatMoney(phone.monthly) })} value={data.phoneMonthly} onChange={(v) => set({ phoneMonthly: v })} />
          <NumberField {...t.field('otherMonthly')} value={data.otherMonthly} onChange={(v) => set({ otherMonthly: v })} />
          <NumberField {...t.field('otherInitial')} value={data.otherInitial} onChange={(v) => set({ otherInitial: v })} />
        </div>
        {costs.note && <p className="hint">{costs.note}</p>}
      </fieldset>
      <Explainer id="costs" />
      <SourcesInline sources={[...new Set([costs.source, phone.source].filter(Boolean))].map((id) => ({ id }))} />
    </>
  );
}
