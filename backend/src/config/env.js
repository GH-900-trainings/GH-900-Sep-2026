import 'dotenv/config';

function readPositiveInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, received "${raw}".`);
  }
  return parsed;
}

const port = readPositiveInt('PORT', 3000);
if (port > 65535) {
  throw new Error(`PORT must be between 1 and 65535, received "${port}".`);
}

const weatherUnits = (process.env.WEATHER_UNITS ?? 'metric').toLowerCase();
if (weatherUnits !== 'metric' && weatherUnits !== 'imperial') {
  throw new Error(`WEATHER_UNITS must be "metric" or "imperial", received "${weatherUnits}".`);
}

export const config = Object.freeze({
  port,
  weatherUnits,
  subscriptionKey: process.env.AZURE_MAPS_SUBSCRIPTION_KEY ?? '',
  baseUrl: process.env.AZURE_MAPS_BASE_URL ?? 'https://atlas.microsoft.com',
  geocodeApiVersion: process.env.AZURE_MAPS_GEOCODE_API_VERSION ?? '2025-01-01',
  weatherApiVersion: process.env.AZURE_MAPS_WEATHER_API_VERSION ?? '1.1',
  httpTimeoutMs: readPositiveInt('HTTP_TIMEOUT_MS', 8000),
});

// Called from server.js only, so tests can import the app without a real key.
export function assertConfig() {
  if (!config.subscriptionKey.trim()) {
    throw new Error(
      'AZURE_MAPS_SUBSCRIPTION_KEY is required. Copy backend/.env.example to backend/.env and set the key.',
    );
  }
}
