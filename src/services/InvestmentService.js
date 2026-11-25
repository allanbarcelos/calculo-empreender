// One-time investment to open the doors: formalization, premises, equipment, launch and the
// working capital reserve.
export class InvestmentService {
  constructor(referenceRepository, businessService) {
    this.reference = referenceRepository;
    this.businesses = businessService;
  }

  // Junta Comercial: MEI registers for free on the Portal do Empreendedor.
  registrationFee(input, place) {
    if (input.regime === 'mei') return 0;
    return input.companyType === 'ltda' ? place.junta.ltda : place.junta.individual;
  }

  formalization(input, place, business) {
    const { licenses } = business;
    // MEI, ME and EPP pay the INPI fees with the small-business discount.
    const trademark = this.reference.trademark();
    return [
      { id: 'registration', amount: this.registrationFee(input, place), kind: place.junta.kind, params: { type: input.regime === 'mei' ? 'mei' : input.companyType } },
      { id: 'firefighters', amount: licenses.firefighters ? place.firefighters.value : 0, kind: place.firefighters.kind },
      { id: 'businessLicense', amount: licenses.license ? place.license.value : 0, kind: place.license.kind },
      { id: 'sanitaryLicense', amount: licenses.sanitary ? (place.sanitary[licenses.sanitary] ?? 0) : 0, kind: place.sanitary.kind },
      { id: 'digitalCertificate', amount: input.digitalCertificate ? this.reference.digitalCertificate().value : 0, kind: 'market' },
      { id: 'trademark', amount: input.trademark ? trademark.discounted : 0, kind: 'official' },
      { id: 'openingService', amount: input.openingService ? this.reference.openingService().value : 0, kind: 'market' },
    ];
  }

  premises(input) {
    const rent = input.areaM2 * input.rentPerM2;
    return [
      { id: 'deposit', amount: rent * input.depositMonths, params: { months: input.depositMonths } },
      { id: 'preOpeningRent', amount: rent * input.preOpeningMonths, params: { months: input.preOpeningMonths } },
      { id: 'renovation', amount: input.areaM2 * input.renovationPerM2, params: { area: input.areaM2, perM2: input.renovationPerM2 } },
      { id: 'facade', amount: input.facade },
    ];
  }

  equipment(input, business) {
    return this.businesses.equipment(business, input.equipment)
      .filter((e) => e.on && e.total > 0)
      .map((e) => ({ id: `equipment:${e.id}`, label: e.label, amount: e.total, params: { qty: e.qty, unitCost: e.unitCost } }));
  }

  launch(input) {
    return [
      { id: 'initialStock', amount: input.initialStock },
      { id: 'initialMarketing', amount: input.initialMarketing },
      { id: 'otherInitial', amount: input.otherInitial },
    ];
  }

  // Sebrae advises keeping a reserve to pay the fixed costs while sales grow.
  workingCapital(input, fixedMonthly) {
    return [{ id: 'workingCapital', amount: fixedMonthly * input.workingCapitalMonths, params: { months: input.workingCapitalMonths, fixedMonthly } }];
  }

  compute(input, place, business, fixedMonthly) {
    const group = (id, items) => {
      const visible = items.filter((i) => i.amount > 0.004);
      return { id, items: visible, total: visible.reduce((s, i) => s + i.amount, 0) };
    };
    const groups = [
      group('formalization', this.formalization(input, place, business)),
      group('premises', this.premises(input)),
      group('equipment', this.equipment(input, business)),
      group('launch', this.launch(input)),
      group('workingCapital', this.workingCapital(input, fixedMonthly)),
    ];
    const total = groups.reduce((s, g) => s + g.total, 0);
    const reserve = groups.find((g) => g.id === 'workingCapital').total;
    return { groups, total, reserve, spent: total - reserve };
  }
}
