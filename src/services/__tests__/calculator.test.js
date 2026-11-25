import { describe, expect, it } from 'vitest';
import { jsonDatabase } from '../../repositories/database.js';
import { createServices } from '../container.js';

const services = createServices(jsonDatabase, '2026-11-25');
const defaults = services.formDefaults.defaults();
const forBusiness = (id, patch = {}) => ({ ...defaults, ...services.formDefaults.businessPatch(defaults, id), ...patch });
const calc = (input) => services.calculator.calculate(input);

describe('TaxService', () => {
  const { taxes } = services;

  it('Simples effective rate: (RBT12 × nominal − deduction) ÷ RBT12', () => {
    expect(taxes.simplesRate('I', 150000)).toBeCloseTo(0.04, 10);
    expect(taxes.simplesRate('I', 600000)).toBeCloseTo((600000 * 0.095 - 13860) / 600000, 10);
    expect(taxes.simplesRate('III', 300000)).toBeCloseTo((300000 * 0.112 - 9360) / 300000, 10);
  });

  it('RBT12 of a new company: month 1 × 12, then the average of previous months × 12', () => {
    const revenues = [10, 20, 30, ...Array(20).fill(40)];
    expect(taxes.rbt12(revenues, 1)).toBe(120);
    expect(taxes.rbt12(revenues, 3)).toBe(15 * 12);
    expect(taxes.rbt12(revenues, 13)).toBe(10 + 20 + 30 + 9 * 40);
    expect(taxes.rbt12(revenues, 14)).toBe(20 + 30 + 10 * 40);
  });

  it('MEI DAS 2026 by activity (5% of R$ 1.621 + ICMS and/or ISS)', () => {
    expect(taxes.meiDas({ tax: { meiActivity: 'commerce' } })).toBe(82.05);
    expect(taxes.meiDas({ tax: { meiActivity: 'services' } })).toBe(86.05);
    expect(taxes.meiDas({ tax: { meiActivity: 'both' } })).toBe(87.05);
  });

  it('MEI limit follows LC 238/2026 by date', () => {
    expect(createServices(jsonDatabase, '2027-03-01').taxes.mei().revenueLimit).toBe(110000);
    expect(createServices(jsonDatabase, '2028-03-01').taxes.mei().revenueLimit).toBe(140000);
  });
});

describe('Revenue ramp-up', () => {
  it('starts at the configured share and is mature from rampUpMonths on', () => {
    const { rampStartShare } = services.repositories.reference.projection();
    const input = forBusiness('lanchonete', { rampUpMonths: 5 });
    expect(services.operating.ramp(input, 1)).toBeCloseTo(rampStartShare, 10);
    expect(services.operating.ramp(input, 3)).toBeCloseTo(rampStartShare + (1 - rampStartShare) / 2, 10);
    expect(services.operating.ramp(input, 5)).toBe(1);
    expect(services.operating.ramp(input, 30)).toBe(1);
  });
});

