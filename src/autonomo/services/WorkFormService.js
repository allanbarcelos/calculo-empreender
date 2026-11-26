import { FUEL_TYPES } from './VehicleService.js';

// Initial form values and the restoration of a form saved in an earlier visit.
export class WorkFormDefaultsService {
  constructor({ occupationService, workReferenceRepository, referenceRepository, locationRepository }) {
    this.occupations = occupationService;
    this.reference = workReferenceRepository;
    this.national = referenceRepository;
    this.locations = locationRepository;
  }

  issFor(occupation) {
    return occupation.tax.issApplies === false ? 0 : this.reference.iss().monthly;
  }

  defaults() {
    const work = this.reference.workDefaults();
    const first = this.occupations.list()[0];
    return {
      uf: this.locations.defaultState(),
      scenario: 'medium',
      vacationDays: work.vacationDays,
      idleDays: work.idleDays,
      capitalPct: Math.round(this.reference.vehicles().capitalRate * 10000) / 100,
      fuelType: 'gasoline',
      fuelAuto: true,
      fuelPrice: 0,
      transitAuto: true,
      transitDaily: 0,
      otherInitial: 0,
      inssPlan: 'simplified',
      inssBase: this.national.minimumWage(),
      ...this.occupations.patch(first.id, 'medium'),
      issMonthly: this.issFor(first),
    };
  }

  // Changing the occupation keeps the state and personal choices and reloads its figures.
  occupationPatch(data, id) {
    return { ...this.occupations.patch(id, data.scenario ?? 'medium'), issMonthly: this.issFor(this.occupations.get(id)) };
  }

  scenarioPatch(data, scenario) {
    return this.occupations.scenarioPatch(this.occupations.get(data.occupationId), scenario);
  }

  vehiclePatch(data, type) {
    return this.occupations.vehiclePatch(this.occupations.get(data.occupationId), type);
  }
}

export class WorkFormStateService {
  constructor({ formDefaultsService, occupationService, locationRepository }) {
    this.formDefaults = formDefaultsService;
    this.occupations = occupationService;
    this.locations = locationRepository;
  }

  sanitize(stored, defaults) {
    const data = { ...defaults };
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return data;
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = stored[key];
      if (typeof value !== typeof fallback || value === null) continue;
      if (typeof value === 'number' && !Number.isFinite(value)) continue;
      data[key] = value;
    }
    return data;
  }

  restore(stored) {
    const defaults = this.formDefaults.defaults();
    let data = this.sanitize(stored, defaults);
    if (!this.occupations.list().some((o) => o.id === data.occupationId)) {
      data = { ...data, ...this.formDefaults.occupationPatch(data, defaults.occupationId) };
    }
    if (!this.locations.state(data.uf)) data.uf = defaults.uf;
    if (!FUEL_TYPES.includes(data.fuelType)) data.fuelType = defaults.fuelType;
    const occupation = this.occupations.get(data.occupationId);
    data.items = Object.fromEntries(Object.entries(this.occupations.itemDefaults(occupation)).map(([id, item]) => {
      const s = data.items?.[id];
      const valid = s && typeof s.on === 'boolean' && Number.isFinite(s.qty) && Number.isFinite(s.unitCost);
      return [id, valid ? s : item];
    }));
    return data;
  }
}
