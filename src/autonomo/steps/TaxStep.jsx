import { ChoiceGroup, ContentCallout, Explainer, KindBadge, NumberField } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useLabels } from '../../hooks/useLabels.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatPercent } from '../../lib/format.js';

export default function TaxStep({ data, set, result }) {
  const { repositories, taxes: taxService } = useServices();
  const t = useFormText();
  const labels = useLabels();
  const { occupation, meiRules, taxes, yearlyRevenue } = result;
  const inssRules = repositories.workReference.inssIndividual();
  const minimumWage = repositories.reference.minimumWage();
  const das = taxService.meiDas(occupation);
  const minimumBase = taxService.minimumBase(occupation, result.revenue);
  const presumption = repositories.workReference.meiProfit().presumption[occupation.tax.meiPresumption];
  const share = repositories.workReference.incomeTax().taxableShare[occupation.tax.incomeTaxBase];

  return (
    <>
      <ChoiceGroup
        legend={t.field('regime').label}
        hint={t.field('regime').hint}
        name="regime"
        value={data.regime}
        onChange={(regime) => set({ regime })}
        options={[
          {
            value: 'mei',
            label: t.text('regime', 'optionMei'),
            description: t.text('regime', occupation.tax.meiAllowed ? 'descMei' : 'descMeiNotAllowed', { das: formatMoney(das), limit: formatMoney(meiRules.next.revenueLimit), occupation: occupation.tax.meiOccupation ?? '' }),
          },
          { value: 'individual', label: t.text('regime', 'optionIndividual'), description: t.text('regime', 'descIndividual') },
        ]}
      />

      {data.regime === 'mei' ? (
        <ContentCallout id="meiRules" vars={{ das, limit: meiRules.next.revenueLimit, year: meiRules.next.validFrom.slice(0, 4), revenue: yearlyRevenue, presumption, cnae: occupation.tax.cnae, occupation: occupation.tax.meiOccupation }} />
      ) : (
        <>
          <ChoiceGroup
            legend={t.field('inssPlan').label}
            hint={t.field('inssPlan').hint}
            name="inssPlan"
            value={data.inssPlan}
            onChange={(inssPlan) => set({ inssPlan })}
            options={[
              { value: 'simplified', label: t.text('inssPlan', 'optionSimplified'), description: t.text('inssPlan', 'descSimplified', { amount: formatMoney(inssRules.simplifiedRate * minimumWage) }) },
              { value: 'full', label: t.text('inssPlan', 'optionFull'), description: t.text('inssPlan', 'descFull', { ceiling: formatMoney(inssRules.ceiling) }) },
            ]}
          />
          <div className="grid-2">
            {data.inssPlan === 'full' && <NumberField {...t.field(occupation.tax.inssGrossShare ? 'inssBaseDriver' : 'inssBase', { minimum: formatMoney(minimumBase) })} value={data.inssBase} onChange={(v) => set({ inssBase: v })} />}
            <NumberField {...t.field('issMonthly')} value={data.issMonthly} onChange={(v) => set({ issMonthly: v })} />
          </div>
          <ContentCallout id={`incomeTax_${occupation.tax.incomeTaxBase}`} vars={{ share }} />
        </>
      )}

      <div className="table-scroll">
        <table className="breakdown">
          <caption>{t.text('regime', 'caption')}</caption>
          <tbody>
            {taxes.items.map((i) => (
              <tr key={i.id}><th scope="row">{labels.item(i)} <KindBadge kind={i.kind} /></th><td className="num">{formatMoney(i.amount)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">{t.text('regime', 'total')}</th><td className="num">{formatMoney(taxes.total)}</td></tr></tfoot>
        </table>
      </div>
      <p className="hint">{t.text('regime', 'yearly', { revenue: formatMoney(yearlyRevenue), rate: formatPercent(yearlyRevenue > 0 ? (taxes.total * 12) / yearlyRevenue : 0) })}</p>
      <ContentCallout id="benefits" />
      <Explainer id="taxes" />
    </>
  );
}
