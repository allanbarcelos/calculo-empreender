import { ChoiceGroup, Explainer, NumberField, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney, formatPercent } from '../../../lib/format.js';

export default function SalesStep({ data, set, result }) {
  const { businesses, formDefaults, operating, repositories } = useServices();
  const t = useFormText();
  const { business, place, input } = result;
  const revenue = business.revenue;
  const projection = repositories.reference.projection();

  return (
    <>
      <fieldset className="subsection">
        <legend>{t.section('sales')}</legend>
        <ChoiceGroup
          legend={t.field('scenario').label}
          hint={t.field('scenario').hint}
          name="scenario"
          value={data.scenario}
          onChange={(v) => set(formDefaults.scenarioPatch(data, v))}
          options={businesses.scenarios().map((s) => ({ value: s.id, label: s.label, description: t.text('scenario', 'option', { customers: revenue.customersPerDay[s.id], description: s.description }) }))}
        />
        <div className="grid-2">
          <NumberField {...t.field('ticket')} value={data.ticket} onChange={(v) => set({ ticket: v })} />
          <NumberField {...t.field('customersPerDay')} value={data.customersPerDay} onChange={(v) => set({ customersPerDay: v })} />
          <NumberField {...t.field('openDays')} value={data.openDays} max={31} onChange={(v) => set({ openDays: v })} />
          <NumberField {...t.field('rampUpMonths', { start: formatPercent(projection.rampStartShare) })} value={data.rampUpMonths} min={1} max={36} onChange={(v) => set({ rampUpMonths: Math.round(v) || 1 })} />
        </div>
        <p className="hint" aria-live="polite">{t.text('ticket', 'mature', { revenue: formatMoney(operating.matureRevenue(input)), yearly: formatMoney(operating.matureRevenue(input) * 12) })}</p>
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('variable')}</legend>
        <div className="grid-2">
          <NumberField {...t.field('cmvRate', { reference: formatPercent(revenue.cmvRate) })} value={data.cmvRate} max={100} onChange={(v) => set({ cmvRate: v })} />
          <NumberField {...t.field('cardShare')} value={data.cardShare} max={100} onChange={(v) => set({ cardShare: v })} />
          <NumberField {...t.field('cardFeeRate')} value={data.cardFeeRate} max={20} onChange={(v) => set({ cardFeeRate: v })} />
        </div>
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('fixed')}</legend>
        <div className="grid-2">
          <NumberField {...t.field('energyKwh', { tariff: formatMoney(place.energy.value), cost: formatMoney(data.energyKwh * place.energy.value) })} value={data.energyKwh} onChange={(v) => set({ energyKwh: v })} />
          <NumberField {...t.field('waterM3', { tariff: formatMoney(place.water.value), cost: formatMoney(data.waterM3 * place.water.value) })} value={data.waterM3} onChange={(v) => set({ waterM3: v })} />
          <NumberField {...t.field('consumables')} value={data.consumables} onChange={(v) => set({ consumables: v })} />
          <NumberField {...t.field('maintenance')} value={data.maintenance} onChange={(v) => set({ maintenance: v })} />
          <NumberField {...t.field('software')} value={data.software} onChange={(v) => set({ software: v })} />
          <NumberField {...t.field('marketing')} value={data.marketing} onChange={(v) => set({ marketing: v })} />
          <NumberField {...t.field('otherFixed')} value={data.otherFixed} onChange={(v) => set({ otherFixed: v })} />
          <NumberField {...t.field('workingCapitalMonths')} value={data.workingCapitalMonths} max={12} onChange={(v) => set({ workingCapitalMonths: v })} />
        </div>
        <p className="hint" aria-live="polite">{t.text('workingCapitalMonths', 'total', { fixed: formatMoney(result.fixedMonthly), reserve: formatMoney(result.investment.reserve) })}</p>
      </fieldset>
      <Explainer id="projection" vars={{ start: projection.rampStartShare, months: data.rampUpMonths }} />
      <SourcesInline sources={business.sources.map((id) => ({ id }))} />
    </>
  );
}
