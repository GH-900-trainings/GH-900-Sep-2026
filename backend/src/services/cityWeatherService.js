import { SUPPORTED_CITIES, toCityReference } from '../config/cities.js';
import { geocodeCity } from './geocodingService.js';
import { getCurrentConditions } from './weatherService.js';

// No cache by design: every request geocodes and re-reads Azure Maps.
export async function getWeatherForCity(city) {
  const location = await geocodeCity(city);
  const current = await getCurrentConditions(location);

  return {
    city: toCityReference(city),
    location,
    current,
    retrievedAt: new Date().toISOString(),
  };
}

export async function getWeatherForAllCities() {
  const settled = await Promise.allSettled(SUPPORTED_CITIES.map(getWeatherForCity));

  const results = [];
  const errors = [];
  settled.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
      return;
    }
    const city = SUPPORTED_CITIES[index];
    console.error(`Weather lookup failed for ${city.id}:`, outcome.reason);
    errors.push({ cityId: city.id, code: outcome.reason?.code ?? 'UNKNOWN_ERROR' });
  });

  return { results, errors };
}
