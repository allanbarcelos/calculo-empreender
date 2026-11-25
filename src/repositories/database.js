// The only module that knows where the data lives. Swap it (API, CMS, test fixture)
// without touching repositories or services.
import businesses from '../db/businesses.json';
import content from '../db/content.json';
import formText from '../db/form-text.json';
import locations from '../db/locations.json';
import meta from '../db/meta.json';
import reference from '../db/reference.json';
import sources from '../db/sources.json';

export const jsonDatabase = { meta, businesses, locations, reference, sources, content, formText };
export default jsonDatabase;
