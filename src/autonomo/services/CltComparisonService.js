// What a CLT job pays in a year, to compare with the autonomous net income: 11 months of net
// salary, the vacation month with its extra third, the 13th salary and the FGTS deposits. Hours
// per year exclude vacation and national holidays. Transport and meal vouchers are left out.
export class CltComparisonService {
  constructor({ workReferenceRepository, incomeTaxService }) {
    this.reference = workReferenceRepository;
    this.incomeTax = incomeTaxService;
  }

  rules() { return this.reference.clt(); }

  inss(gross) {
    const { ceiling, brackets } = this.rules().inssEmployee;
    const base = Math.min(gross, ceiling);
    let previous = 0;
    let total = 0;
    for (const { upTo, rate } of brackets) {
      if (base <= previous) break;
      total += (Math.min(base, upTo) - previous) * rate;
      previous = upTo;
    }
    return Math.round(total * 100 + 1e-6) / 100;
  }

  net(gross) {
    if (gross <= 0) return 0;
    const inss = this.inss(gross);
    return gross - inss - this.incomeTax.monthly(gross, inss).tax;
  }

  hoursPerYear() {
    const r = this.rules();
    return (r.weeklyHours * (365 - r.vacationDays - r.holidays)) / 7;
  }

  package(salary) {
    const r = this.rules();
    const monthlyNet = this.net(salary);
    const vacationMonth = this.net(salary * (4 / 3));
    const thirteenth = this.net(salary);
    const cash = 11 * monthlyNet + vacationMonth + thirteenth;
    const fgts = salary * r.fgtsRate * (13 + 1 / 3);
    const total = cash + fgts;
    return { salary, monthlyNet, cash, fgts, total, monthly: total / 12, hourly: total / this.hoursPerYear(), hoursPerYear: this.hoursPerYear() };
  }

  // Gross CLT salary whose yearly package (cash + FGTS) equals the given yearly amount.
  equivalentSalary(yearly) {
    if (yearly <= 0) return 0;
    let lo = 0;
    let hi = 200000;
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      if (this.package(mid).total < yearly) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  compare(salary, netMonthly, hoursMonth) {
    const clt = this.package(salary);
    const yearly = netMonthly * 12;
    return {
      clt,
      autonomous: { yearly, monthly: netMonthly, hourly: hoursMonth > 0 ? netMonthly / hoursMonth : 0, hoursPerYear: hoursMonth * 12 },
      equivalentSalary: this.equivalentSalary(yearly),
      difference: yearly - clt.total,
    };
  }
}
