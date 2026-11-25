// Monthly costs of the work itself: consumables, platform commission, paid leads, phone, the
// replacement of tools and gear over their useful life, and anything else the user adds.
export class WorkCostService {
  constructor(occupationService) {
    this.occupations = occupationService;
  }

  costs(input, occupation, work) {
    const items = [];
    const add = (id, amount, kind, params) => { if (amount > 0) items.push({ id, amount, kind, params }); };
    const replacement = this.occupations.items(occupation, input.items).reduce((s, i) => s + i.monthly, 0);
    add('materials', (work.revenue * input.materialsPct) / 100, occupation.costs.kind, { rate: input.materialsPct / 100 });
    add('platformFee', (work.revenue * input.platformFeePct) / 100, occupation.costs.kind, { rate: input.platformFeePct / 100 });
    add('leads', input.leadCostMonthly, occupation.costs.kind);
    add('phone', input.phoneMonthly, 'market');
    add('replacement', replacement, 'estimate');
    add('other', input.otherMonthly);
    return { items, total: items.reduce((s, i) => s + i.amount, 0) };
  }

  // What has to be paid before starting: tools, gear, courses and, for a rented vehicle, the deposit.
  investment(input, occupation, rentalDeposit) {
    const rows = this.occupations.items(occupation, input.items).filter((i) => i.on && i.total > 0);
    const items = rows.map((i) => ({ id: i.id, label: i.qty > 1 ? `${i.label} (${i.qty})` : i.label, amount: i.total, kind: i.kind }));
    if (input.vehicleOwnership === 'rented' && ['car', 'moto', 'bike'].includes(input.vehicleType) && rentalDeposit > 0) {
      items.push({ id: 'rentalDeposit', amount: rentalDeposit, kind: 'market' });
    }
    if (input.otherInitial > 0) items.push({ id: 'otherInitial', amount: input.otherInitial });
    return { items, total: items.reduce((s, i) => s + i.amount, 0) };
  }
}
