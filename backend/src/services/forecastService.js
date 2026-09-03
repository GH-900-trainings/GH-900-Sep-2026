import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { azureMapsGet } from './azureMapsClient.js';

const DAILY_FORECAST_PATH = '/weather/forecast/daily/json';

// Azure Maps only accepts these durations, so ask for the smallest one that covers `days`.
const SUPPORTED_DURATIONS = [1, 5, 10];

export const MAX_FORECAST_DAYS = 10;

function measurement(value) {
  return value ? { value: value.value, unit: value.unit } : null;
}

export async function getDailyForecast({ latitude, longitude }, days) {
  const duration = SUPPORTED_DURATIONS.find((candidate) => candidate >= days) ?? MAX_FORECAST_DAYS;

  const payload = await azureMapsGet(DAILY_FORECAST_PATH, {
    apiVersion: config.weatherApiVersion,
    params: { query: `${latitude},${longitude}`, unit: config.weatherUnits, duration },
  });

  const forecasts = payload?.forecasts;
  if (!Array.isArray(forecasts) || forecasts.length === 0) {
    throw new AppError('FORECAST_NO_RESULT', 502, 'Azure Maps returned no forecast for these coordinates.');
  }

  return {
    summary: payload.summary?.phrase ?? null,
    days: forecasts.slice(0, days).map((entry) => ({
      date: entry.date ?? null,
      iconCode: entry.day?.iconCode ?? null,
      phrase: entry.day?.iconPhrase ?? null,
      longPhrase: entry.day?.longPhrase ?? null,
      minimum: measurement(entry.temperature?.minimum),
      maximum: measurement(entry.temperature?.maximum),
      precipitationProbabilityPercent: entry.day?.precipitationProbability ?? null,
      hoursOfSun: entry.hoursOfSun ?? null,
      wind: {
        speed: measurement(entry.day?.wind?.speed),
        directionLabel: entry.day?.wind?.direction?.localizedDescription ?? null,
      },
    })),
  };
}
