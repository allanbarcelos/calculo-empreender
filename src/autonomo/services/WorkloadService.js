// Working time and output of an average month. Days off (vacation) and idle days (illness, rain,
// vehicle in the shop, no customers) come out of the year, so the monthly figures are averages
// over 12 months while costs like insurance and phone run every month.
export class WorkloadService {
  daysPerYear(input) {
    return Math.max(0, input.daysPerMonth * 12 - input.vacationDays - input.idleDays);
  }

  month(input, occupation) {
    const days = this.daysPerYear(input) / 12;
    const hours = days * input.hoursPerDay;
    const hourly = occupation.model === 'hourly';
    const jobs = hourly ? 0 : days * input.jobsPerDay;
    const revenue = hourly ? hours * input.earningsPerHour : jobs * input.ticket;
    // kmPerUnit: km per hour logged (apps) or per job (services), empty km included. Only a
    // vehicle of the worker's own (or rented) runs up km costs.
    const driving = ['car', 'moto', 'bike'].includes(input.vehicleType);
    const km = driving ? (hourly ? hours : jobs) * input.kmPerUnit : 0;
    return { days, hours, jobs, revenue, km };
  }
}
