import { VersionedRepository } from './VersionedRepository.js';

// National references: tax regimes (MEI, Simples Nacional), market prices of services and the
// assumptions of the projection.
export class ReferenceRepository extends VersionedRepository {
  minimumWage() { return this.version('minimumWage').value; }
  mei() { return this.version('mei'); }
  simples() { return this.version('simples'); }
  proLabore() { return this.version('proLabore'); }
  accounting() { return this.version('accounting'); }
  digitalCertificate() { return this.version('digitalCertificate'); }
  trademark() { return this.version('trademark'); }
  openingService() { return this.version('openingService'); }
  cardFees() { return this.version('cardFees'); }
  projection() { return this.version('projection'); }
  payrollReference() { return this.version('payrollReference'); }
}
