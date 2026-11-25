// MEI and Simples Nacional (LC 123/2006). MEI pays a fixed monthly DAS; Simples Nacional pays
// an effective rate on monthly revenue that depends on the revenue of the last 12 months (RBT12).
export const REGIMES = ['mei', 'simples'];

export class TaxService {
  constructor(referenceRepository) {
    this.reference = referenceRepository;
  }

  mei() { return this.reference.mei(); }
  simples() { return this.reference.simples(); }

  meiDas(business) {
    return this.mei().das[business.tax.meiActivity] ?? this.mei().das.both;
  }

  // Effective rate: (RBT12 × nominal rate − deduction) ÷ RBT12, in the bracket of RBT12.
  simplesRate(annex, rbt12) {
    const brackets = this.simples().annexes[annex];
    const bracket = brackets.find((b) => rbt12 <= b.upTo) ?? brackets.at(-1);
    if (rbt12 <= 0) return brackets[0].rate;
    return Math.max(0, (rbt12 * bracket.rate - bracket.deduct) / rbt12);
  }

  // RBT12 for a company still in its first year (LC 123/2006, art. 18, §§ 2º e 3º): in the first
  // month, that month's revenue × 12; in the next 11, the average of the previous months × 12.
  rbt12(revenues, month) {
    const previous = revenues.slice(Math.max(0, month - 13), month - 1);
    if (month === 1) return revenues[0] * 12;
    if (month <= 12) return (previous.reduce((s, r) => s + r, 0) / previous.length) * 12;
    return previous.reduce((s, r) => s + r, 0);
  }

  // Tax of one month. revenues holds the revenue of every month up to this one.
  monthly(input, business, revenues, month) {
    const revenue = revenues[month - 1];
    if (input.regime === 'mei') return { amount: this.meiDas(business), rate: null, rbt12: null, fixed: true };
    const rbt12 = this.rbt12(revenues, month);
    const rate = this.simplesRate(business.tax.simplesAnnex, rbt12);
    return { amount: revenue * rate, rate, rbt12, fixed: false };
  }
}
