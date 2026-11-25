import { ContentCallout, DataTable } from '../../components/ui';
import { useLabels } from '../../hooks/useLabels.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatNumber, formatPercent } from '../../lib/format.js';
import GroupTable from '../../features/steps/result/GroupTable.jsx';

export default function WorkResultStep({ result }) {
  const { label } = useLabels();
  const { repositories } = useServices();
  const { occupation, work, revenue, groups, costs, taxes, net, netPerHour, breakEvenDaily, investment, paybackMonths, comparison, vehicle, warnings } = result;
  const { clt, autonomous } = comparison;
  const hours = (h) => `${formatNumber(Math.round(h))} h`;

  return (
    <div className="result">
      <section className="result-hero" aria-labelledby="total-label">
        <p id="total-label" className="result-hero__label">{label('heroLabel', { occupation: occupation.label, place: repositories.locations.state(result.input.uf)?.name ?? result.input.uf })}</p>
        <p className="result-hero__value">{formatMoney(net)}</p>
        <dl className="result-hero__facts">
          <div><dt>{label('heroPerHour')}</dt><dd>{formatMoney(netPerHour)}</dd></div>
          <div><dt>{label('heroRevenue')}</dt><dd>{formatMoney(revenue)}</dd></div>
          <div><dt>{label('heroCosts')}</dt><dd>{formatMoney(costs + taxes.total)} ({formatPercent(revenue > 0 ? (costs + taxes.total) / revenue : 0)})</dd></div>
          <div><dt>{label('heroEquivalent')}</dt><dd>{formatMoney(comparison.equivalentSalary)}</dd></div>
          <div><dt>{label('heroBreakEven')}</dt><dd>{breakEvenDaily === null ? '—' : formatMoney(breakEvenDaily)}</dd></div>
          <div><dt>{label('heroPerKm')}</dt><dd>{vehicle.perKm === null ? '—' : formatMoney(vehicle.perKm)}</dd></div>
        </dl>
        <p className="result-hero__note">{label('heroNote', { days: formatNumber(Math.round(work.days * 10) / 10), hours: formatNumber(Math.round(work.hours)) })}</p>
      </section>
      {warnings.map((w) => <ContentCallout key={w.id} id={`warning_${w.id}`} vars={w.vars} />)}

      <h3>{label('monthTitle')}</h3>
      <GroupTable
        caption={label('monthCaption')}
        groups={groups}
        total={net}
        totalLabel={label('monthNet')}
        extraRows={<tr><th scope="row">{label('monthRevenue')}</th><td className="num">{formatMoney(revenue)}</td></tr>}
      />

      <h3>{label('compareTitle')}</h3>
      <DataTable
        caption={label('compareCaption', { salary: formatMoney(clt.salary), role: occupation.clt.role })}
        columns={[
          { key: 'item', label: label('colItem'), rowHeader: true },
          { key: 'autonomous', label: label('colAutonomous'), numeric: true },
          { key: 'clt', label: label('colClt'), numeric: true },
        ]}
        rows={[
          { id: 'monthly', item: label('rowMonthly'), autonomous: formatMoney(autonomous.monthly), clt: formatMoney(clt.monthly) },
          { id: 'yearly', item: label('rowYearly'), autonomous: formatMoney(autonomous.yearly), clt: formatMoney(clt.total) },
          { id: 'fgts', item: label('rowFgts'), autonomous: formatMoney(0), clt: formatMoney(clt.fgts) },
          { id: 'hours', item: label('rowHours'), autonomous: hours(autonomous.hoursPerYear), clt: hours(clt.hoursPerYear) },
          { id: 'hourly', item: label('rowHourly'), autonomous: formatMoney(autonomous.hourly), clt: formatMoney(clt.hourly) },
          { id: 'rights', item: label('rowRights'), autonomous: label('rightsAutonomous'), clt: label('rightsClt') },
        ]}
      />
      <ContentCallout id={comparison.difference >= 0 ? 'compareAhead' : 'compareBehind'} vars={{ difference: Math.abs(comparison.difference), salary: comparison.equivalentSalary }} />

      <h3>{label('investmentTitle')}</h3>
      {investment.items.length > 0 ? (
        <GroupTable
          caption={label('investmentCaption')}
          groups={[{ id: 'start', items: investment.items, total: investment.total }]}
          total={investment.total}
          totalLabel={label('investmentTotal')}
        />
      ) : <p>{label('investmentNone')}</p>}
      <p className="hint">{paybackMonths ? label(paybackMonths === 1 ? 'paybackOne' : 'payback', { months: paybackMonths }) : label('paybackNone')}</p>

      <ContentCallout id="dataQuality" />
      <ContentCallout id="beforeStarting" />
      <div className="actions no-print">
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>{label('printButton')}</button>
      </div>
    </div>
  );
}
