import { VersionedRepository } from '../../repositories/VersionedRepository.js';

// Autonomous occupations without premises: how they earn, what they spend and how they are taxed.
export class OccupationRepository extends VersionedRepository {
  list() { return this.collection('occupations'); }
  get(id) { return this.list().find((o) => o.id === id) ?? null; }
  scenarios() { return this.section.scenarios; }
}
