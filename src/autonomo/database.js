// Data of the autonomous-work calculator. National tables (minimum wage, MEI, states) come from
// the shared database; texts, sources and the per-state vehicle costs are its own.
import shared from '../repositories/database.js';
import content from '../db/autonomo/content.json';
import formText from '../db/autonomo/form-text.json';
import meta from '../db/autonomo/meta.json';
import occupations from '../db/autonomo/occupations.json';
import regional from '../db/autonomo/regional.json';
import reference from '../db/autonomo/reference.json';
import sources from '../db/autonomo/sources.json';

export const workDatabase = {
  meta,
  occupations,
  regional,
  workReference: reference,
  reference: shared.reference,
  locations: shared.locations,
  // Source links resolve in both lists; the page lists only its own groups.
  sources: { sources: [...shared.sources.sources, ...sources.sources], groups: sources.groups },
  // Shared labels (navigation, footer, value kinds) with this page's texts on top.
  content: { ...content, labels: { ...shared.content.labels, ...content.labels } },
  formText,
};
