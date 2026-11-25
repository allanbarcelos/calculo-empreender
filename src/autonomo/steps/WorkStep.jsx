import { ChoiceGroup, Explainer, KindBadge, NumberField, SourcesInline, Toggle } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

export default function WorkStep({ data, set, result }) {
  const { occupations, formDefaults } = useServices();
  const t = useFormText();
  const { occupation, work } = result;
  const hourly = occupation.model === 'hourly';
  const w = occupation.work;
  const range = (r) => (typeof r === 'number' ? formatMoney(r) : `${formatMoney(r.low)} a ${formatMoney(r.high)}`);
  const unit = hourly ? 'hour' : 'job';

  return (
    <>
      <ChoiceGroup
        legend={t.field('scenario').label}
        hint={t.field('scenario').hint}
        name="scenario"
        value={data.scenario}
        onChange={(v) => set(formDefaults.scenarioPatch(data, v))}
        options={occupations.scenarios().map((s) => ({
          value: s.id,
          label: s.label,
          description: hourly
            ? t.text('scenario', 'optionHourly', { value: formatMoney(occupations.pick(w.earningsPerHour, s.id)), description: s.description })
            : t.text('scenario', 'optionJobs', { ticket: formatMoney(occupations.pick(w.ticket, s.id)), jobs: formatNumber(occupations.pick(w.jobsPerDay, s.id)), description: s.description }),
        }))}
      />

      <fieldset className="subsection">
        <legend>{t.section('earnings')}</legend>
        <div className="grid-2">
          {hourly ? (
            <NumberField {...t.field('earningsPerHour', { range: range(w.earningsPerHour) })} value={data.earningsPerHour} onChange={(v) => set({ earningsPerHour: v })} />
          ) : (
            <>
              <NumberField {...t.field('ticket', { range: range(w.ticket) })} value={data.ticket} onChange={(v) => set({ ticket: v })} />
              <NumberField {...t.field('jobsPerDay')} value={data.jobsPerDay} max={30} onChange={(v) => set({ jobsPerDay: v })} />
            </>
          )}
        </div>
        <p className="hint"><KindBadge kind={w.kind} /> {w.note}</p>
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('time')}</legend>
        <div className="grid-2">
          <NumberField {...t.field(hourly ? 'hoursPerDayHourly' : 'hoursPerDay')} value={data.hoursPerDay} max={24} onChange={(v) => set({ hoursPerDay: v })} />
          <NumberField {...t.field('daysPerMonth')} value={data.daysPerMonth} max={31} onChange={(v) => set({ daysPerMonth: v })} />
          <NumberField {...t.field('vacationDays')} value={data.vacationDays} max={365} onChange={(v) => set({ vacationDays: v })} />
          <NumberField {...t.field('idleDays')} value={data.idleDays} max={365} onChange={(v) => set({ idleDays: v })} />
          {data.vehicleType !== 'none' && data.vehicleType !== 'transit' && (
            <NumberField {...t.field(`kmPer_${unit}`)} value={data.kmPerUnit} max={500} onChange={(v) => set({ kmPerUnit: v })} />
          )}
        </div>
        <p className="hint" aria-live="polite">{t.text('daysPerMonth', 'summary', {
          days: formatNumber(Math.round(work.days * 10) / 10),
          hours: formatNumber(Math.round(work.hours)),
          revenue: formatMoney(work.revenue),
          yearly: formatMoney(work.revenue * 12),
          km: formatNumber(Math.round(work.km)),
        })}</p>
        {occupation.tax.domesticRisk && (
          <Toggle {...t.field('sameHomeOver2Days')} checked={data.sameHomeOver2Days} onChange={(v) => set({ sameHomeOver2Days: v })} />
        )}
      </fieldset>
      <Explainer id="work" />
      <SourcesInline sources={occupation.sources.map((id) => ({ id }))} />
    </>
  );
}
