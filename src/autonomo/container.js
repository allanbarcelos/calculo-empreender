// Composition root of the autonomous-work calculator. It reuses the shared repositories
// (versioning, locations, national references, sources and texts) and wires its own services;
// the business calculator's services are not involved.
import { ContentRepository } from '../repositories/ContentRepository.js';
import { FormTextRepository } from '../repositories/FormTextRepository.js';
import { LocationRepository } from '../repositories/LocationRepository.js';
import { ReferenceRepository } from '../repositories/ReferenceRepository.js';
import { SourceRepository } from '../repositories/SourceRepository.js';
import { OccupationRepository } from './repositories/OccupationRepository.js';
import { RegionalCostRepository } from './repositories/RegionalCostRepository.js';
import { WorkReferenceRepository } from './repositories/WorkReferenceRepository.js';
import { CltComparisonService } from './services/CltComparisonService.js';
import { IncomeTaxService } from './services/IncomeTaxService.js';
import { OccupationService } from './services/OccupationService.js';
import { VehicleService } from './services/VehicleService.js';
import { WorkCalculator } from './services/WorkCalculator.js';
import { WorkCostService } from './services/WorkCostService.js';
import { WorkFormDefaultsService, WorkFormStateService } from './services/WorkFormService.js';
import { WorkloadService } from './services/WorkloadService.js';
import { WorkTaxService } from './services/WorkTaxService.js';

export function createWorkServices(database, referenceDate) {
  const locationRepository = new LocationRepository(database.locations, referenceDate);
  const referenceRepository = new ReferenceRepository(database.reference, referenceDate);
  const workReferenceRepository = new WorkReferenceRepository(database.workReference, referenceDate);
  const occupationRepository = new OccupationRepository(database.occupations, referenceDate);
  const regionalCostRepository = new RegionalCostRepository(database.regional, referenceDate);
  const sourceRepository = new SourceRepository(database.sources, referenceDate);
  const contentRepository = new ContentRepository(database.content, referenceDate);
  const formTextRepository = new FormTextRepository(database.formText, referenceDate);

  const occupationService = new OccupationService(occupationRepository, workReferenceRepository);
  const workloadService = new WorkloadService();
  const vehicleService = new VehicleService(regionalCostRepository);
  const workCostService = new WorkCostService(occupationService);
  const incomeTaxService = new IncomeTaxService(workReferenceRepository);
  const workTaxService = new WorkTaxService({ workReferenceRepository, referenceRepository, incomeTaxService });
  const cltComparisonService = new CltComparisonService({ workReferenceRepository, incomeTaxService });
  const calculator = new WorkCalculator({ occupationService, workloadService, vehicleService, workCostService, workTaxService, cltComparisonService, workReferenceRepository, referenceRepository });
  const formDefaultsService = new WorkFormDefaultsService({ occupationService, workReferenceRepository, referenceRepository, locationRepository });

  return {
    meta: database.meta,
    referenceDate,
    repositories: {
      locations: locationRepository,
      reference: referenceRepository,
      workReference: workReferenceRepository,
      occupations: occupationRepository,
      regional: regionalCostRepository,
      sources: sourceRepository,
      content: contentRepository,
      formText: formTextRepository,
    },
    occupations: occupationService,
    workload: workloadService,
    vehicles: vehicleService,
    workCosts: workCostService,
    incomeTax: incomeTaxService,
    taxes: workTaxService,
    clt: cltComparisonService,
    calculator,
    formDefaults: formDefaultsService,
    formState: new WorkFormStateService({ formDefaultsService, occupationService, locationRepository }),
  };
}
