import { ContentCallout } from '../../../components/ui';
import { useLabels } from '../../../hooks/useLabels.js';
import { formatMoney } from '../../../lib/format.js';
import CashChart from './CashChart.jsx';
import GroupTable from './GroupTable.jsx';
import HorizonTable from './HorizonTable.jsx';
import ResultHero from './ResultHero.jsx';

export default function ResultStep({ result }) {
  const { label } = useLabels();
  const { investment, mature, projection, warnings } = result;
  const monthGroups = [
    { id: 'variable', items: mature.variable.filter((i) => i.amount > 0.004), total: mature.variableTotal },
    { id: 'fixed', items: mature.fixed.filter((i) => i.amount > 0.004), total: mature.fixedTotal },
  ];

  return (
    <div className="result">
      <ResultHero result={result} />
      {warnings.map((w) => <ContentCallout key={w.id} id={`warning_${w.id}`} vars={w.vars} />)}

      <h3>{label('investmentTitle')}</h3>
      <GroupTable caption={label('investmentCaption')} groups={investment.groups} total={investment.total} totalLabel={label('investmentTotal')} />

      <h3>{label('monthTitle', { month: mature.month })}</h3>
      <GroupTable
        caption={label('monthCaption', { month: mature.month })}
        groups={monthGroups}
        total={mature.profit}
        totalLabel={label('monthProfit')}
        extraRows={(
          <>
            <tr><th scope="row">{label('monthRevenue')}</th><td className="num">{formatMoney(mature.revenue)}</td></tr>
            <tr><th scope="row">{label('monthCosts')}</th><td className="num">{formatMoney(mature.costs)}</td></tr>
          </>
        )}
      />

      <h3>{label('projectionTitle')}</h3>
      <HorizonTable projection={projection} />
      <CashChart projection={projection} investment={investment} />

      <ContentCallout id="dataQuality" />
      <ContentCallout id="beforeOpening" />
      <div className="actions no-print">
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>{label('printButton')}</button>
      </div>
    </div>
  );
}
