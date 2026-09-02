import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

process.env.AZURE_MAPS_SUBSCRIPTION_KEY = 'test-key-123';

const { default: app } = await import('../src/app.js');

let server;
let baseUrl;

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

  it('lists the supported cities', async () => {
    const response = await fetch(`${baseUrl}/api/cities`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.cities.some((city) => city.id === 'bangkok'));
    assert.deepEqual(Object.keys(body.cities[0]).sort(), ['countryRegion', 'displayName', 'id']);
  });

  it('rejects an unsupported city with the allowlist', async () => {
    const response = await fetch(`${baseUrl}/api/weather/atlantis`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'CITY_NOT_SUPPORTED');
    assert.ok(body.error.supported.includes('tokyo'));
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
  });
});
