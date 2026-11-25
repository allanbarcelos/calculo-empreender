import { describe, expect, it } from 'vitest';
import { createWorkServices } from '../container.js';
import { workDatabase } from '../database.js';

const services = createWorkServices(workDatabase, '2026-11-25');
const defaults = services.formDefaults.defaults();
const forOccupation = (id, patch = {}) => ({ ...defaults, ...services.formDefaults.occupationPatch(defaults, id), ...patch });
const calc = (input) => services.calculator.calculate(input);
const item = (result, group, id) => result.groups.find((g) => g.id === group).items.find((i) => i.id === id);

describe('Workload', () => {
  it('takes days off and idle days out of the year and averages per month', () => {
    const input = forOccupation('motorista_app', { daysPerMonth: 24, vacationDays: 30, idleDays: 12, hoursPerDay: 8, earningsPerHour: 40, kmPerUnit: 20 });
    const work = services.workload.month(input, services.occupations.get('motorista_app'));
    const days = (24 * 12 - 42) / 12;
    expect(work.days).toBeCloseTo(days, 10);
    expect(work.hours).toBeCloseTo(days * 8, 10);
    expect(work.revenue).toBeCloseTo(days * 8 * 40, 10);
    expect(work.km).toBeCloseTo(days * 8 * 20, 10);
  });

  it('services earn per job; public transport runs no km costs', () => {
    const input = forOccupation('manicure', { ticket: 70, jobsPerDay: 3 });
    const r = calc(input);
    expect(r.revenue).toBeCloseTo(r.work.days * 3 * 70, 10);
    expect(r.work.km).toBe(0);
    expect(item(r, 'vehicle', 'transit').amount).toBeCloseTo(r.transitDaily * r.work.days, 10);
  });
});

describe('Vehicle costs', () => {
  it('own car: fuel by km, maintenance, depreciation, insurance, state IPVA and licensing', () => {
    const input = forOccupation('motorista_app', { uf: 'SP', vehicleValue: 50000, depreciationPct: 10, insurancePct: 5, maintenancePerKm: 0.25, consumption: 12 });
    const r = calc(input);
    const sp = services.repositories.regional.state('SP');
    expect(item(r, 'vehicle', 'fuel').amount).toBeCloseTo((r.work.km / 12) * sp.gasoline.value, 6);
    expect(item(r, 'vehicle', 'maintenance').amount).toBeCloseTo(r.work.km * 0.25, 6);
    expect(item(r, 'vehicle', 'depreciation').amount).toBeCloseTo(5000 / 12, 6);
    expect(item(r, 'vehicle', 'insurance').amount).toBeCloseTo(2500 / 12, 6);
    expect(item(r, 'vehicle', 'ipva').amount).toBeCloseTo((50000 * sp.ipva.car) / 12, 6);
    expect(item(r, 'vehicle', 'licensing').amount).toBeCloseTo(sp.licensing.value / 12, 6);
    expect(r.vehicle.perKm).toBeCloseTo(r.vehicle.total / r.work.km, 10);
  });

  it('rented car: weekly rent × 52 ÷ 12 plus fuel, and the deposit to start', () => {
    const r = calc(forOccupation('motorista_app', { vehicleOwnership: 'rented', rentWeekly: 700 }));
    expect(item(r, 'vehicle', 'rent').amount).toBeCloseTo((700 * 52) / 12, 6);
    expect(item(r, 'vehicle', 'depreciation')).toBeUndefined();
    expect(item(r, 'vehicle', 'ipva')).toBeUndefined();
    expect(r.investment.items.some((i) => i.id === 'rentalDeposit')).toBe(true);
  });

  it('a manual fuel price replaces the state average', () => {
    const r = calc(forOccupation('entregador_moto', { fuelAuto: false, fuelPrice: 7 }));
    expect(item(r, 'vehicle', 'fuel').amount).toBeCloseTo((r.work.km / r.input.consumption) * 7, 6);
  });

  it('motorcycle IPVA follows the state exemption for small motorcycles', () => {
    expect(services.repositories.regional.state('SP').ipva.moto).toBe(0);
    const r = calc(forOccupation('entregador_moto', { uf: 'SP' }));
    expect(item(r, 'vehicle', 'ipva')).toBeUndefined();
  });
});

