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
      proLabore: this.reference.proLabore().default,
      otherFixed: 0,
      otherInitial: 0,
      ...this.businesses.patch(first.id, 'medium', this.meiLimit(), this.businessDefaults()),
    };
  }

  businessDefaults() {
    return { cardFeeRate: this.reference.cardFees().blended, workingCapitalMonths: this.reference.projection().workingCapitalMonths };
  }

  // MEI limit used to suggest the regime: the one of the year after today, when a business
  // being planned now will be in its first full year.
  meiLimit() {
    const nextYear = `${Number(this.reference.referenceDate.slice(0, 4)) + 1}-01-01`;
    return this.reference.meiOn(nextYear).revenueLimit;
  }

  // Changing the business keeps place and personal choices and reloads the business figures.
  businessPatch(data, id) {
    return this.businesses.patch(id, data.scenario ?? 'medium', this.meiLimit(), this.businessDefaults());
  }

  scenarioPatch(data, scenario) {
    return { scenario, customersPerDay: this.businesses.customersFor(this.businesses.get(data.businessId), scenario) };
  }
}
