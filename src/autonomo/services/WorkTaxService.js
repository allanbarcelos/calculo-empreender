// Taxes of the autonomous worker in each regime.
//  MEI: fixed DAS (INSS 5% of the minimum wage + ISS). The profit up to the presumed share of
//  revenue is exempt; what goes beyond it is taxable income of the owner (estimated monthly).
//  Autônomo (contribuinte individual): INSS of 11% of the minimum wage (simplified plan) or 20%
//  of the chosen base (for drivers, at least 20% of the gross fares); income tax through the carnê-leão on the taxable share of revenue
//  (transport of passengers 60%, of cargo 10%) or on revenue minus the bookkeeping expenses;
//  municipal ISS of the self-employed.
export const WORK_REGIMES = ['mei', 'individual'];

export class WorkTaxService {
  constructor({ workReferenceRepository, referenceRepository, incomeTaxService }) {
    this.reference = workReferenceRepository;
    this.national = referenceRepository;
    this.incomeTax = incomeTaxService;
  }

  mei() { return this.national.mei(); }
  // DAS by the occupation's taxes in the MEI annex: ISS (services), ICMS (commerce) or both.
  meiDas(occupation) {
    const das = this.mei().das;
    return das[occupation?.tax.meiActivity ?? 'services'] ?? das.services;
  }

  // Lowest contribution base in the normal plan. For an autonomous driver (passengers or
  // cargo, app drivers included) the base is at least 20% of the gross fares (Decreto
  // 3.048/1999, art. 214, § 19).
  minimumBase(occupation, revenue) {
    const minimumWage = this.national.minimumWage();
    const share = occupation.tax.inssGrossShare ?? 0;
    return Math.max(minimumWage, revenue * share);
  }

  inss(input, occupation, revenue) {
    const rules = this.reference.inssIndividual();
    const minimumWage = this.national.minimumWage();
    if (input.inssPlan === 'simplified') return { amount: rules.simplifiedRate * minimumWage, rate: rules.simplifiedRate, base: minimumWage };
    const base = Math.min(Math.max(input.inssBase, this.minimumBase(occupation, revenue)), rules.ceiling);
    return { amount: rules.fullRate * base, rate: rules.fullRate, base };
  }

  // Taxable income of the month for the carnê-leão.
  taxableIncome(occupation, revenue, workCosts) {
    const rules = this.reference.incomeTax();
    const kind = occupation.tax.incomeTaxBase;
    if (rules.taxableShare[kind] !== undefined) return { amount: revenue * rules.taxableShare[kind], share: rules.taxableShare[kind], kind };
    const deductible = workCosts.items.filter((i) => rules.bookkeepingDeductible.includes(i.id)).reduce((s, i) => s + i.amount, 0);
    return { amount: Math.max(0, revenue - deductible), share: null, kind: 'bookkeeping', deductible };
  }

  // costs: every cost before taxes (vehicle + work).
  compute(input, occupation, revenue, costs, workCosts) {
    const items = [];
    const add = (id, amount, kind, params) => { if (amount > 0.004) items.push({ id, amount, kind, params }); };

    if (input.regime === 'mei') {
      const das = this.meiDas(occupation);
      add('das', das, 'official', { amount: das });
      const presumption = this.reference.meiProfit().presumption[occupation.tax.meiPresumption];
      const exempt = revenue * presumption;
      const profit = revenue - costs - das;
      const taxable = Math.max(0, profit - exempt);
      // Declared once a year; estimated here with the monthly table and reduction.
      add('meiIncomeTax', this.incomeTax.monthly(taxable, 0).tax, 'estimate', { rate: presumption });
      return { items, total: items.reduce((s, i) => s + i.amount, 0), meiExempt: exempt, meiTaxable: taxable };
    }

    const inss = this.inss(input, occupation, revenue);
    add('inss', inss.amount, 'official', { rate: inss.rate, base: inss.base });
    const taxable = this.taxableIncome(occupation, revenue, workCosts);
    add('incomeTax', this.incomeTax.monthly(taxable.amount, inss.amount).tax, 'official', { share: taxable.share });
    add('iss', input.issMonthly, 'estimate');
    return { items, total: items.reduce((s, i) => s + i.amount, 0), inss, taxable };
  }
}
