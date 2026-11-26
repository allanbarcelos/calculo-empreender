import { MOTOR_VEHICLES } from './OccupationService.js';

// Monthly cost of getting to work. An owned car or motorcycle costs fuel and maintenance per km,
// plus depreciation, insurance, IPVA and licensing every month; a rented one costs the weekly rent
// (insurance, maintenance and taxes included) plus fuel. Public transport costs the fares of each
// working day.
const WEEKS_PER_MONTH = 52 / 12;
export const FUEL_TYPES = ['gasoline', 'ethanol'];

export class VehicleService {
  constructor(regionalCostRepository, workReferenceRepository) {
    this.regional = regionalCostRepository;
    this.reference = workReferenceRepository;
  }

  place(uf) {
    return this.regional.state(uf) ?? null;
  }

  fuelType(input) {
    return input.fuelType === 'ethanol' ? 'ethanol' : 'gasoline';
  }

  // The state's ANP average of the chosen fuel, or the national one.
  fuelReference(uf, type = 'gasoline') {
    return this.place(uf)?.[type] ?? this.regional.national()[type];
  }

  fuelPrice(input) {
    if (!input.fuelAuto) return input.fuelPrice;
    return this.fuelReference(input.uf, this.fuelType(input)).value;
  }

  // The consumption is typed for gasoline; a litre of ethanol goes about 70% as far.
  kmPerLiter(input) {
    const ratio = this.fuelType(input) === 'ethanol' ? this.reference.vehicles().ethanolRatio : 1;
    return input.consumption * ratio;
  }

  // Ethanol pays off when its price is below gasoline's times the ratio.
  ethanolComparison(uf) {
    const ratio = this.reference.vehicles().ethanolRatio;
    const share = this.fuelReference(uf, 'ethanol').value / this.fuelReference(uf, 'gasoline').value;
    return { share, ratio, cheaper: share < ratio };
  }

  transitDaily(input) {
    if (!input.transitAuto) return input.transitDaily;
    const fare = this.place(input.uf)?.busFare.value ?? this.regional.national().busFare.value;
    return fare * input.faresPerDay;
  }

  ipvaRate(input) {
    const state = this.place(input.uf);
    if (!state || !MOTOR_VEHICLES.includes(input.vehicleType)) return 0;
    return input.vehicleType === 'moto' ? state.ipva.moto : state.ipva.car;
  }

  licensing(input) {
    return this.place(input.uf)?.licensing.value ?? this.regional.national().licensing.value;
  }

  costs(input, work) {
    const items = [];
    const add = (id, amount, kind, params) => { if (amount > 0) items.push({ id, amount, kind, params }); };
    const type = input.vehicleType;
    const own = input.vehicleOwnership !== 'rented';
    const state = this.place(input.uf);

    if (MOTOR_VEHICLES.includes(type) && input.consumption > 0) {
      const price = this.fuelPrice(input);
      const fuel = this.fuelType(input);
      add('fuel', (work.km / this.kmPerLiter(input)) * price, input.fuelAuto ? state?.[fuel].kind : undefined, { km: Math.round(work.km), price, fuel });
    }
    if (type === 'transit') add('transit', this.transitDaily(input) * work.days, input.transitAuto ? state?.busFare.kind : undefined);
    if (['car', 'moto', 'bike'].includes(type)) {
      if (own) {
        add('maintenance', work.km * input.maintenancePerKm, 'market');
        add('depreciation', (input.vehicleValue * input.depreciationPct) / 100 / 12, 'estimate');
        // The money tied up in the vehicle would earn interest if it were invested.
        add('capital', (input.vehicleValue * input.capitalPct) / 100 / 12, 'estimate', { rate: input.capitalPct / 100 });
        if (MOTOR_VEHICLES.includes(type)) {
          add('insurance', (input.vehicleValue * input.insurancePct) / 100 / 12, 'market');
          add('ipva', (input.vehicleValue * this.ipvaRate(input)) / 12, state?.ipva.kind, { rate: this.ipvaRate(input) });
          add('licensing', this.licensing(input) / 12, state?.licensing.kind);
        }
      } else {
        add('rent', input.rentWeekly * WEEKS_PER_MONTH, 'market');
      }
    }
    const total = items.reduce((s, i) => s + i.amount, 0);
    return { items, total, perKm: work.km > 0 ? total / work.km : null };
  }
}
