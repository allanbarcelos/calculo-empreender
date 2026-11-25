import { ChoiceGroup, ContentCallout, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

export default function BusinessStep({ data, set, result }) {
  const { businesses, formDefaults } = useServices();
  const t = useFormText();
  const business = result.business;

  return (
    <>
      <ChoiceGroup
        {...t.field('businessId')}
        legend={t.field('businessId').label}
        name="businessId"
        value={data.businessId}
        onChange={(id) => set(formDefaults.businessPatch(data, id))}
        options={businesses.list().map((b) => ({
          value: b.id,
          label: b.label,
          description: t.text('businessId', 'option', { description: b.description, ticket: formatMoney(b.revenue.ticket) }),
        }))}
      />
      <ContentCallout id="businessProfile" vars={{
        label: business.label,
        area: business.areaM2,
        staff: business.staff.map((s) => `${s.count} ${s.role}`).join(', '),
        annex: business.tax.simplesAnnex,
        mei: business.tax.meiAllowed ? t.text('businessId', 'meiYes', { occupation: business.tax.meiOccupation }) : t.text('businessId', 'meiNo'),
        cnae: business.tax.cnae,
      }} />
      {business.notes && <p className="hint">{business.notes}</p>}
      <SourcesInline sources={business.sources.map((id) => ({ id }))} />
    </>
  );
}
