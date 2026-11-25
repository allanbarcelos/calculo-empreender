import { ContentCallout, KindBadge, SelectField, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatMoney } from '../../../lib/format.js';
import { INTERIOR } from '../../../services/LocationService.js';

function Row({ label, value, kind, note }) {
  return (
    <tr>
      <th scope="row">{label}{note && <span className="hint-inline"> · {note}</span>}</th>
      <td className="num">{value}</td>
      <td><KindBadge kind={kind} /></td>
    </tr>
  );
}

export default function PlaceStep({ data, set, result }) {
  const { locations } = useServices();
  const t = useFormText();
  const { place, business } = result;
  const capital = locations.cities(data.uf).find((c) => c.capital);
  const money = (v) => formatMoney(v);
  const sanitary = business.licenses.sanitary;

  const cityOptions = [
    ...locations.cities(data.uf).map((c) => ({ value: c.capital ? '' : c.id, label: c.capital ? t.text('cityId', 'capital', { name: c.name }) : c.name })),
    { value: INTERIOR, label: t.text('cityId', 'interior') },
  ];

  const sources = [place.rent.source, place.energy.source, place.water.source, place.junta.source, place.firefighters.source, place.license.source, place.sanitary.source]
    .filter((id, i, all) => id && all.indexOf(id) === i)
    .map((id) => ({ id }));

  return (
    <>
      <div className="grid-2">
        <SelectField
          {...t.field('uf')}
          value={data.uf}
          onChange={(uf) => set({ uf, cityId: '' })}
          options={locations.states().map((s) => ({ value: s.uf, label: `${s.name} (${s.uf})` }))}
        />
        <SelectField {...t.field('cityId')} value={data.cityId} onChange={(cityId) => set({ cityId })} options={cityOptions} />
      </div>
      {place.interior && <ContentCallout id="interiorEstimate" vars={{ capital: capital?.name, factor: place.rent.factor }} />}

      <div className="table-scroll">
        <table className="breakdown">
          <caption>{t.text('uf', 'tableCaption', { place: place.placeName })}</caption>
          <thead><tr><th scope="col">{t.text('uf', 'colItem')}</th><th scope="col" className="num">{t.text('uf', 'colValue')}</th><th scope="col">{t.text('uf', 'colKind')}</th></tr></thead>
          <tbody>
            <Row label={t.text('uf', 'rent')} value={`${money(place.rent.value)}/m²`} kind={place.rent.kind} />
            <Row label={t.text('uf', 'energy')} value={`${money(place.energy.value)}/kWh`} kind={place.energy.kind} note={place.energy.distributor} />
            <Row label={t.text('uf', 'water')} value={`${money(place.water.value)}/m³`} kind={place.water.kind} />
            <Row label={t.text('uf', 'juntaIndividual')} value={money(place.junta.individual)} kind={place.junta.kind} />
            <Row label={t.text('uf', 'juntaLtda')} value={money(place.junta.ltda)} kind={place.junta.kind} />
            <Row label={t.text('uf', 'firefighters')} value={money(place.firefighters.value)} kind={place.firefighters.kind} note={place.firefighters.rule} />
            <Row label={t.text('uf', 'license')} value={money(place.license.value)} kind={place.license.kind} note={place.license.rule} />
            {sanitary && <Row label={t.text('uf', 'sanitary')} value={money(place.sanitary[sanitary] ?? 0)} kind={place.sanitary.kind} note={place.sanitary.rule} />}
          </tbody>
        </table>
      </div>
      {place.feesFromCapital && <p className="hint">{t.text('cityId', 'feesFromCapital', { capital: capital?.name })}</p>}
      <SourcesInline sources={sources} />
    </>
  );
}
