// Brings form data saved in an earlier visit in line with today's database: wrong types fall
// back to defaults, a business, state or city that no longer exists is replaced, and the
// equipment list follows the business catalogue.
export class FormStateService {
  constructor({ formDefaultsService, businessService, locationRepository }) {
    this.formDefaults = formDefaultsService;
    this.businesses = businessService;
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

  equipment(business, saved) {
    const defaults = this.businesses.equipmentDefaults(business);
    return Object.fromEntries(Object.entries(defaults).map(([id, item]) => {
      const s = saved?.[id];
      const valid = s && typeof s.on === 'boolean' && Number.isFinite(s.qty) && Number.isFinite(s.unitCost);
      return [id, valid ? s : item];
    }));
  }

  restore(stored) {
    const defaults = this.formDefaults.defaults();
    let data = this.sanitize(stored, defaults);
    if (!this.businesses.list().some((b) => b.id === data.businessId)) {
      data = { ...data, ...this.formDefaults.businessPatch(data, defaults.businessId) };
    }
    if (!this.locations.state(data.uf)) data = { ...data, uf: defaults.uf, cityId: '' };
    if (data.cityId && data.cityId !== 'interior' && !this.locations.cities(data.uf).some((c) => c.id === data.cityId)) data.cityId = '';
    data.equipment = this.equipment(this.businesses.get(data.businessId), data.equipment);
    return data;
  }
}
