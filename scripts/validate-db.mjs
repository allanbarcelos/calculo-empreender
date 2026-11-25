// Validates the JSON database before every build: dates, references, value kinds and the
// tables every state and business needs. Also lists rules that end soon (does not fail).
// Usage: node scripts/validate-db.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_DIR = join(import.meta.dirname, '..', 'src', 'db');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_LINK = /\(source:([\w-]+)\)/g;
const KINDS = new Set(['official', 'market', 'estimate']);

const db = Object.fromEntries(
  readdirSync(DB_DIR).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(readFileSync(join(DB_DIR, f), 'utf8'))]),
);

const errors = [];
const sourceIds = new Set(db['sources.json'].sources.map((s) => s.id));
const calloutIds = new Set(db['content.json'].callouts.map((c) => c.id));

function walk(node, path) {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const here = `${path}.${key}`;
      if ((key === 'validFrom' || key === 'validTo') && !ISO_DATE.test(value)) errors.push(`${here}: "${value}" is not YYYY-MM-DD`);
      if (key === 'source' && typeof value === 'string' && !sourceIds.has(value)) errors.push(`${here}: unknown source "${value}"`);
      if (key === 'kind' && path.match(/(rent|energy|junta|firefighters|license|sanitary|water|equipment\[\d+\]|accounting|digitalCertificate|trademark|openingService|cardFees)/) && !KINDS.has(value)) errors.push(`${here}: kind must be official, market or estimate`);
      if (key === 'callout' && !calloutIds.has(value)) errors.push(`${here}: unknown callout "${value}"`);
      walk(value, here);
    }
    if (node.validFrom && node.validTo && node.validFrom > node.validTo) errors.push(`${path}: validFrom is after validTo`);
    return;
  }
  if (typeof node === 'string') {
    for (const [, id] of node.matchAll(SOURCE_LINK)) if (!sourceIds.has(id)) errors.push(`${path}: unknown source link "${id}"`);
  }
}
for (const [file, data] of Object.entries(db)) walk(data, file);

for (const s of db['sources.json'].sources) if (!/^https?:\/\//.test(s.url)) errors.push(`sources.json ${s.id}: url must be http(s)`);
for (const g of db['sources.json'].groups) for (const id of g.ids) if (!sourceIds.has(id)) errors.push(`sources.json group "${g.title}": unknown source "${id}"`);

// Locations: every state has its costs and a capital with municipal costs.
const loc = db['locations.json'];
const cityIds = new Set(loc.cities.map((c) => c.id));
for (const s of loc.states) {
  if (!cityIds.has(s.capital)) errors.push(`locations.json ${s.uf}: capital "${s.capital}" not in cities`);
  if (!loc.stateCosts.some((c) => c.uf === s.uf)) errors.push(`locations.json ${s.uf}: no stateCosts`);
  if (!loc.cityCosts.some((c) => c.city === s.capital)) errors.push(`locations.json ${s.uf}: no cityCosts for the capital`);
  if (!(s.interiorRentFactor > 0 && s.interiorRentFactor <= 1)) errors.push(`locations.json ${s.uf}: interiorRentFactor out of (0, 1]`);
}
for (const c of loc.cityCosts) if (!(c.rent.value > 0)) errors.push(`locations.json ${c.city}: rent must be positive`);
for (const c of loc.stateCosts) if (!(c.energy.value > 0)) errors.push(`locations.json ${c.uf}: energy tariff must be positive`);

// Businesses: unique ids, sources, a complete revenue model and a Simples annex that exists.
const annexes = new Set(Object.keys(db['reference.json'].simples.at(-1).annexes));
const ids = new Set();
for (const b of db['businesses.json'].businesses) {
  if (ids.has(b.id)) errors.push(`businesses.json: duplicate id "${b.id}"`);
  ids.add(b.id);
  for (const id of b.sources) if (!sourceIds.has(id)) errors.push(`businesses.json ${b.id}: unknown source "${id}"`);
  if (!annexes.has(b.tax.simplesAnnex)) errors.push(`businesses.json ${b.id}: Simples annex "${b.tax.simplesAnnex}" not in reference.json`);
  for (const s of ['low', 'medium', 'high']) if (!(b.revenue.customersPerDay[s] > 0)) errors.push(`businesses.json ${b.id}: customersPerDay.${s} missing`);
  if (!(b.revenue.cmvRate >= 0 && b.revenue.cmvRate < 1)) errors.push(`businesses.json ${b.id}: cmvRate must be in [0, 1)`);
  const eq = new Set();
  for (const e of b.equipment) {
    if (eq.has(e.id)) errors.push(`businesses.json ${b.id}: duplicate equipment "${e.id}"`);
    eq.add(e.id);
    if (!(e.unitCost >= 0 && e.qty >= 0)) errors.push(`businesses.json ${b.id}.${e.id}: invalid qty or unitCost`);
  }
}

if (errors.length) {
  console.error(`Database validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Database OK: ${Object.keys(db).length} files, ${sourceIds.size} sources, ${ids.size} businesses, ${loc.states.length} states.`);

// Freshness: single-value tables whose latest version ends within 60 days.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const horizon = new Date(Date.parse(today) + 60 * 86_400_000).toISOString().slice(0, 10);
const stale = [];
for (const [table, versions] of Object.entries(db['reference.json'])) {
  const latest = [...versions].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).at(-1);
  if (latest.validTo && latest.validTo <= horizon) stale.push(`reference.json ${table}: ends ${latest.validTo}`);
}
if (stale.length) console.warn(`To renew, as of ${today}:\n- ${stale.join('\n- ')}`);
