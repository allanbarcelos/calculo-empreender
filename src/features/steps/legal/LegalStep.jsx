import { ChoiceGroup, ContentCallout, Explainer, KindBadge, NumberField, Toggle } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useLabels } from '../../../hooks/useLabels.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

export default function LegalStep({ data, set, result }) {
  const { taxes, repositories } = useServices();
  const t = useFormText();
  const labels = useLabels();
  const { business, investment } = result;
  const mei = result.meiRules;
  const das = mei.das[business.tax.meiActivity] ?? mei.das.both;
  const accounting = repositories.reference.accounting();
  const formalization = investment.groups.find((g) => g.id === 'formalization');

  return (
    <>
      <ChoiceGroup
        legend={t.field('regime').label}
        hint={t.field('regime').hint}
        name="regime"
        value={data.regime}
        onChange={(regime) => set({ regime, digitalCertificate: regime === 'simples' })}
        options={[
          { value: 'mei', label: t.text('regime', 'optionMei'), description: t.text('regime', business.tax.meiAllowed ? 'descMei' : 'descMeiNotAllowed', { das: formatMoney(das), limit: formatMoney(mei.revenueLimit), maxEmployees: mei.maxEmployees, occupation: business.tax.meiOccupation ?? '' }) },
          { value: 'simples', label: t.text('regime', 'optionSimples'), description: t.text('regime', 'descSimples', { annex: business.tax.simplesAnnex }) },
        ]}
      />
      {data.regime === 'simples' && (
        <ChoiceGroup
          legend={t.field('companyType').label}
          hint={t.field('companyType').hint}
          name="companyType"
          value={data.companyType}
          onChange={(companyType) => set({ companyType })}
          options={[
            { value: 'individual', label: t.text('companyType', 'optionIndividual'), description: t.text('companyType', 'descIndividual') },
            { value: 'ltda', label: t.text('companyType', 'optionLtda'), description: t.text('companyType', 'descLtda') },
          ]}
        />
      )}
      <ContentCallout id={data.regime === 'mei' ? 'meiRules' : 'simplesRules'} vars={{ das, limit: mei.revenueLimit, maxEmployees: mei.maxEmployees, annex: Object.keys(taxes.annexMix(business)).join(' e ') }} />

      <Toggle {...t.field('digitalCertificate')} checked={data.digitalCertificate} onChange={(v) => set({ digitalCertificate: v })} />
      <Toggle {...t.field('trademark')} checked={data.trademark} onChange={(v) => set({ trademark: v })} />
      <Toggle {...t.field('openingService')} checked={data.openingService} onChange={(v) => set({ openingService: v })} />

      <Toggle
        {...t.field('accountingAuto', { value: formatMoney(accounting[data.regime]) })}
        checked={data.accountingAuto}
        onChange={(v) => set({ accountingAuto: v, accountingMonthly: v ? data.accountingMonthly : accounting[data.regime] })}
      />
      {!data.accountingAuto && <NumberField {...t.field('accountingMonthly')} value={data.accountingMonthly} onChange={(v) => set({ accountingMonthly: v })} />}

      <div className="table-scroll">
        <table className="breakdown">
          <caption>{t.text('regime', 'feesCaption')}</caption>
          <tbody>
            {formalization.items.map((i) => (
              <tr key={i.id}><th scope="row">{labels.item(i)} <KindBadge kind={i.kind} /></th><td className="num">{formatMoney(i.amount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">{t.text('regime', 'feesTotal')}</th><td className="num">{formatMoney(formalization.total)}</td></tr></tfoot>
        </table>
      </div>
      <Explainer id="legal" vars={{ das, limit: mei.revenueLimit }} />
    </>
  );
}
