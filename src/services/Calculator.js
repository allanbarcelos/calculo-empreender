// Orchestrates the services into the full picture: initial investment, a typical mature month,
// the projection and the warnings.
export class Calculator {
  constructor({ locationService, businessService, operatingService, investmentService, projectionService, taxService, referenceRepository }) {
    this.locations = locationService;
    this.businesses = businessService;
    this.operating = operatingService;
    this.investments = investmentService;
    this.projections = projectionService;
    this.taxes = taxService;
    this.reference = referenceRepository;
  }

  // Payroll estimate used until the user types the cost from Cálculo CLT: each employee at the
  // minimum wage times a rough loaded-cost factor.
  payrollEstimate(employees) {
    const { roughFactor } = this.reference.payrollReference();
    return Math.round(employees * this.reference.minimumWage() * roughFactor * 100) / 100;
  }

  // Values that follow the database while the user has not typed their own: the location's
  // average rent and the payroll estimate.
  withDerived(input, place) {
    return {
      ...input,
      rentPerM2: input.rentAuto ? place.rent.value : input.rentPerM2,
      payrollMonthly: input.payrollAuto ? this.payrollEstimate(input.employees) : input.payrollMonthly,
    };
  }

  warnings(input, business, mature, projection, investment) {
    const mei = this.taxes.mei();
    const simples = this.taxes.simples();
    const yearlyRevenue = mature.revenue * 12;
    const list = [];
    if (input.regime === 'mei' && !business.tax.meiAllowed) list.push({ id: 'meiNotAllowed' });
    if (input.regime === 'mei' && yearlyRevenue > mei.revenueLimit) list.push({ id: 'meiLimit', vars: { yearlyRevenue, limit: mei.revenueLimit } });
    if (input.regime === 'mei' && input.employees > mei.maxEmployees) list.push({ id: 'meiEmployees', vars: { max: mei.maxEmployees, employees: input.employees } });
    if (input.regime === 'simples' && yearlyRevenue > simples.limit) list.push({ id: 'simplesLimit', vars: { yearlyRevenue, limit: simples.limit } });
    if (input.employees > 0 && input.payrollMonthly <= 0) list.push({ id: 'payrollMissing', vars: { employees: input.employees } });
    else if (input.employees > 0 && input.payrollAuto) list.push({ id: 'payrollEstimated', vars: { employees: input.employees, payroll: input.payrollMonthly } });
    if (mature.profit <= 0) list.push({ id: 'noProfit' });
    else if (projection.payback === null) list.push({ id: 'noPayback', vars: { months: projection.months.length } });
    if (!projection.reserveCovers) list.push({ id: 'workingCapital', vars: { maxLoss: projection.maxLoss, reserve: investment.reserve } });
    return list;
  }

  calculate(rawInput) {
    const business = this.businesses.get(rawInput.businessId);
    const place = this.locations.resolve(rawInput);
    const input = this.withDerived(rawInput, place);
    const fixedMonthly = this.operating.fixedTotal(input, place, business);
    const investment = this.investments.compute(input, place, business, fixedMonthly);
    const projection = this.projections.project(input, place, business, investment);
    // A typical month once sales are mature and the Simples rate reflects a full year of sales.
    const mature = projection.months[Math.min(projection.months.length, Math.max(13, Math.round(input.rampUpMonths) + 12)) - 1];
    return {
      business,
      place,
      input,
      investment,
      fixedMonthly,
      mature,
      matureMargin: mature.revenue > 0 ? mature.profit / mature.revenue : 0,
      breakEvenRevenue: this.breakEven(input, mature),
      projection,
      warnings: this.warnings(input, business, mature, projection, investment),
    };
  }

  // Monthly revenue at which a mature month has no profit nor loss: fixed costs ÷ contribution margin.
  breakEven(input, mature) {
    if (mature.revenue <= 0) return null;
    const variableRate = mature.variableTotal / mature.revenue;
    return variableRate < 1 ? mature.fixedTotal / (1 - variableRate) : null;
  }
}
