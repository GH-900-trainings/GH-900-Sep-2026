import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { citiesResponse, forecastResponse, weatherResponse } from '../test-utils/fixtures.js';
import { apiResponder, renderApp, textOf, waitFor } from '../test-utils/render.js';

describe('dashboard rendering', () => {
  let document;
  let requests;

  before(async () => {
    const rendered = await renderApp({
      respond: apiResponder({ cities: citiesResponse, weather: weatherResponse, forecast: forecastResponse }),
    });
    document = rendered.document;
    requests = rendered.requests;

    await waitFor(() => document.querySelectorAll('#dashboard .city-card').length === 3, 'city cards to render');
  });

  it('reads its data only from the backend API', () => {
    assert.ok(requests.includes('/api/cities'));
    assert.ok(requests.includes('/api/weather'));
    assert.equal(
      requests.filter((url) => url.includes('atlas.microsoft.com')).length,
      0,
      'the browser must never call Azure Maps directly',
    );
  });

  it('groups the cities under their country, preserving backend order', () => {
    assert.deepEqual(textOf(document.querySelectorAll('#dashboard .country-name')), ['Australia', 'Singapore']);
    assert.deepEqual(textOf(document.querySelectorAll('#dashboard .country-count')), ['2 cities', '1 city']);
    assert.deepEqual(textOf(document.querySelectorAll('#dashboard .city-name')), ['Sydney', 'Melbourne', 'Singapore']);
  });

  it('shows each country as a flag image rather than a text acronym', () => {
    const [australia, singapore] = document.querySelectorAll('#dashboard .country-flag');

    assert.equal(australia.tagName, 'IMG');
    assert.match(australia.getAttribute('src'), /flagcdn\.com\/w40\/au\.png$/);
    assert.equal(australia.getAttribute('alt'), 'Flag of Australia');
    assert.match(singapore.getAttribute('src'), /flagcdn\.com\/w40\/sg\.png$/);

    // Regression guard: emoji flags render as the letters "AU"/"SG" on Windows.
    assert.doesNotMatch(document.getElementById('dashboard').textContent, /\bAU\b|\bSG\b/);
  });

  it('binds the temperature, rounded, to each card', () => {
    const [sydney, melbourne] = document.querySelectorAll('#dashboard .city-card');

    assert.equal(sydney.querySelector('.city-temp').textContent, '25°C');
    assert.equal(melbourne.querySelector('.city-temp').textContent, '13°C');
    assert.equal(sydney.querySelector('.city-feels').textContent, '25°C');
    assert.equal(sydney.querySelector('.city-humidity').textContent, '36%');
  });

  it('maps the Azure Maps iconCode to a weather emoji', () => {
    const [sydney, melbourne] = document.querySelectorAll('#dashboard .city-card');

    assert.equal(sydney.querySelector('.city-emoji').textContent, '☀️');
    assert.equal(sydney.querySelector('.city-emoji').getAttribute('aria-label'), 'Sunny');
    assert.equal(melbourne.querySelector('.city-emoji').textContent, '🌧️');
    assert.equal(melbourne.querySelector('.city-phrase').textContent, 'Rain');
  });

  it('marks a city whose weather failed as unavailable instead of dropping it', () => {
    const singapore = [...document.querySelectorAll('#dashboard .city-card')].at(-1);

    assert.ok(singapore.classList.contains('is-unavailable'));
    assert.equal(singapore.querySelector('.city-temp').textContent, '—');
    assert.equal(singapore.querySelector('.city-phrase').textContent, 'Currently unavailable');
  });

  it('warns about the cities the backend could not resolve', () => {
    const alertBox = document.getElementById('alert');

    assert.ok(!alertBox.classList.contains('d-none'));
    assert.match(alertBox.textContent, /singapore/);
  });
});
