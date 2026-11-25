// Business types and the form values each one pre-fills (all editable).
export class BusinessService {
  constructor(businessRepository) {
    this.businesses = businessRepository;
  }

  list() { return this.businesses.list(); }
  get(id) { return this.businesses.get(id) ?? this.list()[0]; }
  scenarios() { return this.businesses.scenarios(); }

  // Essential items start selected; optional ones start off.
  equipmentDefaults(business) {
    return Object.fromEntries(business.equipment.map((e) => [e.id, { on: e.essential, qty: e.qty, unitCost: e.unitCost }]));
  }

  // Equipment rows merging the catalogue with what the user changed.
  equipment(business, state = {}) {
    return business.equipment.map((e) => {
      const chosen = state[e.id] ?? { on: e.essential, qty: e.qty, unitCost: e.unitCost };
      return { ...e, on: Boolean(chosen.on), qty: chosen.qty, unitCost: chosen.unitCost, total: chosen.on ? chosen.qty * chosen.unitCost : 0 };
    });
  }

  customersFor(business, scenario) {
    return business.revenue.customersPerDay[scenario] ?? business.revenue.customersPerDay.medium;
  }

  // Monthly revenue once the business is mature.
  matureRevenue(b, scenario) {
    return b.revenue.ticket * this.customersFor(b, scenario) * b.revenue.openDays;
  }

  // Form patch when a business type is chosen. MEI is suggested only when the activity allows it
  // and the expected yearly revenue fits the MEI limit.
  patch(id, scenario = 'medium', meiLimit = Infinity) {
    const b = this.get(id);
    const fitsMei = b.tax.meiAllowed && this.matureRevenue(b, scenario) * 12 <= meiLimit;
    return {
      businessId: b.id,
      areaM2: b.areaM2,
      renovationPerM2: b.renovationPerM2,
      facade: b.facade,
      initialStock: b.initialStock,
      initialMarketing: b.initialMarketing,
      equipment: this.equipmentDefaults(b),
      energyKwh: b.monthly.energyKwh,
      waterM3: b.monthly.waterM3,
      consumables: b.monthly.consumables,
      maintenance: b.monthly.maintenance,
      software: b.monthly.software,
      marketing: b.monthly.marketing,
      otherFixed: b.monthly.other ?? 0,
      ticket: b.revenue.ticket,
      scenario,
      customersPerDay: this.customersFor(b, scenario),
      openDays: b.revenue.openDays,
      rampUpMonths: b.revenue.rampUpMonths,
      cmvRate: b.revenue.cmvRate * 100,
      cardShare: b.revenue.cardShare * 100,
      employees: b.staff.reduce((s, r) => s + r.count, 0),
      regime: fitsMei ? 'mei' : 'simples',
    };
  }
}