describe('Taxes', () => {
  it('MEI pays the DAS of its activities: ISS and ICMS for the driver', () => {
    expect(item(calc(forOccupation('motorista_app', { regime: 'mei' })), 'taxes', 'das').amount).toBe(87.05);
    expect(item(calc(forOccupation('eletricista', { regime: 'mei' })), 'taxes', 'das').amount).toBe(86.05);
  });

  it('MEI: profit up to the presumed share of revenue is exempt', () => {
    const r = calc(forOccupation('eletricista', { regime: 'mei' }));
    expect(r.taxes.meiExempt).toBeCloseTo(r.revenue * 0.32, 6);
    expect(r.taxes.meiTaxable).toBeCloseTo(Math.max(0, r.revenue - r.costs - 86.05 - r.revenue * 0.32), 6);
  });

  it('autônomo: simplified INSS is 11% of the minimum wage; normal is 20% of the base', () => {
    expect(services.taxes.inss({ inssPlan: 'simplified' }, services.occupations.get('eletricista'), 5000).amount).toBeCloseTo(1621 * 0.11, 6);
    expect(services.taxes.inss({ inssPlan: 'full', inssBase: 3000 }, services.occupations.get('eletricista'), 5000).amount).toBeCloseTo(600, 6);
    expect(services.taxes.inss({ inssPlan: 'full', inssBase: 99999 }, services.occupations.get('eletricista'), 5000).base).toBe(8475.55);
  });

  it('driver in the normal plan contributes on at least 20% of the gross fares (Decreto 3.048, art. 214, § 19)', () => {
    const driver = services.occupations.get('motorista_app');
    expect(services.taxes.inss({ inssPlan: 'full', inssBase: 0 }, driver, 10000).base).toBe(2000);
    expect(services.taxes.inss({ inssPlan: 'full', inssBase: 0 }, driver, 5000).base).toBe(1621);
  });

  it('income tax base: 60% for passengers, 10% for cargo, livro-caixa for services', () => {
    const work = { items: [{ id: 'materials', amount: 300 }, { id: 'phone', amount: 60 }, { id: 'replacement', amount: 100 }] };
    expect(services.taxes.taxableIncome(services.occupations.get('motorista_app'), 10000, work).amount).toBe(6000);
    expect(services.taxes.taxableIncome(services.occupations.get('entregador_moto'), 10000, work).amount).toBe(1000);
    // Depreciation (replacement) and transport are not deductible.
    expect(services.taxes.taxableIncome(services.occupations.get('eletricista'), 10000, work).amount).toBe(9640);
  });

  it('income tax: zero up to R$ 5.000 a month, phased out up to R$ 7.350 (Lei 15.270/2025)', () => {
    expect(services.incomeTax.monthly(5000, 0).tax).toBe(0);
    const at6000 = services.incomeTax.monthly(6000, 0);
    expect(at6000.tax).toBeCloseTo(at6000.before - (978.62 - 0.133145 * 6000), 2);
    const at10000 = services.incomeTax.monthly(10000, 0);
    expect(at10000.tax).toBeCloseTo((10000 - 607.2) * 0.275 - 908.73, 2);
  });
});

describe('CLT comparison', () => {
  it('yearly package: 11 net salaries, vacation with 1/3, 13th and FGTS', () => {
    const p = services.clt.package(2000);
    const inss = 1621 * 0.075 + (2000 - 1621) * 0.09;
    expect(p.monthlyNet).toBeCloseTo(2000 - Math.round(inss * 100) / 100, 2);
    expect(p.fgts).toBeCloseTo(2000 * 0.08 * (13 + 1 / 3), 6);
    expect(p.total).toBeCloseTo(p.cash + p.fgts, 6);
    expect(p.hoursPerYear).toBeCloseTo((44 * (365 - 30 - 9)) / 7, 6);
  });

  it('the equivalent salary gives the same yearly amount as the autonomous net', () => {
    const r = calc(forOccupation('encanador'));
    expect(services.clt.package(r.comparison.equivalentSalary).total).toBeCloseTo(r.net * 12, 2);
  });
});

