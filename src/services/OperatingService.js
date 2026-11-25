// One month of operation: revenue (with the ramp-up of a new business), variable costs (goods,
// card fees, taxes) and fixed costs.
export class OperatingService {
  constructor(referenceRepository, taxService) {
    this.reference = referenceRepository;
    this.taxes = taxService;
  }

  // Share of mature sales reached in month m: grows linearly from rampStartShare in month 1 to
  // 100% in month rampUpMonths.
  ramp(input, month) {
    const { rampStartShare } = this.reference.projection();
    const months = Math.max(1, Math.round(input.rampUpMonths || 1));
    if (month >= months) return 1;
    return rampStartShare + ((1 - rampStartShare) * (month - 1)) / (months - 1);
  }

  matureRevenue(input) {
    return input.ticket * input.customersPerDay * input.openDays;
  }

  revenue(input, month) {
    return this.matureRevenue(input) * this.ramp(input, month);
  }

  accountingFee(input) {
    const accounting = this.reference.accounting();
    return input.accountingAuto ? accounting[input.regime] : input.accountingMonthly;
  }

  // Fixed costs: the same every month, whatever the sales.
  fixed(input, place, business) {
    const items = [
      { id: 'rent', amount: input.areaM2 * input.rentPerM2, params: { area: input.areaM2, perM2: input.rentPerM2 } },
      { id: 'energy', amount: input.energyKwh * place.energy.value, params: { kwh: input.energyKwh, tariff: place.energy.value } },
      { id: 'water', amount: input.waterM3 * place.water.value, params: { m3: input.waterM3, tariff: place.water.value } },
      { id: 'consumables', amount: input.consumables },
      { id: 'maintenance', amount: input.maintenance },
      { id: 'software', amount: input.software },
      { id: 'marketing', amount: input.marketing },
      { id: 'accounting', amount: this.accountingFee(input) },
      { id: 'payroll', amount: input.payrollMonthly, params: { employees: input.employees } },
      { id: 'proLabore', amount: input.proLabore },
      { id: 'otherFixed', amount: input.otherFixed },
    ];
    if (input.regime === 'mei') items.push({ id: 'meiDas', amount: this.taxes.meiDas(business) });
    return items;
  }

  fixedTotal(input, place, business) {
    return this.fixed(input, place, business).reduce((s, i) => s + i.amount, 0);
  }

  // revenues: revenue of every month up to this one (for the Simples Nacional RBT12).
  month(input, place, business, revenues, month) {
    const revenue = revenues[month - 1];
    const tax = this.taxes.monthly(input, business, revenues, month);
    const variable = [
      { id: 'goods', amount: revenue * (input.cmvRate / 100), params: { rate: input.cmvRate / 100 } },
      { id: 'cardFees', amount: revenue * (input.cardShare / 100) * (input.cardFeeRate / 100), params: { share: input.cardShare / 100, rate: input.cardFeeRate / 100 } },
    ];
    if (!tax.fixed) variable.push({ id: 'simplesTax', amount: tax.amount, params: { rate: tax.rate, rbt12: tax.rbt12 } });
    const fixed = this.fixed(input, place, business);
    const sum = (items) => items.reduce((s, i) => s + i.amount, 0);
    const costs = sum(variable) + sum(fixed);
    return { month, ramp: this.ramp(input, month), revenue, variable, fixed, variableTotal: sum(variable), fixedTotal: sum(fixed), costs, profit: revenue - costs, tax };
  }
}
