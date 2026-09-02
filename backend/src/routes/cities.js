import { Router } from 'express';

import { SUPPORTED_CITIES } from '../config/cities.js';

export const citiesRouter = Router();

citiesRouter.get('/cities', (req, res) => {
  res.json({
    cities: SUPPORTED_CITIES.map(({ id, displayName, countryRegion }) => ({ id, displayName, countryRegion })),
  });
});
