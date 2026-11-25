import { Explainer, KindBadge, NumberField, SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { formatMoney } from '../../../lib/format.js';
import EquipmentTable from './EquipmentTable.jsx';

export default function SetupStep({ data, set, result }) {
  const t = useFormText();
  const { place, business, input } = result;
  const rent = input.areaM2 * input.rentPerM2;

  return (
    <>
      <fieldset className="subsection">
        <legend>{t.section('premises')}</legend>
        <div className="grid-2">
          <NumberField {...t.field('areaM2')} value={data.areaM2} onChange={(v) => set({ areaM2: v })} />
          <div>
            <NumberField
              {...t.field('rentPerM2', { average: formatMoney(place.rent.value), place: place.placeName })}
              value={input.rentPerM2}
              onChange={(v) => set({ rentPerM2: v, rentAuto: false })}
            />
            <p className="hint">
              <KindBadge kind={place.rent.kind} />{' '}
              {data.rentAuto ? t.text('rentPerM2', 'auto') : (
                <button type="button" className="btn-link" onClick={() => set({ rentAuto: true })}>{t.text('rentPerM2', 'useAverage', { average: formatMoney(place.rent.value) })}</button>
              )}
            </p>
          </div>
          <NumberField {...t.field('depositMonths')} value={data.depositMonths} max={12} onChange={(v) => set({ depositMonths: v })} />
          <NumberField {...t.field('preOpeningMonths')} value={data.preOpeningMonths} max={12} onChange={(v) => set({ preOpeningMonths: v })} />
        </div>
        <p className="hint" aria-live="polite">{t.text('rentPerM2', 'monthly', { rent: formatMoney(rent) })}</p>
        <div className="grid-2">
          <NumberField {...t.field('renovationPerM2')} value={data.renovationPerM2} onChange={(v) => set({ renovationPerM2: v })} />
          <NumberField {...t.field('facade')} value={data.facade} onChange={(v) => set({ facade: v })} />
        </div>
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('equipment')}</legend>
        <EquipmentTable data={data} set={set} business={business} />
      </fieldset>

      <fieldset className="subsection">
        <legend>{t.section('launch')}</legend>
        <div className="grid-2">
          <NumberField {...t.field('initialStock')} value={data.initialStock} onChange={(v) => set({ initialStock: v })} />
          <NumberField {...t.field('initialMarketing')} value={data.initialMarketing} onChange={(v) => set({ initialMarketing: v })} />
          <NumberField {...t.field('otherInitial')} value={data.otherInitial} onChange={(v) => set({ otherInitial: v })} />
        </div>
      </fieldset>
      <Explainer id="setup" />
      <SourcesInline sources={business.sources.map((id) => ({ id }))} />
    </>
  );
}
