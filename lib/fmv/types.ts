export interface FmvEntry {
  id: string;
  clientName: string;
  country: string;
  projectTarget: string;
  methodology: string | null;
  currencyCode: string;
  hourlyRateLocal: number;
  hourlyRateUsd: number;
  hourlyRateGbp: number;
  hourlyRateEur: number;
  effectiveDate: string;
  fxRateDate: string;
  createdAt: string;
}

export interface FmvDatabaseStats {
  totalEntries: number;
  uniqueCountries: number;
  uniqueCurrencies: number;
  avgHourlyUsd: number | null;
}
