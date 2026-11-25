// Composition root: wires repositories and services for one reference date.
import { BusinessRepository } from '../repositories/BusinessRepository.js';
import { ContentRepository } from '../repositories/ContentRepository.js';
import { FormTextRepository } from '../repositories/FormTextRepository.js';
import { LocationRepository } from '../repositories/LocationRepository.js';
import { ReferenceRepository } from '../repositories/ReferenceRepository.js';
import { SourceRepository } from '../repositories/SourceRepository.js';
import { BusinessService } from './BusinessService.js';
import { Calculator } from './Calculator.js';
import { FormDefaultsService } from './FormDefaultsService.js';
import { FormStateService } from './FormStateService.js';
import { InvestmentService } from './InvestmentService.js';
import { LocationService } from './LocationService.js';
import { OperatingService } from './OperatingService.js';
import { ProjectionService } from './ProjectionService.js';
import { TaxService } from './TaxService.js';

export function createServices(database, referenceDate) {
  const locationRepository = new LocationRepository(database.locations, referenceDate);
  const businessRepository = new BusinessRepository(database.businesses, referenceDate);
  const referenceRepository = new ReferenceRepository(database.reference, referenceDate);
  const sourceRepository = new SourceRepository(database.sources, referenceDate);
  const contentRepository = new ContentRepository(database.content, referenceDate);
  const formTextRepository = new FormTextRepository(database.formText, referenceDate);

  const locationService = new LocationService(locationRepository);
  const businessService = new BusinessService(businessRepository);
  const taxService = new TaxService(referenceRepository);
  const operatingService = new OperatingService(referenceRepository, taxService);
  const investmentService = new InvestmentService(referenceRepository, businessService);
  const projectionService = new ProjectionService(referenceRepository, operatingService);
  const calculator = new Calculator({ locationService, businessService, operatingService, investmentService, projectionService, taxService, referenceRepository });
  const formDefaultsService = new FormDefaultsService({ businessService, locationRepository, referenceRepository });

  return {
    meta: database.meta,
    referenceDate,
    repositories: {
      locations: locationRepository,
      businesses: businessRepository,
      reference: referenceRepository,
      sources: sourceRepository,
      content: contentRepository,
      formText: formTextRepository,
    },
    locations: locationService,
    businesses: businessService,
    taxes: taxService,
    operating: operatingService,
    investments: investmentService,
    projections: projectionService,
    calculator,
    formDefaults: formDefaultsService,
    formState: new FormStateService({ formDefaultsService, businessService, locationRepository }),
  };
}
