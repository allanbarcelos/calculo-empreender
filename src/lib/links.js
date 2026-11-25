// Links between the site's pages and to the sister calculators. A link to another page of this
// build carries a path relative to the site root; an external one carries a full url.
export function linkHref(link) {
  return link.url ?? `${import.meta.env.BASE_URL}${link.path}`;
}
