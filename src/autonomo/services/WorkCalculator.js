// Orchestrates one simulation of autonomous work: an average month of revenue, costs and taxes,
// the money needed to start, and the comparison with a CLT job.
import { MOTOR_VEHICLES } from './OccupationService.js';

export class WorkCalculator {
  constructor({ occupationService, workloadService, vehicleService, workCostService, workTaxService, cltComparisonService, workReferenceRepository, referenceRepository }) {
    this.occupations = occupationService;
    this.workload = workloadService;
    this.vehicles = vehicleService;
    this.workCosts = workCostService;
    this.taxes = workTaxService;
    this.clt = cltComparisonService;
    this.reference = workReferenceRepository;
    this.national = referenceRepository;
  }

  // MEI rules of the next year, when a worker formalizing now has the first full year.
  meiRules() {
    const nextYear = `${Number(this.national.referenceDate.slice(0, 4)) + 1}-01-01`;
    return { ...this.national.mei(), next: this.national.meiOn(nextYear) };
  }

  warnings(input, occupation, r) {
    const list = [];
    const minimumHourly = this.national.minimumWage() / 220;
    if (input.regime === 'mei' && !occupation.tax.meiAllowed) list.push({ id: 'meiNotAllowed' });
    if (input.regime === 'mei') {
      const limit = r.meiRules.next.revenueLimit;
      if (r.yearlyRevenue > limit * 1.2) list.push({ id: 'meiLimitOver', vars: { revenue: r.yearlyRevenue, limit } });
      else if (r.yearlyRevenue > limit) list.push({ id: 'meiLimit', vars: { revenue: r.yearlyRevenue, limit, excess: r.yearlyRevenue - limit } });
    }
    if (occupation.tax.domesticRisk && input.sameHomeOver2Days) list.push({ id: 'domestic' });
    if (r.net < 0) list.push({ id: 'negative' });
    else if (r.netPerHour < minimumHourly) list.push({ id: 'belowMinimum', vars: { hourly: r.netPerHour, minimum: minimumHourly } });
    if (input.hoursPerDay * input.daysPerMonth > 260) list.push({ id: 'longHours', vars: { hours: Math.round(input.hoursPerDay * input.daysPerMonth) } });
    if (MOTOR_VEHICLES.includes(input.vehicleType) && input.vehicleOwnership !== 'rented') list.push({ id: 'ownVehicle', vars: { value: input.vehicleValue } });
    return list;
  }

  calculate(input) {
    const occupation = this.occupations.get(input.occupationId);
    const work = this.workload.month(input, occupation);
    const vehicle = this.vehicles.costs(input, work);
    const workCosts = this.workCosts.costs(input, occupation, work);
    const costs = vehicle.total + workCosts.total;
    const taxes = this.taxes.compute(input, occupation, work.revenue, costs, workCosts);
    const net = work.revenue - costs - taxes.total;
    const rentalDeposit = this.reference.vehicles()[input.vehicleType]?.rentalDeposit ?? 0;
    const investment = this.workCosts.investment(input, occupation, rentalDeposit);

    // Revenue per working day that pays every cost and tax of the month (before the worker's own pay).
    const variableRate = (input.materialsPct + input.platformFeePct) / 100;
    const proportional = work.revenue * variableRate + (taxes.items.find((i) => i.id === 'incomeTax' || i.id === 'meiIncomeTax')?.amount ?? 0);
    const fixedLike = costs + taxes.total - proportional;
    const breakEvenDaily = work.days > 0 && variableRate < 1 ? fixedLike / work.days / (1 - variableRate) : null;

    const result = {
      occupation,
      input,
      place: this.vehicles.place(input.uf),
      work,
      revenue: work.revenue,
      yearlyRevenue: work.revenue * 12,
      groups: [
        { id: 'vehicle', items: vehicle.items, total: vehicle.total },
        { id: 'work', items: workCosts.items, total: workCosts.total },
        { id: 'taxes', items: taxes.items, total: taxes.total },
      ],
      vehicle,
      costs,
      taxes,
      net,
      netPerHour: work.hours > 0 ? net / work.hours : 0,
      margin: work.revenue > 0 ? net / work.revenue : 0,
      breakEvenDaily,
      investment,
      paybackMonths: investment.total > 0 && net > 0 ? Math.ceil(investment.total / net) : null,
      comparison: this.clt.compare(input.cltSalary, net, work.hours),
      meiRules: this.meiRules(),
      fuelPrice: this.vehicles.fuelPrice(input),
      transitDaily: this.vehicles.transitDaily(input),
    };
    result.warnings = this.warnings(input, occupation, result);
    return result;
  }
}
