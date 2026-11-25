import { VersionedRepository } from './VersionedRepository.js';

// Business types with their equipment, fit-out, operating figures and revenue model.
export class BusinessRepository extends VersionedRepository {
  list() { return this.collection('businesses'); }

  get(id) {
    const list = this.list();
    return list.find((b) => b.id === id) ?? null;
  }

  scenarios() { return this.section.scenarios; }
}
