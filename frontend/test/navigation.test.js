import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { citiesResponse, forecastResponse, weatherResponse } from '../test-utils/fixtures.js';
import { apiResponder, renderApp, waitFor } from '../test-utils/render.js';

const respond = apiResponder({
  cities: citiesResponse,
  weather: weatherResponse,
  forecast: forecastResponse,
});

async function renderDashboard(route = '#/') {
  const rendered = await renderApp({ route, respond });
  await waitFor(
    () => rendered.document.querySelectorAll('#dashboard .city-card').length === 3,
    'city cards to render',
  );
  return rendered;
}

describe('city card navigation', () => {
  it('renders each card as a link to that city detail route', async () => {
    const { document } = await renderDashboard();

    const hrefs = [...document.querySelectorAll('#dashboard .city-card')].map((card) => card.getAttribute('href'));
    assert.deepEqual(hrefs, ['#/city/sydney', '#/city/melbourne', '#/city/singapore']);

    // Anchors keep keyboard and middle-click behaviour that a click handler on a div would lose.
    for (const card of document.querySelectorAll('#dashboard .city-card')) {
      assert.equal(card.tagName, 'A');
      assert.match(card.getAttribute('aria-label'), /weather detail$/);
    }
  });

  it('opens the detail view when a card is clicked', async () => {
    const { window, document } = await renderDashboard();

    document.querySelector('#dashboard .city-card').click();
    await waitFor(() => document.getElementById('detail-city').textContent === 'Sydney', 'the detail view to load');

    assert.equal(window.location.hash, '#/city/sydney');
    assert.ok(document.getElementById('dashboard').classList.contains('d-none'), 'dashboard should be hidden');
    assert.ok(!document.getElementById('detail').classList.contains('d-none'), 'detail should be visible');
    assert.equal(document.getElementById('detail-country').textContent, 'Australia');
    assert.equal(document.getElementById('detail-temp').textContent, '25°C');
  });

  it('requests only that city when the detail view opens', async () => {
    const { document, requests } = await renderDashboard();

    document.querySelector('#dashboard .city-card').click();
    await waitFor(() => requests.some((url) => url.startsWith('/api/forecast/')), 'the forecast request');

    assert.ok(requests.includes('/api/weather/sydney'));
    assert.ok(requests.includes('/api/forecast/sydney?days=7'));
  });

  it('returns to the dashboard from the back link', async () => {
    const { document } = await renderDashboard();

    document.querySelector('#dashboard .city-card').click();
    await waitFor(() => document.getElementById('detail-city').textContent === 'Sydney', 'the detail view to load');

    document.querySelector('#detail a[href="#/"]').click();
    await waitFor(
      () => !document.getElementById('dashboard').classList.contains('d-none'),
      'the dashboard to come back',
    );

    assert.ok(document.getElementById('detail').classList.contains('d-none'));
  });

  it('renders the requested detail route on a cold load', async () => {
    const { document } = await renderApp({ route: '#/city/melbourne', respond });

    await waitFor(() => document.getElementById('detail-city').textContent === 'Melbourne', 'Melbourne detail');

    assert.equal(document.getElementById('detail-temp').textContent, '13°C');
    assert.equal(document.getElementById('detail-emoji').textContent, '🌧️');
  });

  it('shows five forecast days by default and seven on request', async () => {
    const { document } = await renderDashboard('#/city/sydney');

    await waitFor(() => document.querySelectorAll('.forecast-card').length === 5, 'the 5-day forecast');
    assert.equal(document.getElementById('forecast-summary').textContent, 'Pleasant Sunday');

    document.querySelector('[data-days="7"]').click();
    assert.equal(document.querySelectorAll('.forecast-card').length, 7);
  });
});
