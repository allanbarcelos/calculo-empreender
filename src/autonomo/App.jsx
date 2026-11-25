import Hero from '../components/layout/Hero.jsx';
import MethodSection from '../components/layout/MethodSection.jsx';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import SourcesSection from '../components/layout/SourcesSection.jsx';
import Wizard from '../features/wizard/Wizard.jsx';
import { useServices } from '../hooks/useServices.js';
import WorkSummary from './steps/WorkSummary.jsx';
import { WORK_STEPS } from './steps/steps.js';

export const STORAGE_KEY = 'calculo-autonomo:v1';

export default function App() {
  const { meta } = useServices();
  return (
    <>
      <SiteHeader siteName={meta.siteName} />
      <main id="topo">
        <Hero />
        <Wizard stepList={WORK_STEPS} storageKey={STORAGE_KEY} Summary={WorkSummary} />
        <MethodSection />
        <SourcesSection />
      </main>
      <SiteFooter />
    </>
  );
}
