import { ContentCallout, Explainer, KindBadge, NumberField, SourcesInline } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

export default function CltStep({ data, set, result }) {
  const { repositories } = useServices();
  const t = useFormText();
  const { occupation, comparison } = result;
  const { clt } = comparison;
  const url = repositories.workReference.clt().calculatorUrl;
  const rows = [
    ['monthlyNet', clt.monthlyNet],
    ['cash', clt.cash],
    ['fgts', clt.fgts],
    ['total', clt.total],
    ['monthly', clt.monthly],
  ];

  return (
    <>
      <ContentCallout id="cltIntro" />
      <NumberField {...t.field('cltSalary', { role: occupation.clt.role, reference: formatMoney(occupation.clt.salary) })} value={data.cltSalary} onChange={(v) => set({ cltSalary: v })} />
      <p className="hint"><KindBadge kind={occupation.clt.kind} /> {occupation.clt.note}</p>

      <div className="table-scroll">
        <table className="breakdown">
          <caption>{t.text('cltSalary', 'caption')}</caption>
          <tbody>
            {rows.map(([id, value]) => (
              <tr key={id} className={id === 'total' ? 'breakdown__group' : undefined}><th scope="row">{t.text('cltSalary', `row_${id}`)}</th><td className="num">{formatMoney(value)}</td></tr>
            ))}
            <tr><th scope="row">{t.text('cltSalary', 'row_hours')}</th><td className="num">{formatNumber(Math.round(clt.hoursPerYear))} h</td></tr>
            <tr><th scope="row">{t.text('cltSalary', 'row_hourly')}</th><td className="num">{formatMoney(clt.hourly)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="callout callout--info">
        <p className="callout__title">{t.text('cltSalary', 'linkTitle')}</p>
        <p>{t.text('cltSalary', 'linkText')}</p>
        <p><a className="btn btn--primary" href={url} target="_blank" rel="noreferrer">{t.text('cltSalary', 'linkButton')}</a></p>
      </div>
      <Explainer id="clt" />
      <SourcesInline sources={[occupation.clt.source, 'inssTableAuto', 'irpfTable'].filter(Boolean).map((id) => ({ id }))} />
    </>
  );
}
