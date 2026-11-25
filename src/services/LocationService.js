// Everything that depends on where the business opens. A city without its own data, or the
// "interior" option, falls back to the state capital; interior rent is the capital rent times
// the state's interiorRentFactor (an estimate).
export const INTERIOR = 'interior';

export class LocationService {
  constructor(locationRepository) {
    this.locations = locationRepository;
  }

  states() { return this.locations.states(); }
  cities(uf) { return this.locations.cities(uf); }

  resolve({ uf, cityId }) {
    const state = this.locations.state(uf) ?? this.locations.state(this.locations.defaultState());
    const capital = this.locations.city(state.capital);
    const interior = cityId === INTERIOR;
    const city = interior ? null : (this.locations.city(cityId) ?? capital);
    const capitalCosts = this.locations.cityCosts(capital.id);
    const costs = (city && this.locations.cityCosts(city.id)) ?? capitalCosts;
    const stateCosts = this.locations.stateCosts(state.uf);
    const rent = interior
      ? { ...capitalCosts.rent, value: capitalCosts.rent.value * state.interiorRentFactor, kind: 'estimate', derivedFrom: capital.name, factor: state.interiorRentFactor }
      : costs.rent;

    return {
      state,
      city,
      interior,
      placeName: interior ? `Interior de ${state.name}` : `${city.name} (${state.uf})`,
      rent,
      energy: stateCosts.energy,
      water: this.locations.water(),
      junta: stateCosts.junta,
      firefighters: stateCosts.firefighters,
      license: costs.license,
      sanitary: costs.sanitary,
      // Municipal fees of the interior are not in the database: the capital's are shown as a reference.
      feesFromCapital: interior || !this.locations.cityCosts(city.id),
    };
  }
}
