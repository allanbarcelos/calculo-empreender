// Occupations and the form values each one pre-fills (all editable). Rates are stored in the
// database as fractions and in the form as percentages, like the business calculator.
export const VEHICLE_TYPES = ['car', 'moto', 'bike', 'transit', 'none'];
export const MOTOR_VEHICLES = ['car', 'moto'];
const pct = (v) => Math.round((v ?? 0) * 10000) / 100;

export class OccupationService {
  constructor(occupationRepository, workReferenceRepository) {
    this.occupations = occupationRepository;
    this.reference = workReferenceRepository;
  }

  list() { return this.occupations.list(); }
  get(id) { return this.occupations.get(id) ?? this.list()[0]; }
  scenarios() { return this.occupations.scenarios(); }

  pick(range, scenario) {
    if (range === undefined || range === null) return 0;
    return typeof range === 'number' ? range : (range[scenario] ?? range.medium);
  }

  // Tools, courses and gear: essential ones start selected.
  itemDefaults(occupation) {
    return Object.fromEntries(occupation.items.map((i) => [i.id, { on: i.essential !== false, qty: i.qty, unitCost: i.unitCost }]));
  }

  // Rows merging the catalogue with what the user changed. Items with a useful life are
  // replaced over time: their cost spread over the months of that life is a monthly cost.
  items(occupation, saved = {}) {
    return occupation.items.map((i) => {
      const chosen = saved[i.id] ?? { on: i.essential !== false, qty: i.qty, unitCost: i.unitCost };
      const total = chosen.on ? chosen.qty * chosen.unitCost : 0;
      return { ...i, on: Boolean(chosen.on), qty: chosen.qty, unitCost: chosen.unitCost, total, monthly: i.lifeYears ? total / (i.lifeYears * 12) : 0 };
    });
  }

  // Values of a vehicle type from the national references, with the occupation's overrides.
  vehiclePatch(occupation, type) {
    const v = this.reference.vehicles()[type] ?? {};
    const own = occupation.vehicle?.overrides?.[type] ?? {};
    const value = { ...v, ...own };
    return {
      vehicleType: type,
      vehicleOwnership: value.ownership ?? 'own',
      vehicleValue: value.value ?? 0,
      rentWeekly: value.rentWeekly ?? 0,
      consumption: value.consumption ?? 0,
      maintenancePerKm: value.maintenancePerKm ?? 0,
      insurancePct: pct(value.insuranceRate),
      depreciationPct: pct(value.depreciationRate),
    };
  }

  scenarioPatch(occupation, scenario) {
    const w = occupation.work;
    return occupation.model === 'hourly'
      ? { scenario, earningsPerHour: this.pick(w.earningsPerHour, scenario) }
      : { scenario, ticket: this.pick(w.ticket, scenario), jobsPerDay: this.pick(w.jobsPerDay, scenario) };
  }

  patch(id, scenario = 'medium') {
    const o = this.get(id);
    const w = o.work;
    return {
      occupationId: o.id,
      earningsPerHour: 0,
      ticket: 0,
      jobsPerDay: 0,
      ...this.scenarioPatch(o, scenario),
      hoursPerDay: w.hoursPerDay,
      daysPerMonth: w.daysPerMonth,
      kmPerUnit: w.kmPerUnit ?? 0,
      ...this.vehiclePatch(o, o.vehicle.type),
      faresPerDay: o.vehicle.faresPerDay ?? 2,
      phoneMonthly: o.costs.phoneMonthly,
      materialsPct: pct(o.costs.materialsRate),
      platformFeePct: pct(o.costs.platformFeeRate),
      leadCostMonthly: o.costs.leadCostMonthly ?? 0,
      items: this.itemDefaults(o),
      regime: o.tax.meiAllowed ? 'mei' : 'individual',
      cltSalary: o.clt.salary,
      sameHomeOver2Days: false,
    };
  }
}
