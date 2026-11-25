// Monthly progressive income tax (IRPF) with the Lei 15.270/2025 reduction, which zeroes the tax
// on taxable income up to R$ 5.000 a month and phases out up to R$ 7.350. Used for the carnê-leão
// of the autonomous worker, for the MEI profit above the exempt share and for the CLT salary.
export class IncomeTaxService {
  constructor(workReferenceRepository) {
    this.reference = workReferenceRepository;
  }

  table() { return this.reference.incomeTax(); }

  reduction(income) {
    const r = this.table().reduction;
    if (income <= r.fullUpTo) return r.fullAmount;
    if (income <= r.phaseOutUpTo) return r.constant - r.factor * income;
    return 0;
  }

  // income: taxable income of the month; deductions: INSS and other legal deductions. The
  // simplified monthly discount replaces them when larger.
  monthly(income, deductions = 0) {
    const table = this.table();
    if (income <= 0) return { base: 0, before: 0, tax: 0 };
    const base = Math.max(0, income - Math.max(deductions, table.simplifiedDiscount));
    const bracket = table.brackets.find((b) => b.upTo === null || base <= b.upTo);
    const before = Math.max(0, base * bracket.rate - bracket.deduct);
    const tax = Math.max(0, before - Math.min(before, this.reduction(income)));
    // To the cent: the reduction is meant to zero the tax exactly up to R$ 5.000.
    return { base, before, tax: Math.round(tax * 100) / 100 };
  }
}
