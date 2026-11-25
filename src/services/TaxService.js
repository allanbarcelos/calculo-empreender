// MEI and Simples Nacional (LC 123/2006). MEI pays a fixed monthly DAS; Simples Nacional pays
// an effective rate on monthly revenue that depends on the revenue of the last 12 months (RBT12).
// Revenue is split by annex when a business sells goods and services (art. 18, § 4º), and the
// ICMS and PIS/COFINS shares of the DAS come off the revenue already taxed by tax substitution
// (ICMS-ST) or by the single-phase regime (monofásico) (art. 18, § 4º-A).
export const REGIMES = ['mei', 'simples'];
const GOODS_ANNEXES = ['I', 'II'];

export class TaxService {
  constructor(referenceRepository) {
    this.reference = referenceRepository;
  }

  mei() { return this.reference.mei(); }
  simples() { return this.reference.simples(); }

  meiDas(business) {
    return this.mei().das[business.tax.meiActivity] ?? this.mei().das.both;
  }

  bracketIndex(annex, rbt12) {
    const brackets = this.simples().annexes[annex];
    const index = brackets.findIndex((b) => rbt12 <= b.upTo);
    return index === -1 ? brackets.length - 1 : index;
  }

  // Effective rate: (RBT12 × nominal rate − deduction) ÷ RBT12, in the bracket of RBT12.
  simplesRate(annex, rbt12) {
    const brackets = this.simples().annexes[annex];
    if (rbt12 <= 0) return brackets[0].rate;
    const bracket = brackets[this.bracketIndex(annex, rbt12)];
    return Math.max(0, (rbt12 * bracket.rate - bracket.deduct) / rbt12);
  }

  // Revenue share of each annex: { I: 0.45, III: 0.55 } or the single main annex.
  annexMix(business) {
    return business.tax.annexMix ?? { [business.tax.simplesAnnex]: 1 };
  }

  // Effective rate on total revenue, with the annex split and the ST/monofásico exclusions.
  simplesBlendedRate(business, rbt12) {
    const mix = this.annexMix(business);
    let rate = 0;
    for (const [annex, share] of Object.entries(mix)) rate += share * this.simplesRate(annex, rbt12);
    const goods = Object.keys(mix).find((a) => GOODS_ANNEXES.includes(a));
    const partition = goods && this.simples().partition?.[goods];
    if (partition) {
      const i = this.bracketIndex(goods, rbt12);
      const goodsRate = this.simplesRate(goods, rbt12);
      rate -= (business.tax.stShare ?? 0) * goodsRate * partition.icms[i];
      rate -= (business.tax.monoShare ?? 0) * goodsRate * partition.pisCofins[i];
    }
    return Math.max(0, rate);
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
    const rate = this.simplesBlendedRate(business, rbt12);
    return { amount: revenue * rate, rate, rbt12, fixed: false };
  }
}