describe('Warnings', () => {
  it('MEI limit: excess up to 20% and above 20%', () => {
    const over = (ticket) => calc(forOccupation('eletricista', { regime: 'mei', ticket, jobsPerDay: 2 })).warnings.map((w) => w.id);
    expect(over(200)).not.toContain('meiLimit');
    // 2027 limit of R$ 110 mil: R$ 300 × 2 × 20,5 days × 12 = R$ 147.600 → more than 20% over.
    expect(over(300)).toContain('meiLimitOver');
    expect(over(250)).toContain('meiLimit');
  });

  it('a cleaner in the same home more than 2 days a week is a domestic employee', () => {
    expect(calc(forOccupation('diarista', { sameHomeOver2Days: true })).warnings.map((w) => w.id)).toContain('domestic');
  });

  it('flags a loss and pay below the minimum wage per hour', () => {
    expect(calc(forOccupation('motorista_app', { earningsPerHour: 15 })).warnings.map((w) => w.id)).toContain('negative');
    expect(calc(forOccupation('motorista_app', { earningsPerHour: 32 })).warnings.map((w) => w.id)).toContain('belowMinimum');
  });
});

describe('Every occupation', () => {
  it.each(services.occupations.list().map((o) => o.id))('%s computes in both regimes and every scenario', (id) => {
    for (const regime of ['mei', 'individual']) {
      for (const scenario of ['low', 'medium', 'high']) {
        const base = forOccupation(id, { regime });
        const r = calc({ ...base, ...services.formDefaults.scenarioPatch(base, scenario) });
        expect(Number.isFinite(r.net)).toBe(true);
        expect(Number.isFinite(r.comparison.equivalentSalary)).toBe(true);
        expect(r.revenue).toBeGreaterThan(0);
      }
    }
  });

  it('medium scenario nets more than the minimum wage per hour and less than R$ 60', () => {
    for (const o of services.occupations.list()) {
      const r = calc(forOccupation(o.id));
      expect(r.netPerHour).toBeGreaterThan(1621 / 220);
      expect(r.netPerHour).toBeLessThan(60);
    }
  });
});

describe('Form state', () => {
  it('restores a saved form, replacing unknown occupations and states', () => {
    const restored = services.formState.restore({ occupationId: 'astronauta', uf: 'XX', hoursPerDay: 'dez' });
    expect(restored.occupationId).toBe(defaults.occupationId);
    expect(restored.uf).toBe(defaults.uf);
    expect(restored.hoursPerDay).toBe(defaults.hoursPerDay);
  });

  it('keeps valid saved items and rebuilds the list for the occupation', () => {
    const saved = { ...forOccupation('eletricista'), items: { nr10: { on: false, qty: 1, unitCost: 300 }, ghost: { on: true, qty: 1, unitCost: 1 } } };
    const restored = services.formState.restore(saved);
    expect(restored.items.nr10).toEqual({ on: false, qty: 1, unitCost: 300 });
    expect(restored.items.ghost).toBeUndefined();
    expect(Object.keys(restored.items)).toEqual(services.occupations.get('eletricista').items.map((i) => i.id));
  });
});

describe('Reference dates', () => {
  it.each(['2026-01-15', '2026-11-25', '2027-03-01', '2028-06-01'])('computes on %s', (date) => {
    const s = createWorkServices(workDatabase, date);
    const r = s.calculator.calculate(s.formDefaults.defaults());
    expect(Number.isFinite(r.net)).toBe(true);
  });
});
