import CltStep from './CltStep.jsx';
import CostsStep from './CostsStep.jsx';
import OccupationStep from './OccupationStep.jsx';
import TaxStep from './TaxStep.jsx';
import VehicleStep from './VehicleStep.jsx';
import WorkResultStep from './WorkResultStep.jsx';
import WorkStep from './WorkStep.jsx';

// Titles and intros live in db/autonomo/form-text.json (steps.<id>).
export const WORK_STEPS = [
  { id: 'occupation', Component: OccupationStep },
  { id: 'work', Component: WorkStep },
  { id: 'vehicle', Component: VehicleStep },
  { id: 'costs', Component: CostsStep },
  { id: 'taxes', Component: TaxStep },
  { id: 'clt', Component: CltStep },
  { id: 'result', Component: WorkResultStep, isResult: true },
];
