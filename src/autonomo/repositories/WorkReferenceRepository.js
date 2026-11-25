import { VersionedRepository } from '../../repositories/VersionedRepository.js';

// National references of autonomous work: vehicles, phone, INSS of the contribuinte individual,
// income tax (carnê-leão), the MEI exempt profit and the CLT package used in the comparison.
export class WorkReferenceRepository extends VersionedRepository {
  workDefaults() { return this.version('workDefaults'); }
  vehicles() { return this.version('vehicles'); }
  phone() { return this.version('phone'); }
  inssIndividual() { return this.version('inssIndividual'); }
  incomeTax() { return this.version('incomeTax'); }
  meiProfit() { return this.version('meiProfit'); }
  clt() { return this.version('clt'); }
  iss() { return this.version('iss'); }
}
