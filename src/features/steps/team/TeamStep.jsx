import { ContentCallout, NumberField } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';

// Payroll comes from the companion calculator (Cálculo CLT). Until the user types it, a rough
// estimate (minimum wage × factor per employee) keeps the projection realistic.
export default function TeamStep({ data, set, result }) {
  const { repositories, calculator } = useServices();
  const t = useFormText();
  const { business, input } = result;
  const payroll = repositories.reference.payrollReference();
  const estimate = calculator.payrollEstimate(data.employees);
  const vars = { estimate: formatMoney(estimate), factor: String(payroll.roughFactor).replace('.', ','), employees: data.employees };

  return (
    <>
      <ContentCallout id="teamSuggestion" vars={{ staff: business.staff.map((s) => `${s.count} × ${s.role}`).join(', ') }} />
      <NumberField {...t.field('employees')} value={data.employees} max={50} onChange={(v) => set({ employees: Math.round(v) })} />
      <div className="callout callout--info">
        <p className="callout__title">{t.text('payrollMonthly', 'linkTitle')}</p>
        <p>{t.text('payrollMonthly', 'linkText')}</p>
        <p><a className="btn btn--primary" href={payroll.calculatorUrl} target="_blank" rel="noreferrer">{t.text('payrollMonthly', 'linkButton')}</a></p>
      </div>
      <NumberField {...t.field('payrollMonthly')} value={input.payrollMonthly} onChange={(v) => set({ payrollMonthly: v, payrollAuto: false })} />
      <p className="hint" aria-live="polite">
        {data.payrollAuto ? t.text('payrollMonthly', 'auto', vars) : (
          <button type="button" className="btn-link" onClick={() => set({ payrollAuto: true })}>{t.text('payrollMonthly', 'useEstimate', vars)}</button>
        )}
      </p>
      <NumberField {...t.field('proLabore')} value={data.proLabore} onChange={(v) => set({ proLabore: v })} />
    </>
  );
}
