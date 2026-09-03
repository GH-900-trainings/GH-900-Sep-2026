import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Leaflet comes from a CDN in the browser; the tests only need it not to explode.
function fakeLeaflet() {
  const layer = { addTo: () => layer, bindPopup: () => layer, openPopup: () => layer, remove() {} };
  const map = { setView: () => map, invalidateSize() {}, remove() {} };
  return { map: () => map, tileLayer: () => layer, marker: () => layer };
}

export function apiResponder({ cities, weather, forecast }) {
  return (url) => {
    if (url.startsWith('/api/cities')) return cities;
    if (url.startsWith('/api/forecast/')) return forecast;
    if (url.startsWith('/api/weather/')) {
      const id = decodeURIComponent(url.slice('/api/weather/'.length).split('?')[0]);
      return weather.results.find((entry) => entry.city.id === id);
    }
    return weather;
  };
}

export async function renderApp({ route = '#/', respond }) {
  const html = await readFile(path.join(frontendDir, 'index.html'), 'utf8');
  const source = await readFile(path.join(frontendDir, 'app.js'), 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: `http://localhost:3000/${route}`,
    beforeParse(window) {
      // jsdom implements neither, and the theme script and router both need them.
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      window.scrollTo = () => {};
    },
  });

  const { window } = dom;
  const requests = [];
  window.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    return { ok: true, status: 200, json: async () => respond(url) };
  };
  window.L = fakeLeaflet();

  // index.html loads app.js from a CDN-free <script src>, which jsdom does not fetch.
  const script = window.document.createElement('script');
  script.textContent = source;
  window.document.body.appendChild(script);

  return { window, document: window.document, requests };
}

export async function waitFor(condition, description, timeoutMs = 3000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${description}`);
}

export function textOf(nodes) {
  return [...nodes].map((node) => node.textContent.trim());
}
