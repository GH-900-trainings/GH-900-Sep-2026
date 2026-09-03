import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

process.env.AZURE_MAPS_KEY = 'test-key-123';

const { default: app } = await import('../src/app.js');

let server;
let baseUrl;

const geocodeResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { address: { formattedAddress: 'Mumbai, Maharashtra, India' }, confidence: 'High' },
      geometry: { type: 'Point', coordinates: [72.8777, 19.076] },
    },
  ],
};

const weatherResponse = {
  results: [{ dateTime: '2026-09-02T15:08:00+08:00', phrase: 'Cloudy', temperature: { value: 30.2, unit: 'C' } }],
};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('HTTP API', () => {
  it('reports health', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
  });

  it('lists the supported cities with their reference data', async () => {
    const response = await fetch(`${baseUrl}/api/cities`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.cities.length, 5);
    assert.deepEqual(
      [...new Set(body.cities.map((city) => city.countryName))].sort(),
      ['Australia', 'India', 'Singapore'],
    );

    const singapore = body.cities.find((city) => city.id === 'singapore');
    assert.deepEqual(Object.keys(singapore).sort(), [
      'coordinates',
      'countryName',
      'countryRegion',
      'displayName',
      'flag',
      'id',
      'timeZone',
    ]);
    assert.equal(singapore.timeZone, 'Asia/Singapore');
    assert.deepEqual(singapore.coordinates, { latitude: 1.3521, longitude: 103.8198 });
  });

  it('rejects an unsupported city with the allowlist', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=atlantis`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'CITY_NOT_SUPPORTED');
    assert.ok(body.error.supported.includes('mumbai'));
  });

  it('rejects an unsupported country', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=mumbai&country=Narnia`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'COUNTRY_NOT_SUPPORTED');
    assert.ok(body.error.supported.includes('India'));
  });

  it('rejects a blank country', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=mumbai&country=`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'COUNTRY_INVALID');
  });

  it('rejects a repeated country parameter', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=mumbai&country=India&country=AU`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'COUNTRY_INVALID');
  });

  it('rejects a supported city that is not in the requested country', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=mumbai&country=Australia`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'CITY_COUNTRY_MISMATCH');
  });

  it('rejects a blank city', async () => {
    const response = await fetch(`${baseUrl}/api/weather?city=%20`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'CITY_REQUIRED');
  });

  it('requires a city when only a country is given', async () => {
    const response = await fetch(`${baseUrl}/api/weather?country=India`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'CITY_REQUIRED');
  });

  it('returns weather for a supported city and country', async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const parsed = new URL(url);
      const body = parsed.pathname === '/geocode' ? geocodeResponse : weatherResponse;
      return { ok: true, status: 200, json: async () => body };
    };

    try {
      const response = await realFetch(`${baseUrl}/api/weather?city=mumbai&country=India`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.city.id, 'mumbai');
      assert.equal(body.city.countryName, 'India');
      assert.equal(body.city.timeZone, 'Asia/Kolkata');
      assert.equal(body.current.phrase, 'Cloudy');
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
  });
});
