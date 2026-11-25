import { fillTemplate } from '../lib/template.js';
import { useServices } from './useServices.js';

// Labels of the breakdown groups and items (content.json → breakdown).
export function useLabels() {
  const { repositories } = useServices();
  return {
    group: (id) => repositories.content.breakdownGroup(id),
    item: (item) => item.label ?? fillTemplate(repositories.content.breakdownItem(item.labelKey ?? item.id), item.params),
    label: (id, vars) => fillTemplate(repositories.content.label(id), vars),
  };
}
