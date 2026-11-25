import { VersionedRepository } from '../../repositories/VersionedRepository.js';

// Per state: fuel price (ANP), IPVA rates, vehicle licensing fee and the capital's bus fare.
export class RegionalCostRepository extends VersionedRepository {
  state(uf) { return this.collection('states', 'uf').find((s) => s.uf === uf) ?? null; }
  national() { return this.version('national'); }
}
