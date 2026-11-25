import BusinessStep from '../steps/business/BusinessStep.jsx';
import LegalStep from '../steps/legal/LegalStep.jsx';
import PlaceStep from '../steps/place/PlaceStep.jsx';
import ResultStep from '../steps/result/ResultStep.jsx';
import SalesStep from '../steps/sales/SalesStep.jsx';
import SetupStep from '../steps/setup/SetupStep.jsx';
import TeamStep from '../steps/team/TeamStep.jsx';

// Add, remove or reorder steps here; titles and intros live in form-text.json (steps.<id>).
export const STEPS = [
  { id: 'business', Component: BusinessStep },
  { id: 'place', Component: PlaceStep },
  { id: 'setup', Component: SetupStep },
  { id: 'legal', Component: LegalStep },
  { id: 'team', Component: TeamStep },
  { id: 'sales', Component: SalesStep },
  { id: 'result', Component: ResultStep, isResult: true },
];
