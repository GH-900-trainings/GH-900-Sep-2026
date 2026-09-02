import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

process.env.AZURE_MAPS_KEY = 'test-key-123';
process.env.WEATHER_UNITS = 'metric';

const { findCity } = await import('../src/config/cities.js');
const { AzureMapsError } = await import('../src/errors/AppError.js');
const { geocodeCity } = await import('../src/services/geocodingService.js');
const { getCurrentConditions } = await import('../src/services/weatherService.js');

const realFetch = globalThis.fetch;
const requestedUrls = [];

function stubFetch(status, body) {
  requestedUrls.length = 0;
  globalThis.fetch = async (url) => {
    requestedUrls.push(new URL(url));
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

const geocodeResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { address: { formattedAddress: 'Singapore' }, confidence: 'High' },
      geometry: { type: 'Point', coordinates: [103.8198, 1.3521] },
    },
  ],
};

const weatherResponse = {
  results: [
    {
      dateTime: '2026-09-02T15:08:00+07:00',
      phrase: 'Cloudy',
      iconCode: 7,
      isDayTime: true,
      hasPrecipitation: false,
      temperature: { value: 31.4, unit: 'C', unitType: 17 },
      realFeelTemperature: { value: 36.1, unit: 'C', unitType: 17 },
      relativeHumidity: 75,
      cloudCover: 95,
      uvIndex: 3,
      uvIndexPhrase: 'Moderate',
      visibility: { value: 8, unit: 'km', unitType: 6 },
      wind: { speed: { value: 3.6, unit: 'km/h', unitType: 7 }, direction: { degrees: 315, localizedDescription: 'NW' } },
    },
  ],
};

describe('geocodeCity', () => {
  it('maps GeoJSON [longitude, latitude] onto the right fields', async () => {
    stubFetch(200, geocodeResponse);

    const location = await geocodeCity(findCity('singapore'));

    assert.equal(location.latitude, 1.3521);
    assert.equal(location.longitude, 103.8198);
    assert.equal(location.formattedAddress, 'Singapore');
  });

  it('sends the api-version, the allowlisted query and the subscription key', async () => {
    stubFetch(200, geocodeResponse);
    await geocodeCity(findCity('singapore'));

    const [url] = requestedUrls;
    assert.equal(url.pathname, '/geocode');
    assert.equal(url.searchParams.get('api-version'), '2025-01-01');
    assert.equal(url.searchParams.get('query'), 'Singapore');
    assert.equal(url.searchParams.get('subscription-key'), 'test-key-123');
    assert.equal(
      url.searchParams.get('countryRegion'),
      null,
      'Azure Maps returns 400 "Conflicting Parameters" if countryRegion is sent with query',
    );
  });

  it('fails cleanly when Azure Maps returns no features', async () => {
    stubFetch(200, { type: 'FeatureCollection', features: [] });

    await assert.rejects(() => geocodeCity(findCity('manila')), (error) => error.code === 'GEOCODE_NO_RESULT');
  });
});

describe('getCurrentConditions', () => {
  it('queries with "latitude,longitude" order', async () => {
    stubFetch(200, weatherResponse);
    await getCurrentConditions({ latitude: 1.3521, longitude: 103.8198 });

    const [url] = requestedUrls;
    assert.equal(url.pathname, '/weather/currentConditions/json');
    assert.equal(url.searchParams.get('query'), '1.3521,103.8198');
    assert.equal(url.searchParams.get('unit'), 'metric');
    assert.equal(url.searchParams.get('api-version'), '1.1');
  });

  it('projects the observation onto a trimmed DTO', async () => {
    stubFetch(200, weatherResponse);
    const current = await getCurrentConditions({ latitude: 1.3521, longitude: 103.8198 });

    assert.deepEqual(current.temperature, { value: 31.4, unit: 'C' });
    assert.deepEqual(current.feelsLike, { value: 36.1, unit: 'C' });
    assert.equal(current.humidityPercent, 75);
    assert.equal(current.phrase, 'Cloudy');
    assert.deepEqual(current.wind, {
      speed: { value: 3.6, unit: 'km/h' },
      directionDegrees: 315,
      directionLabel: 'NW',
    });
    assert.equal(current.realFeelTemperature, undefined, 'raw upstream fields should not leak through');
  });
});

describe('Azure Maps error handling', () => {
  it('throws AzureMapsError without ever exposing the subscription key', async () => {
    stubFetch(401, { error: { code: 'Unauthorized', message: 'Invalid key' } });

    await assert.rejects(
      () => geocodeCity(findCity('cape-town')),
      (error) => {
        assert.ok(error instanceof AzureMapsError);
        assert.equal(error.httpStatus, 500, '401 upstream must not surface as 401 to our caller');
        assert.ok(!error.message.includes('test-key-123'));
        assert.ok(!error.message.includes('subscription-key'));
        return true;
      },
    );
  });

  it('maps upstream throttling to 503', async () => {
    stubFetch(429, { error: { code: 'TooManyRequests', message: 'Rate limited' } });

    await assert.rejects(() => geocodeCity(findCity('sydney')), (error) => error.httpStatus === 503);
  });
});
