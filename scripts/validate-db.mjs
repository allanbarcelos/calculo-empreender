// Validates the JSON database before every build: dates, references, value kinds and the
// tables every state and business needs. Also lists rules that end soon (does not fail).
// Usage: node scripts/validate-db.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_DIR = join(import.meta.dirname, '..', 'src', 'db');
const WORK_DIR = join(DB_DIR, 'autonomo');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_LINK = /\(source:([\w-]+)\)/g;
const KINDS = new Set(['official', 'market', 'estimate']);

const readDir = (dir) => Object.fromEntries(
  readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(readFileSync(join(dir, f), 'utf8'))]),
);
const db = readDir(DB_DIR);
const work = readDir(WORK_DIR);

const errors = [];
const mainSourceIds = new Set(db['sources.json'].sources.map((s) => s.id));
const workSourceIds = new Set(work['sources.json'].sources.map((s) => s.id));
for (const id of workSourceIds) if (mainSourceIds.has(id)) errors.push(`autonomo/sources.json: id "${id}" also in sources.json`);
// Each page resolves links against its own sources; the autonomous page also sees the shared ones.
let sourceIds = mainSourceIds;
let calloutIds = new Set(db['content.json'].callouts.map((c) => c.id));

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
sourceIds = new Set([...mainSourceIds, ...workSourceIds]);
calloutIds = new Set(work['content.json'].callouts.map((c) => c.id));
for (const [file, data] of Object.entries(work)) walk(data, `autonomo/${file}`);

for (const s of [...db['sources.json'].sources, ...work['sources.json'].sources]) if (!/^https?:\/\//.test(s.url)) errors.push(`sources ${s.id}: url must be http(s)`);
for (const g of db['sources.json'].groups) for (const id of g.ids) if (!mainSourceIds.has(id)) errors.push(`sources.json group "${g.title}": unknown source "${id}"`);
for (const g of work['sources.json'].groups) for (const id of g.ids) if (!workSourceIds.has(id)) errors.push(`autonomo/sources.json group "${g.title}": unknown source "${id}"`);

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

// Autonomous work: every state has vehicle costs, every occupation a complete model.
const regionalUfs = new Set(work['regional.json'].states.map((s) => s.uf));
for (const s of loc.states) if (!regionalUfs.has(s.uf)) errors.push(`autonomo/regional.json: no costs for ${s.uf}`);
for (const s of work['regional.json'].states) {
  if (!(s.gasoline.value > 0)) errors.push(`autonomo/regional.json ${s.uf}: gasoline must be positive`);
  if (!(s.ethanol?.value > 0 && s.ethanol.value < s.gasoline.value)) errors.push(`autonomo/regional.json ${s.uf}: ethanol must be positive and below gasoline`);
  if (!(s.ipva.car >= 0 && s.ipva.car < 0.1 && s.ipva.moto >= 0 && s.ipva.moto < 0.1)) errors.push(`autonomo/regional.json ${s.uf}: IPVA rate out of range`);
  if (!(s.busFare.value > 0)) errors.push(`autonomo/regional.json ${s.uf}: bus fare must be positive`);
}
const workCallouts = new Set(work['content.json'].callouts.map((c) => c.id));
const vehicles = work['reference.json'].vehicles.at(-1);
const occIds = new Set();
for (const o of work['occupations.json'].occupations) {
  if (occIds.has(o.id)) errors.push(`autonomo/occupations.json: duplicate id "${o.id}"`);
  occIds.add(o.id);
  for (const id of o.sources) if (!sourceIds.has(id)) errors.push(`autonomo/occupations.json ${o.id}: unknown source "${id}"`);
  for (const id of o.callouts ?? []) if (!workCallouts.has(id)) errors.push(`autonomo/occupations.json ${o.id}: unknown callout "${id}"`);
  if (!['hourly', 'jobs'].includes(o.model)) errors.push(`autonomo/occupations.json ${o.id}: model must be hourly or jobs`);
  const ranges = o.model === 'hourly' ? [o.work.earningsPerHour] : [o.work.ticket, o.work.jobsPerDay];
  for (const r of ranges) if (!(typeof r === 'number' ? r > 0 : ['low', 'medium', 'high'].every((k) => r?.[k] > 0))) errors.push(`autonomo/occupations.json ${o.id}: revenue range incomplete`);
  for (const v of o.vehicle.options) if (!(v in vehicles)) errors.push(`autonomo/occupations.json ${o.id}: vehicle "${v}" not in reference.json`);
  if (!o.vehicle.options.includes(o.vehicle.type)) errors.push(`autonomo/occupations.json ${o.id}: default vehicle not in options`);
  if (!['passengers', 'cargo', 'bookkeeping'].includes(o.tax.incomeTaxBase)) errors.push(`autonomo/occupations.json ${o.id}: unknown incomeTaxBase`);
  if (!(o.tax.meiPresumption in work['reference.json'].meiProfit.at(-1).presumption)) errors.push(`autonomo/occupations.json ${o.id}: unknown meiPresumption`);
  if (!KINDS.has(o.clt.kind) || !KINDS.has(o.work.kind)) errors.push(`autonomo/occupations.json ${o.id}: kind must be official, market or estimate`);
  for (const i of o.items) {
    if (!KINDS.has(i.kind)) errors.push(`autonomo/occupations.json ${o.id}.${i.id}: kind must be official, market or estimate`);
    if (!(i.unitCost >= 0 && i.qty >= 0)) errors.push(`autonomo/occupations.json ${o.id}.${i.id}: invalid qty or unitCost`);
  }
}

if (errors.length) {
  console.error(`Database validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Database OK: ${Object.keys(db).length + Object.keys(work).length} files, ${sourceIds.size} sources, ${ids.size} businesses, ${occIds.size} occupations, ${loc.states.length} states.`);

// Freshness: single-value tables whose latest version ends within 60 days.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const horizon = new Date(Date.parse(today) + 60 * 86_400_000).toISOString().slice(0, 10);
const stale = [];
for (const [table, versions] of [...Object.entries(db['reference.json']), ...Object.entries(work['reference.json'])]) {
  const latest = [...versions].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).at(-1);
  if (latest.validTo && latest.validTo <= horizon) stale.push(`reference.json ${table}: ends ${latest.validTo}`);
}
if (stale.length) console.warn(`To renew, as of ${today}:\n- ${stale.join('\n- ')}`);
