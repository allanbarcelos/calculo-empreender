import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ServicesProvider from './context/ServicesProvider.jsx';
import { resolveReferenceDate, todayInBrazil } from './lib/referenceDate.js';

// Mounts one calculator page. Repositories throw when a table has no version for the date; running
// the default form once surfaces that here instead of during render, and a ?data= outside the
// dates the database covers falls back to today instead of a blank page.
export function mount({ createServices, database, App }) {
  const checked = (date) => {
    const services = createServices(database, date);
    services.calculator.calculate(services.formDefaults.defaults());
    return services;
  };
  const servicesFor = (search) => {
    const requested = resolveReferenceDate(search);
    try {
      return checked(requested);
    } catch (error) {
      const today = todayInBrazil();
      if (requested === today) throw error;
      console.warn(`Sem regras para ${requested}; usando ${today}.`, error);
      return checked(today);
    }
  };

  const root = createRoot(document.getElementById('root'));
  try {
    const services = servicesFor(window.location.search);
    root.render(
      <StrictMode>
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>
      </StrictMode>,
    );
  } catch (error) {
    console.error(error);
    root.render(
      <main className="container">
        <h1>Não foi possível carregar a calculadora</h1>
        <p>Recarregue a página. Se o problema continuar, tente mais tarde.</p>
      </main>,
    );
  }
}
