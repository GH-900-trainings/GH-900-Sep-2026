import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { azureMapsGet } from './azureMapsClient.js';

const GEOCODE_PATH = '/geocode';

export async function geocodeCity(city) {
  // Azure Maps rejects `countryRegion` alongside `query`, so the country is baked into city.query.
  const payload = await azureMapsGet(GEOCODE_PATH, {
    apiVersion: config.geocodeApiVersion,
    params: { query: city.query, top: 1 },
  });

  const feature = payload?.features?.[0];
  if (!feature) {
    throw new AppError('GEOCODE_NO_RESULT', 502, `Azure Maps returned no coordinates for "${city.displayName}".`);
  }

  // GeoJSON order is [longitude, latitude] - the Weather API wants them the other way round.
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new AppError('GEOCODE_BAD_RESPONSE', 502, `Azure Maps returned malformed coordinates for "${city.displayName}".`);
  }

  const [longitude, latitude] = coordinates;
  return {
    latitude,
    longitude,
    formattedAddress: feature.properties?.address?.formattedAddress ?? null,
    confidence: feature.properties?.confidence ?? null,
  };
}
