// Allowlist: user input is never forwarded to Azure Maps, only the matching entry's `query`.
export const SUPPORTED_CITIES = Object.freeze([
  {
    id: 'sydney',
    displayName: 'Sydney',
    query: 'Sydney, NSW, Australia',
    countryRegion: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    coordinates: Object.freeze({ latitude: -33.8688, longitude: 151.2093 }),
    timeZone: 'Australia/Sydney',
  },
  {
    id: 'melbourne',
    displayName: 'Melbourne',
    query: 'Melbourne, VIC, Australia',
    countryRegion: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    coordinates: Object.freeze({ latitude: -37.8136, longitude: 144.9631 }),
    timeZone: 'Australia/Melbourne',
  },
  {
    id: 'singapore',
    displayName: 'Singapore',
    query: 'Singapore',
    countryRegion: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    coordinates: Object.freeze({ latitude: 1.3521, longitude: 103.8198 }),
    timeZone: 'Asia/Singapore',
  },
  {
    id: 'mumbai',
    displayName: 'Mumbai',
    query: 'Mumbai, Maharashtra, India',
    countryRegion: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    coordinates: Object.freeze({ latitude: 19.076, longitude: 72.8777 }),
    timeZone: 'Asia/Kolkata',
  },
  {
    id: 'new-delhi',
    displayName: 'New Delhi',
    query: 'New Delhi, India',
    countryRegion: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    coordinates: Object.freeze({ latitude: 28.6139, longitude: 77.209 }),
    timeZone: 'Asia/Kolkata',
  },
].map(Object.freeze));

export const SUPPORTED_CITY_IDS = Object.freeze(SUPPORTED_CITIES.map((city) => city.id));

export const SUPPORTED_COUNTRIES = Object.freeze([
  ...new Set(SUPPORTED_CITIES.map((city) => city.countryName)),
]);

// "The Philippines", "philippines" and "PH" all have to resolve to the same entry.
function normalize(value) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/^the-/, '');
}

export function findCity(idOrName) {
  if (typeof idOrName !== 'string') return undefined;

  const normalized = normalize(idOrName);
  return SUPPORTED_CITIES.find((city) => city.id === normalized || normalize(city.displayName) === normalized);
}

export function findCountry(nameOrCode) {
  if (typeof nameOrCode !== 'string') return undefined;

  const normalized = normalize(nameOrCode);
  const city = SUPPORTED_CITIES.find(
    (candidate) => normalize(candidate.countryName) === normalized || candidate.countryRegion.toLowerCase() === normalized,
  );
  return city?.countryName;
}

// Reference data for the frontend: flag, coordinates and time zone per supported city.
export function toCityReference(city) {
  return {
    id: city.id,
    displayName: city.displayName,
    countryRegion: city.countryRegion,
    countryName: city.countryName,
    flag: city.flag,
    coordinates: { ...city.coordinates },
    timeZone: city.timeZone,
  };
}
