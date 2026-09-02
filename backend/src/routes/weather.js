import { Router } from 'express';

import { SUPPORTED_CITY_IDS, SUPPORTED_COUNTRIES, findCity, findCountry } from '../config/cities.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getWeatherForAllCities, getWeatherForCity } from '../services/cityWeatherService.js';

export const weatherRouter = Router();

function sendError(res, status, code, message, extra = {}) {
  res.status(status).json({ error: { code, message, ...extra } });
}

// Returns the allowlisted city, or writes the error response and returns undefined.
function resolveCity(res, cityParam, countryParam) {
  if (typeof cityParam !== 'string' || cityParam.trim() === '') {
    sendError(res, 400, 'CITY_REQUIRED', 'The "city" query parameter is required and must be a single value.', {
      supported: SUPPORTED_CITY_IDS,
    });
    return undefined;
  }

  const city = findCity(cityParam);
  if (!city) {
    sendError(res, 404, 'CITY_NOT_SUPPORTED', `"${cityParam}" is not a supported city.`, {
      supported: SUPPORTED_CITY_IDS,
    });
    return undefined;
  }

  if (countryParam === undefined) return city;

  if (typeof countryParam !== 'string' || countryParam.trim() === '') {
    sendError(res, 400, 'COUNTRY_INVALID', 'The "country" query parameter must be a non-empty value.', {
      supported: SUPPORTED_COUNTRIES,
    });
    return undefined;
  }

  const countryName = findCountry(countryParam);
  if (!countryName) {
    sendError(res, 404, 'COUNTRY_NOT_SUPPORTED', `"${countryParam}" is not a supported country.`, {
      supported: SUPPORTED_COUNTRIES,
    });
    return undefined;
  }

  if (countryName !== city.countryName) {
    sendError(
      res,
      400,
      'CITY_COUNTRY_MISMATCH',
      `"${city.displayName}" is not in "${countryName}", it is in "${city.countryName}".`,
    );
    return undefined;
  }

  return city;
}

weatherRouter.get(
  '/weather',
  asyncHandler(async (req, res) => {
    // No `city` keeps the original behaviour: current weather for every supported city.
    if (req.query.city === undefined && req.query.country === undefined) {
      res.json(await getWeatherForAllCities());
      return;
    }

    const city = resolveCity(res, req.query.city, req.query.country);
    if (!city) return;

    res.json(await getWeatherForCity(city));
  }),
);

weatherRouter.get(
  '/weather/:city',
  asyncHandler(async (req, res) => {
    const city = resolveCity(res, req.params.city, req.query.country);
    if (!city) return;

    res.json(await getWeatherForCity(city));
  }),
);
