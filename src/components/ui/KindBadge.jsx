import { useServices } from '../../hooks/useServices.js';

// Where a value comes from: an official table, a market average or our own estimate.
export default function KindBadge({ kind }) {
  const content = useServices().repositories.content;
  if (!kind) return null;
  const label = content.label(`kind_${kind}`);
  return <span className={`tag tag--${kind}`} title={content.label(`kindHelp_${kind}`)}>{label}</span>;
}
