// Initial form values: the first business type in a medium scenario, in the default state's
// capital. Every value pre-filled from the database stays editable.
export class FormDefaultsService {
  constructor({ businessService, locationRepository, referenceRepository }) {
    this.businesses = businessService;
    this.locations = locationRepository;
    this.reference = referenceRepository;
  }

  defaults() {
    const projection = this.reference.projection();
    const first = this.businesses.list()[0];
    return {
      uf: this.locations.defaultState(),
      cityId: '',
      rentAuto: true,
      rentPerM2: 0,
      depositMonths: projection.depositMonths,
      preOpeningMonths: projection.preOpeningMonths,
      companyType: 'individual',
      digitalCertificate: true,
      trademark: false,
      openingService: false,
      accountingAuto: true,
      accountingMonthly: 0,
      payrollMonthly: 0,
      payrollAuto: true,
      proLabore: this.reference.minimumWage(),
      otherFixed: 0,
      otherInitial: 0,
      cardFeeRate: this.reference.cardFees().blended * 100,
      workingCapitalMonths: projection.workingCapitalMonths,
      ...this.businesses.patch(first.id, 'medium', this.reference.mei().revenueLimit),
    };
  }

  // Changing the business keeps place and personal choices and reloads the business figures.
  businessPatch(data, id) {
    return this.businesses.patch(id, data.scenario ?? 'medium', this.reference.mei().revenueLimit);
  }

  scenarioPatch(data, scenario) {
    return { scenario, customersPerDay: this.businesses.customersFor(this.businesses.get(data.businessId), scenario) };
  }
}
