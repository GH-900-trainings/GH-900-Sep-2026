import { config } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { azureMapsGet } from './azureMapsClient.js';

const CURRENT_CONDITIONS_PATH = '/weather/currentConditions/json';

function measurement(value) {
  return value ? { value: value.value, unit: value.unit } : null;
}

export async function getCurrentConditions({ latitude, longitude }) {
  const payload = await azureMapsGet(CURRENT_CONDITIONS_PATH, {
    apiVersion: config.weatherApiVersion,
    params: { query: `${latitude},${longitude}`, unit: config.weatherUnits, details: true },
  });

  const observation = payload?.results?.[0];
  if (!observation) {
    throw new AppError('WEATHER_NO_RESULT', 502, 'Azure Maps returned no weather observation for these coordinates.');
  }

  return {
    observedAt: observation.dateTime ?? null,
    phrase: observation.phrase ?? null,
    iconCode: observation.iconCode ?? null,
    isDayTime: observation.isDayTime ?? null,
    hasPrecipitation: observation.hasPrecipitation ?? null,
    temperature: measurement(observation.temperature),
    feelsLike: measurement(observation.realFeelTemperature),
    temperatureRange: {
      minimum: measurement(observation.temperatureSummary?.past24Hours?.minimum),
      maximum: measurement(observation.temperatureSummary?.past24Hours?.maximum),
    },
    humidityPercent: observation.relativeHumidity ?? null,
    cloudCoverPercent: observation.cloudCover ?? null,
    uvIndex: observation.uvIndex ?? null,
    uvIndexPhrase: observation.uvIndexPhrase ?? null,
    visibility: measurement(observation.visibility),
    wind: {
      speed: measurement(observation.wind?.speed),
      directionDegrees: observation.wind?.direction?.degrees ?? null,
      directionLabel: observation.wind?.direction?.localizedDescription ?? null,
    },
  };
}
