function city(id, displayName, countryRegion, countryName, latitude, longitude, timeZone) {
  return {
    id,
    displayName,
    countryRegion,
    countryName,
    flag: '',
    coordinates: { latitude, longitude },
    timeZone,
  };
}

export const SYDNEY = city('sydney', 'Sydney', 'AU', 'Australia', -33.8688, 151.2093, 'Australia/Sydney');
export const MELBOURNE = city('melbourne', 'Melbourne', 'AU', 'Australia', -37.8136, 144.9631, 'Australia/Melbourne');
export const SINGAPORE = city('singapore', 'Singapore', 'SG', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore');

export const citiesResponse = { cities: [SYDNEY, MELBOURNE, SINGAPORE] };

function entry(reference, current) {
  return {
    city: reference,
    location: { ...reference.coordinates, formattedAddress: reference.displayName, confidence: 'High' },
    current,
    retrievedAt: '2026-09-03T00:00:00.000Z',
  };
}

// Singapore is deliberately absent from `results` so the "unavailable" path is covered.
export const weatherResponse = {
  results: [
    entry(SYDNEY, {
      observedAt: '2026-09-03T08:45:00+10:00',
      phrase: 'Sunny',
      iconCode: 1,
      isDayTime: true,
      hasPrecipitation: false,
      temperature: { value: 25.4, unit: 'C' },
      feelsLike: { value: 24.6, unit: 'C' },
      temperatureRange: { minimum: { value: 18.6, unit: 'C' }, maximum: { value: 28.9, unit: 'C' } },
      humidityPercent: 36,
      cloudCoverPercent: 0,
      uvIndex: 4,
      uvIndexPhrase: 'Moderate',
      visibility: { value: 16.1, unit: 'km' },
      wind: { speed: { value: 28.7, unit: 'km/h' }, directionDegrees: 292, directionLabel: 'WNW' },
    }),
    entry(MELBOURNE, {
      observedAt: '2026-09-03T08:40:00+10:00',
      phrase: 'Rain',
      iconCode: 18,
      isDayTime: true,
      hasPrecipitation: true,
      temperature: { value: 13.2, unit: 'C' },
      feelsLike: { value: 8.4, unit: 'C' },
      temperatureRange: { minimum: { value: 7.1, unit: 'C' }, maximum: { value: 19.3, unit: 'C' } },
      humidityPercent: 87,
      cloudCoverPercent: 90,
      uvIndex: 1,
      uvIndexPhrase: 'Low',
      visibility: { value: 6.4, unit: 'km' },
      wind: { speed: { value: 29.6, unit: 'km/h' }, directionDegrees: 270, directionLabel: 'W' },
    }),
  ],
  errors: [{ cityId: 'singapore', code: 'AZURE_MAPS_REQUEST_FAILED' }],
};

export const forecastResponse = {
  city: SYDNEY,
  location: { ...SYDNEY.coordinates, formattedAddress: 'Sydney' },
  summary: 'Pleasant Sunday',
  days: Array.from({ length: 7 }, (unused, index) => ({
    date: `2026-09-0${index + 3}T07:00:00+10:00`,
    iconCode: 1,
    phrase: 'Sunny',
    minimum: { value: 11.8, unit: 'C' },
    maximum: { value: 26.3, unit: 'C' },
    precipitationProbabilityPercent: 1,
    hoursOfSun: 9.5,
    wind: { speed: { value: 12, unit: 'km/h' }, directionLabel: 'W' },
  })),
  retrievedAt: '2026-09-03T00:00:00.000Z',
};
