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

  // Opening date: the reference date plus the months of fit-out before opening.
  openingDate(input) {
    const [y, m] = this.reference.referenceDate.split('-').map(Number);
    const months = m - 1 + Math.max(0, Math.round(input.preOpeningMonths || 0));
    return { year: y + Math.floor(months / 12), month: (months % 12) + 1 };
  }

  // MEI limits by calendar year: in the opening year the limit is proportional to the months
  // open (LC 123/2006, art. 18-A, § 2º); each later year has its own limit (LC 238/2026).
  meiCheck(input, projection) {
    const opening = this.openingDate(input);
    const years = [];
    let monthIndex = 0;
    for (let year = opening.year; monthIndex < Math.min(24, projection.months.length); year += 1) {
      const firstMonth = year === opening.year ? opening.month : 1;
      const count = 13 - firstMonth;
      const slice = projection.months.slice(monthIndex, monthIndex + count);
      const rules = this.reference.meiOn(`${year}-01-01`);
      const limit = (rules.revenueLimit / 12) * count;
      years.push({ year, months: slice.length, revenue: slice.reduce((s, m) => s + m.revenue, 0), limit: (limit / count) * slice.length, rules });
      monthIndex += count;
    }
    return years.find((y) => y.months > 0 && y.revenue > y.limit) ?? null;
  }

  warnings(input, business, mature, projection, investment, matureMargin) {
    const simples = this.taxes.simples();
    const yearlyRevenue = mature.revenue * 12;
    const list = [];
    if (input.regime === 'mei' && !business.tax.meiAllowed) list.push({ id: 'meiNotAllowed' });
    const excess = input.regime === 'mei' ? this.meiCheck(input, projection) : null;
    if (excess) list.push({ id: 'meiLimit', vars: { year: excess.year, revenue: excess.revenue, limit: excess.limit, months: excess.months } });
    const nextMei = this.reference.meiOn(`${this.openingDate(input).year}-12-31`);
    if (input.regime === 'mei' && input.employees > nextMei.maxEmployees) list.push({ id: 'meiEmployees', vars: { max: nextMei.maxEmployees, employees: input.employees } });
    if (input.regime === 'simples' && yearlyRevenue > simples.limit) list.push({ id: 'simplesLimit', vars: { yearlyRevenue, limit: simples.limit } });
    if (input.employees > 0 && input.payrollMonthly <= 0) list.push({ id: 'payrollMissing', vars: { employees: input.employees } });
    else if (input.employees > 0 && input.payrollAuto) list.push({ id: 'payrollEstimated', vars: { employees: input.employees, payroll: input.payrollMonthly } });
    if (mature.profit <= 0) list.push({ id: 'noProfit' });
    else if (projection.payback === null) list.push({ id: 'noPayback', vars: { months: projection.months.length } });
    if (!projection.reserveCovers) list.push({ id: 'workingCapital', vars: { maxLoss: projection.maxLoss, receivables: projection.receivables, need: projection.cashNeed, reserve: investment.reserve } });
    const range = business.revenue.netMarginRange;
    if (range && mature.revenue > 0 && mature.profit > 0) {
      if (matureMargin > range[1]) list.push({ id: 'marginAboveSector', vars: { margin: matureMargin, min: range[0], max: range[1] } });
      else if (matureMargin < range[0]) list.push({ id: 'marginBelowSector', vars: { margin: matureMargin, min: range[0], max: range[1] } });
    }
    return list;
  }

  calculate(rawInput) {
    const business = this.businesses.get(rawInput.businessId);
    const place = this.locations.resolve(rawInput);
    const input = this.withDerived(rawInput, place);
    // The reserve covers the fixed costs paid in cash (without the equipment replacement fund).
    const fixedMonthly = this.operating.fixedTotal(input, place, business, 0);
    const investment = this.investments.compute(input, place, business, fixedMonthly);
    const projection = this.projections.project(input, place, business, investment);
    // A typical month once sales are mature and the Simples rate reflects a full year of sales.
    const mature = projection.months[Math.min(projection.months.length, Math.max(13, Math.round(input.rampUpMonths) + 12)) - 1];
    const matureMargin = mature.revenue > 0 ? mature.profit / mature.revenue : 0;
    return {
      business,
      place,
      input,
      investment,
      fixedMonthly,
      mature,
      matureMargin,
      // MEI rules of the year the business opens (limit and employees change with LC 238/2026).
      meiRules: this.reference.meiOn(`${this.openingDate(input).year}-12-31`),
      breakEvenRevenue: this.breakEven(input, mature),
      projection,
      warnings: this.warnings(input, business, mature, projection, investment, matureMargin),
    };
  }

  // Monthly revenue at which a mature month has no profit nor loss: fixed costs ÷ contribution margin.
  breakEven(input, mature) {
    if (mature.revenue <= 0) return null;
    const variableRate = mature.variableTotal / mature.revenue;
    return variableRate < 1 ? mature.fixedTotal / (1 - variableRate) : null;
  }
}
