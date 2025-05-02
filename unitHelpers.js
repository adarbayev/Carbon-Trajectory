// Unit conversion constants
const EF_DIESEL_L_PER_KGCO2 = 2.66155;             // kg per liter
const EF_DIESEL_M3_PER_KGCO2 = 0.00266155;         // kg per m3
const LITER_PER_GALLON_US   = 3.78541;
const EF_DIESEL_GAL_PER_KGCO2 = EF_DIESEL_L_PER_KGCO2 / LITER_PER_GALLON_US;
const EF_ELEC_KWH = 0.20705;                       // kg per kWh

export function fuelToTCO2eq(amount, unit) {
  amount = parseFloat(amount) || 0;
  let kgCO2 = 0;
  if (unit === 'liter') kgCO2 = amount * EF_DIESEL_L_PER_KGCO2;
  else if (unit === 'm3') kgCO2 = amount / EF_DIESEL_M3_PER_KGCO2;
  else if (unit === 'gallon') kgCO2 = amount * EF_DIESEL_GAL_PER_KGCO2;
  return kgCO2 / 1000; // tCO2eq
}

export function elecToTCO2eq(amount, unit) {
  amount = parseFloat(amount) || 0;
  let kgCO2 = 0;
  if (unit === 'kWh') kgCO2 = amount * EF_ELEC_KWH;
  else if (unit === 'MWh') kgCO2 = amount * 1000 * EF_ELEC_KWH;
  else if (unit === 'GJ') kgCO2 = amount * (277.778 * EF_ELEC_KWH);
  return kgCO2 / 1000; // tCO2eq
} 