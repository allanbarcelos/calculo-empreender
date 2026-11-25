import { ChoiceGroup, Explainer, KindBadge, NumberField, SourcesInline } from '../../components/ui';
import { useFormText } from '../../hooks/useFormText.js';
import { useServices } from '../../hooks/useServices.js';
import { formatMoney, formatPercent } from '../../lib/format.js';
import { MOTOR_VEHICLES } from '../services/OccupationService.js';

export default function VehicleStep({ data, set, result }) {
  const { formDefaults, repositories } = useServices();
  const t = useFormText();
  const { occupation, place, vehicle } = result;
  const type = data.vehicleType;
  const motor = MOTOR_VEHICLES.includes(type);
  const ownable = motor || type === 'bike';
  const rented = data.vehicleOwnership === 'rented';
  const national = repositories.regional.national();
  const fuel = place?.gasoline ?? national.gasoline;
  const fare = place?.busFare ?? national.busFare;
  const sources = [fuel.source, place?.ipva.source, place?.licensing.source, fare.source].filter((id, i, all) => id && all.indexOf(id) === i).map((id) => ({ id }));

  return (
    <>
      <ChoiceGroup
        legend={t.field('vehicleType').label}
        hint={t.field('vehicleType').hint}
        name="vehicleType"
        value={type}
        onChange={(v) => set(formDefaults.vehiclePatch(data, v))}
        options={occupation.vehicle.options.map((v) => ({ value: v, label: t.text('vehicleType', `option_${v}`), description: t.text('vehicleType', `desc_${v}`) }))}
      />

      {ownable && (
        <ChoiceGroup
          legend={t.field('vehicleOwnership').label}
          name="vehicleOwnership"
          value={data.vehicleOwnership}
          onChange={(v) => set({ vehicleOwnership: v })}
          options={[
            { value: 'own', label: t.text('vehicleOwnership', 'optionOwn'), description: t.text('vehicleOwnership', motor ? 'descOwn' : 'descOwnBike') },
            { value: 'rented', label: t.text('vehicleOwnership', 'optionRented'), description: t.text('vehicleOwnership', 'descRented') },
          ]}
        />
      )}

      {ownable && (
        <fieldset className="subsection">
          <legend>{t.section(rented ? 'rental' : 'ownVehicle')}</legend>
          <div className="grid-2">
            {rented ? (
              <NumberField {...t.field('rentWeekly')} value={data.rentWeekly} onChange={(v) => set({ rentWeekly: v })} />
            ) : (
              <>
                <NumberField {...t.field('vehicleValue')} value={data.vehicleValue} onChange={(v) => set({ vehicleValue: v })} />
                <NumberField {...t.field('depreciationPct')} value={data.depreciationPct} max={100} onChange={(v) => set({ depreciationPct: v })} />
                {motor && <NumberField {...t.field('insurancePct')} value={data.insurancePct} max={100} onChange={(v) => set({ insurancePct: v })} />}
                <NumberField {...t.field('maintenancePerKm')} value={data.maintenancePerKm} onChange={(v) => set({ maintenancePerKm: v })} />
                <NumberField {...t.field('capitalPct')} value={data.capitalPct} max={50} onChange={(v) => set({ capitalPct: v })} />
              </>
            )}
            {motor && <NumberField {...t.field('consumption')} value={data.consumption} onChange={(v) => set({ consumption: v })} />}
          </div>
        </fieldset>
      )}

      {motor && (
        <div>
          <NumberField {...t.field('fuelPrice', { uf: data.uf })} value={result.fuelPrice} onChange={(v) => set({ fuelPrice: v, fuelAuto: false })} />
          <p className="hint">
            <KindBadge kind={fuel.kind} />{' '}
            {data.fuelAuto ? t.text('fuelPrice', 'auto', { date: fuel.date ?? '' }) : (
              <button type="button" className="btn-link" onClick={() => set({ fuelAuto: true })}>{t.text('fuelPrice', 'useAverage', { value: formatMoney(fuel.value) })}</button>
            )}
          </p>
        </div>
      )}

      {type === 'transit' && (
        <div>
          <NumberField {...t.field('transitDaily')} value={result.transitDaily} onChange={(v) => set({ transitDaily: v, transitAuto: false })} />
          <p className="hint">
            <KindBadge kind={fare.kind} />{' '}
            {data.transitAuto ? t.text('transitDaily', 'auto', { fares: data.faresPerDay, fare: formatMoney(fare.value), city: fare.city ?? '' }) : (
              <button type="button" className="btn-link" onClick={() => set({ transitAuto: true })}>{t.text('transitDaily', 'useFare', { fares: data.faresPerDay, value: formatMoney(fare.value * data.faresPerDay) })}</button>
            )}
          </p>
        </div>
      )}

      {motor && !rented && place && (
        <p className="hint">{t.text('vehicleValue', 'stateTaxes', { ipva: formatPercent(type === 'moto' ? place.ipva.moto : place.ipva.car), licensing: formatMoney(place.licensing.value), uf: data.uf })} {place.ipva.note}</p>
      )}

      <p className="hint" aria-live="polite">
        {vehicle.total > 0
          ? t.text('vehicleType', 'summary', { total: formatMoney(vehicle.total), perKm: vehicle.perKm === null ? '—' : formatMoney(vehicle.perKm) })
          : t.text('vehicleType', 'summaryNone')}
      </p>
      <Explainer id="vehicle" />
      <SourcesInline sources={sources} />
    </>
  );
}
