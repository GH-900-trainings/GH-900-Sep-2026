import { Router } from 'express';

import { SUPPORTED_CITY_IDS, findCity } from '../config/cities.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getWeatherForAllCities, getWeatherForCity } from '../services/cityWeatherService.js';

export const weatherRouter = Router();

weatherRouter.get(
  '/weather',
  asyncHandler(async (req, res) => {
    res.json(await getWeatherForAllCities());
  }),
);

weatherRouter.get(
  '/weather/:city',
  asyncHandler(async (req, res) => {
    const city = findCity(req.params.city);
    if (!city) {
      res.status(404).json({
        error: {
          code: 'CITY_NOT_SUPPORTED',
          message: `"${req.params.city}" is not a supported city.`,
          supported: SUPPORTED_CITY_IDS,
        },
      });
      return;
    }

    res.json(await getWeatherForCity(city));
  }),
);
