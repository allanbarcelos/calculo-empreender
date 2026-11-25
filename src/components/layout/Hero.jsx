import { useServices } from '../../hooks/useServices.js';
import { formatDate } from '../../lib/format.js';
import { linkHref } from '../../lib/links.js';

export default function Hero() {
  const { referenceDate, repositories, meta } = useServices();
  const cross = meta.crossLink;
  const label = (id) => repositories.content.label(id);
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">{label('heroEyebrow')} {formatDate(referenceDate)}</p>
        <h1>{label('heroTitle')}</h1>
        <p className="lead">{label('heroLead')}</p>
        {cross && (
          <p className="hero__cross">
            {cross.text} <a href={linkHref(cross)}>{cross.linkLabel} →</a>
          </p>
        )}
      </div>
    </section>
  );
}
