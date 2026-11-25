import { useServices } from '../../hooks/useServices.js';
import { formatDate } from '../../lib/format.js';

export default function Hero() {
  const { referenceDate, repositories } = useServices();
  const label = (id) => repositories.content.label(id);
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">{label('heroEyebrow')} {formatDate(referenceDate)}</p>
        <h1>{label('heroTitle')}</h1>
        <p className="lead">{label('heroLead')}</p>
      </div>
    </section>
  );
}
