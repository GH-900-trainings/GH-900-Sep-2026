// Allowlist: user input is never forwarded to Azure Maps, only the matching entry's `query`.
export const SUPPORTED_CITIES = Object.freeze([
  { id: 'bangkok', displayName: 'Bangkok', query: 'Bangkok, Thailand', countryRegion: 'TH' },
  { id: 'tokyo', displayName: 'Tokyo', query: 'Tokyo, Japan', countryRegion: 'JP' },
  { id: 'singapore', displayName: 'Singapore', query: 'Singapore', countryRegion: 'SG' },
  { id: 'london', displayName: 'London', query: 'London, United Kingdom', countryRegion: 'GB' },
  { id: 'new-york', displayName: 'New York', query: 'New York, NY, United States', countryRegion: 'US' },
  { id: 'sydney', displayName: 'Sydney', query: 'Sydney, NSW, Australia', countryRegion: 'AU' },
].map(Object.freeze));

export const SUPPORTED_CITY_IDS = Object.freeze(SUPPORTED_CITIES.map((city) => city.id));

export function findCity(idOrName) {
  if (typeof idOrName !== 'string') return undefined;

  const normalized = idOrName.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return SUPPORTED_CITIES.find((city) => city.id === normalized);
}
