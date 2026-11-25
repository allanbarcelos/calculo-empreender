import { ChoiceGroup, ContentCallout, SelectField, SourcesInline } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';

export default function OccupationStep({ data, set, result }) {
  const { occupations, formDefaults, repositories } = useServices();
  const t = useFormText();
  const { occupation } = result;
  const tax = occupation.tax;

  return (
    <>
      <ChoiceGroup
        legend={t.field('occupationId').label}
        hint={t.field('occupationId').hint}
        name="occupationId"
        value={data.occupationId}
        onChange={(id) => set(formDefaults.occupationPatch(data, id))}
        options={occupations.list().map((o) => ({ value: o.id, label: o.label, description: o.description }))}
      />
      <SelectField
        {...t.field('uf')}
        value={data.uf}
        onChange={(uf) => set({ uf })}
        options={repositories.locations.states().map((s) => ({ value: s.uf, label: `${s.name} (${s.uf})` }))}
      />
      <ContentCallout id="occupationProfile" vars={{
        label: occupation.label,
        mei: tax.meiAllowed ? t.text('occupationId', 'meiYes', { occupation: tax.meiOccupation, cnae: tax.cnae }) : t.text('occupationId', 'meiNo'),
        vehicle: t.text('vehicleType', `option_${occupation.vehicle.type}`),
      }} />
      {occupation.callouts?.map((id) => <ContentCallout key={id} id={id} />)}
      {occupation.notes && <p className="hint">{occupation.notes}</p>}
      <SourcesInline sources={occupation.sources.map((id) => ({ id }))} />
    </>
  );
}
