# Cálculo Empreender — quanto custa abrir um negócio

Single-page React (Vite) app that estimates the initial investment and the projected profit of opening a small business in Brazil — lanchonete, padaria, salão de beleza, minimercado, loja de roupas and pet shop — by state and city. The UI is in Brazilian Portuguese because that is the target audience. It follows the same principles as [Cálculo CLT](https://github.com/allanbarcelos/calculo-clt), which is linked for the payroll cost.

## Run

```
npm install
npm run dev          # http://localhost:5173
npm test             # calculation and render tests
npm run db:validate  # checks the JSON database
npm run build        # validates the database, runs the tests, then builds dist/
```

Preview the values in force on another date with `?data=YYYY-MM-DD`. Without it, the site uses today's date in Brazil (America/Sao_Paulo).

## Architecture

```
src/
  db/             JSON database: businesses, locations, national references, sources and every text
  repositories/   read the database and resolve the version in force on the reference date
  services/       business rules (one responsibility each) + container.js (composition root)
  context/        React context that injects the services into the UI
  hooks/          useServices, usePersistentState, useFormText, useLabels
  components/     generic, data-driven UI and page layout
  features/       wizard and one folder per step
scripts/validate-db.mjs   database validation run before every build
```

- `LocationService`: rent, electricity and water tariffs, Junta Comercial, fire department, business and sanitary licences for the state capital, the interior (capital rent × `interiorRentFactor`) or a city with its own data.
- `BusinessService`: business catalogue and the values it pre-fills (equipment, fit-out, stock, monthly figures, revenue model).
- `TaxService`: MEI (fixed DAS) and Simples Nacional (effective rate from the annex tables; RBT12 of a company in its first year per LC 123/2006, art. 18, §§ 2º e 3º). Revenue is split by annex (`tax.annexMix`, e.g. pet shop services in Anexo III and products in Anexo I) and the ICMS and PIS/COFINS shares of the DAS (`simples.partition`) come off the revenue under ICMS-ST (`tax.stShare`) or monofásico (`tax.monoShare`).
- `OperatingService`: one month — revenue with the ramp-up of a new business, goods (CMV), card fees, delivery-app commission, taxes and fixed costs (including annual fees ÷ 12 and an equipment replacement fund over `projection.equipmentLifeYears`).
- `InvestmentService`: formalization, premises (deposit, rent before opening, renovation, façade), equipment, launch and the working-capital reserve.
- `ProjectionService`: 36 months, horizons (3, 6, 12, 24, 36 months), payback and whether the reserve covers the early losses plus the credit-card receivables (D+30).
- `Calculator`: orchestrates the services and raises the warnings: MEI limit per calendar year (proportional in the opening year; LC 238/2026 from 2027), MEI employees, Simples limit, payroll, profit, payback, working capital and margin outside the sector range (`revenue.netMarginRange`).

Values typed by the user always win; `rentAuto` and `payrollAuto` keep following the database (location rent, payroll estimate) until the user types their own.

## The database (`src/db`)

| File | Content |
|---|---|
| `businesses.json` | business types: equipment (essential/optional), area, renovation per m², stock, monthly figures, ticket, customers per day by scenario, CMV, ramp-up, staff, CNAE, MEI occupation, Simples annex, licences |
| `locations.json` | states and capitals, rent per m², electricity tariff (ANEEL B3 + taxes), water, Junta Comercial, fire department, business and sanitary licences |
| `reference.json` | minimum wage, MEI (DAS, limits by year), Simples Nacional annexes, pró-labore, market prices (accounting, digital certificate, INPI, card fees), projection assumptions, payroll estimate and link to Cálculo CLT |
| `sources.json` | every source and how it is grouped on the page |
| `content.json`, `form-text.json` | every text: explainers, callouts, warnings, labels, field labels and hints |
| `meta.json` | site name and last review date |

Every value carries a **kind**: `official` (government table: Junta Comercial, ANEEL, LC 123, INPI…), `market` (published market average: FipeZAP, price surveys) or `estimate` (our estimate when nothing is published). The UI shows the kind next to the value.

Any item can carry `validFrom` / `validTo` (YYYY-MM-DD). Single-value tables use the active version with the latest `validFrom`; collections keep every active item, the latest per id.

### Adding a business

Add an item to `businesses.json` with the same fields as the existing ones and a source for each number (or `ownEstimate`). `npm run db:validate` checks ids, sources, the Simples annex, the scenarios and the equipment.

### Adding a city

Add it to `cities` and its municipal costs to `cityCosts` (`rent`, `license`, `sanitary`, each with `value`, `kind` and `source`). Cities without data use the capital's.

## Expert review

The business figures and the model were reviewed by specialists in small food businesses, in services and retail, and in small-business finance and taxation. Their corrections are in the data: salons follow the Lei do Salão-Parceiro (the ticket is the salon's share, professionals are partners), fashion stores use a higher card fee and a larger stock and reserve, pet shops split services and products, food businesses have larger teams, higher CMV, delivery commission and the sinks required by Anvisa RDC 216/2004, and minimarkets take ICMS-ST and monofásico out of the Simples tax.

## Estimativas

When no official value or published market average exists, the database uses an estimate marked `estimate`:

- **Rent outside the FipeZAP Comercial capitals:** the city's FipeZAP residential rent × 0,891 (average commercial/residential ratio of the capitals covered by both indices); capitals with no FipeZAP coverage use R$ 30/m². Interior cities use the capital rent × a factor per state (0,45 to 0,70).
- **Electricity with taxes:** the ANEEL B3 tariff ÷ (1 − ICMS − PIS/COFINS), with the rates seen on recent bills, green flag, without public lighting.
- **Water:** R$ 18/m³ for water + sewage at a commercial tariff.
- **Fees not published by a Junta, fire department or city hall:** values reported by accounting firms or the average of nearby states, explained in the source.
- **Business figures:** where Sebrae and sector bodies do not publish numbers (ticket, customers per day, CMV, renovation per m², equipment without a listed price), values from market prices and sector practice.
- **Payroll:** until the user types the cost from Cálculo CLT, employees × minimum wage × 1,8 (state and category floors above the minimum, FGTS, 13th, vacation, transport).
- **Sales ramp-up:** a new business starts at 40% of mature sales, growing linearly until the chosen month. Values are constant (no inflation).
- **2027 minimum wage and MEI DAS:** R$ 1.741 from the 2027 budget bill, until the decree is published.
- **Electricity:** the ANEEL tariff is official; the taxes added to it are estimated, so the final value is marked as an estimate.
- **Rent:** FipeZAP Comercial measures offices and commercial units up to 200 m²; street shops in busy spots usually cost more.

These are references to plan, not guarantees. Confirm the values of your case before investing.
