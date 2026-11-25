// Month-by-month projection: revenue ramp-up, costs, profit and the cash position after the
// investment, summarised at the horizons in reference.json (3, 6, 12, 24 and 36 months).
export class ProjectionService {
  constructor(referenceRepository, operatingService) {
    this.reference = referenceRepository;
    this.operating = operatingService;
  }

  horizons() { return this.reference.projection().horizons; }

  project(input, place, business, investment) {
    const { months: count } = this.reference.projection();
    const revenues = [];
    const months = [];
    let cumulativeProfit = 0;
    let worstCumulative = 0;
    let payback = null;
    for (let m = 1; m <= count; m += 1) {
      revenues.push(this.operating.revenue(input, m));
      const month = this.operating.month(input, place, business, revenues, m, investment.equipment);
      cumulativeProfit += month.profit;
      worstCumulative = Math.min(worstCumulative, cumulativeProfit);
      // Cash after paying back what was spent to open (the working capital reserve is not spent).
      const position = cumulativeProfit - investment.spent;
      if (payback === null && position >= 0) payback = m;
      months.push({ ...month, cumulativeProfit, position });
    }

    const horizons = this.horizons().filter((h) => h <= count).map((h) => {
      const slice = months.slice(0, h);
      const sum = (key) => slice.reduce((s, m) => s + m[key], 0);
      return { months: h, revenue: sum('revenue'), costs: sum('costs'), profit: sum('profit'), position: slice.at(-1).position, averageProfit: sum('profit') / h };
    });

    // Cash the business needs on top of what it spends: the losses while sales grow and the
    // credit-card sales not received yet (paid D+30) once sales are mature (Sebrae: capital de
    // giro = needs of the cash cycle).
    const { creditShare, creditDays } = this.reference.cardFees();
    const receivables = this.operating.matureRevenue(input) * (input.cardShare / 100) * creditShare * (creditDays / 30);
    const cashNeed = -worstCumulative + receivables;
    return {
      months,
      horizons,
      payback,
      maxLoss: -worstCumulative,
      receivables,
      cashNeed,
      reserveCovers: cashNeed <= investment.reserve + 0.005,
    };
  }
}
