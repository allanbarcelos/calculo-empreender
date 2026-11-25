import { VersionedRepository } from './VersionedRepository.js';

// States, cities and the costs that depend on where the business opens: commercial rent,
// electricity and water tariffs, and the state and municipal registration fees.
export class LocationRepository extends VersionedRepository {
  states() { return this.collection('states', 'uf').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); }
  state(uf) { return this.states().find((s) => s.uf === uf) ?? null; }
  defaultState() { return this.section.defaultState; }

  cities(uf) { return this.collection('cities').filter((c) => c.uf === uf); }
  city(id) { return this.collection('cities').find((c) => c.id === id) ?? null; }

  // State-level costs (energy tariff, Junta Comercial, fire department).
  stateCosts(uf) { return this.collection('stateCosts', 'uf').find((s) => s.uf === uf) ?? null; }

  // Municipal costs of a city (rent, business license, sanitary licence).
  cityCosts(id) { return this.collection('cityCosts', 'city').find((c) => c.city === id) ?? null; }

  water() { return this.version('water'); }
}