describe('Calculator', () => {
  it('investment = sum of its groups; working capital = months × fixed costs', () => {
    const r = calc(forBusiness('salao_beleza'));
    const sum = r.investment.groups.reduce((s, g) => s + g.total, 0);
    expect(r.investment.total).toBeCloseTo(sum, 6);
    expect(r.investment.reserve).toBeCloseTo(r.fixedMonthly * defaults.workingCapitalMonths, 6);
    expect(r.investment.spent).toBeCloseTo(r.investment.total - r.investment.reserve, 6);
  });

  it('equipment total follows the selected items', () => {
    const input = forBusiness('lanchonete');
    const first = services.businesses.get('lanchonete').equipment[0];
    const without = calc({ ...input, equipment: { ...input.equipment, [first.id]: { ...input.equipment[first.id], on: false } } });
    const withIt = calc(input);
    const total = (r) => r.investment.groups.find((g) => g.id === 'equipment').total;
    expect(total(withIt) - total(without)).toBeCloseTo(first.qty * first.unitCost, 6);
  });

  it('a month: profit = revenue − variable − fixed; Simples tax on revenue', () => {
    const r = calc(forBusiness('loja_roupas', { regime: 'simples' }));
    const m = r.mature;
    expect(m.profit).toBeCloseTo(m.revenue - m.variableTotal - m.fixedTotal, 6);
    const tax = m.variable.find((i) => i.id === 'simplesTax');
    expect(tax.amount).toBeCloseTo(m.revenue * services.taxes.simplesRate('I', tax.params.rbt12), 6);
  });

  it('MEI pays the fixed DAS and no Simples tax on revenue', () => {
    const r = calc(forBusiness('salao_beleza', { regime: 'mei', customersPerDay: 3, employees: 1 }));
    expect(r.mature.fixed.find((i) => i.id === 'meiDas').amount).toBe(86.05);
    expect(r.mature.variable.some((i) => i.id === 'simplesTax')).toBe(false);
    expect(r.investment.groups.find((g) => g.id === 'formalization').items.some((i) => i.id === 'registration')).toBe(false);
  });

  it('warns when MEI revenue or staff exceed the limits', () => {
    const ids = calc(forBusiness('lanchonete', { regime: 'mei', employees: 3 })).warnings.map((w) => w.id);
    expect(ids).toContain('meiLimit');
    expect(ids).toContain('meiEmployees');
  });

  it('payback is the first month the accumulated profit pays what was spent', () => {
    const r = calc(forBusiness('lanchonete'));
    const { months, payback } = r.projection;
    expect(payback).not.toBeNull();
    expect(months[payback - 1].cumulativeProfit).toBeGreaterThanOrEqual(r.investment.spent);
    if (payback > 1) expect(months[payback - 2].cumulativeProfit).toBeLessThan(r.investment.spent);
  });

  it('horizons add up the months', () => {
    const r = calc(forBusiness('padaria'));
    const six = r.projection.horizons.find((h) => h.months === 6);
    expect(six.revenue).toBeCloseTo(r.projection.months.slice(0, 6).reduce((s, m) => s + m.revenue, 0), 6);
    expect(r.projection.horizons.map((h) => h.months)).toEqual([3, 6, 12, 24, 36]);
  });

  it('payroll follows the estimate until the user types it', () => {
    const auto = calc(forBusiness('lanchonete', { employees: 2 }));
    expect(auto.input.payrollMonthly).toBeCloseTo(2 * 1621 * 1.5, 2);
    expect(calc(forBusiness('lanchonete', { payrollAuto: false, payrollMonthly: 9000 })).input.payrollMonthly).toBe(9000);
  });
});

describe('Locations', () => {
  it('every capital resolves with rent, energy and fees', () => {
    for (const s of services.locations.states()) {
      const place = services.locations.resolve({ uf: s.uf, cityId: '' });
      expect(place.rent.value).toBeGreaterThan(0);
      expect(place.energy.value).toBeGreaterThan(0);
      expect(place.junta.ltda).toBeGreaterThanOrEqual(0);
    }
  });

  it('interior rent is the capital rent times the state factor, marked as an estimate', () => {
    const capital = services.locations.resolve({ uf: 'SP', cityId: '' });
    const interior = services.locations.resolve({ uf: 'SP', cityId: 'interior' });
    const { interiorRentFactor } = services.repositories.locations.state('SP');
    expect(interior.rent.value).toBeCloseTo(capital.rent.value * interiorRentFactor, 6);
    expect(interior.rent.kind).toBe('estimate');
    expect(interior.feesFromCapital).toBe(true);
  });

  it('uses the location rent unless the user typed one', () => {
    const r = calc(forBusiness('lanchonete', { uf: 'RJ' }));
    expect(r.input.rentPerM2).toBe(services.locations.resolve({ uf: 'RJ' }).rent.value);
    expect(calc(forBusiness('lanchonete', { rentAuto: false, rentPerM2: 10 })).input.rentPerM2).toBe(10);
  });
});

describe('FormStateService', () => {
  it('restores defaults for wrong types and unknown ids', () => {
    const data = services.formState.restore({ businessId: 'gone', uf: 'XX', areaM2: 'big', equipment: { chapa: { on: 'yes' } } });
    expect(data.businessId).toBe(defaults.businessId);
    expect(data.uf).toBe(defaults.uf);
    expect(data.areaM2).toBe(defaults.areaM2);
    expect(Object.keys(data.equipment).length).toBe(services.businesses.get(data.businessId).equipment.length);
  });
});
