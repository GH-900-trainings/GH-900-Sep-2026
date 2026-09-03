'use strict';

// Azure Maps iconCode -> emoji. Codes 33-44 are the night-time variants.
const WEATHER_EMOJI = {
  1: '☀️', 2: '🌤️', 3: '⛅', 4: '⛅', 5: '🌤️', 6: '🌥️', 7: '☁️', 8: '☁️',
  11: '🌫️', 12: '🌦️', 13: '🌦️', 14: '🌦️', 15: '⛈️', 16: '⛈️', 17: '⛈️',
  18: '🌧️', 19: '🌨️', 20: '🌨️', 21: '🌨️', 22: '❄️', 23: '❄️', 24: '🧊',
  25: '🌨️', 26: '🌧️', 29: '🌨️', 30: '🔥', 31: '🥶', 32: '💨',
  33: '🌙', 34: '🌙', 35: '☁️', 36: '☁️', 37: '🌫️', 38: '☁️',
  39: '🌦️', 40: '🌦️', 41: '⛈️', 42: '⛈️', 43: '🌨️', 44: '❄️',
};

const dashboard = document.getElementById('dashboard');
const alertBox = document.getElementById('alert');
const updatedLabel = document.getElementById('updated');
const refreshButton = document.getElementById('refresh');
const countryTemplate = document.getElementById('country-template');
const cityTemplate = document.getElementById('city-template');
const detail = document.getElementById('detail');
const dashControls = document.getElementById('dash-controls');
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const forecastTemplate = document.getElementById('forecast-template');
const forecastGrid = document.getElementById('forecast-days');
const forecastSummary = document.getElementById('forecast-summary');
const forecastButtons = [...document.querySelectorAll('[data-days]')];

const MAX_FORECAST_DAYS = 7;

const TILE_LAYER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

let map;
let cityIndex = new Map();
let forecastDays = [];
let selectedDays = 5;

function weatherEmoji(current) {
  if (!current) return '❓';
  return WEATHER_EMOJI[current.iconCode] ?? (current.isDayTime === false ? '🌙' : '🌡️');
}

function formatTemperature(measurement) {
  if (!measurement || typeof measurement.value !== 'number') return '—';
  return `${Math.round(measurement.value)}°${measurement.unit ?? ''}`;
}

function formatValue(measurement, digits = 1) {
  if (!measurement || typeof measurement.value !== 'number') return '—';
  return `${measurement.value.toFixed(digits)} ${measurement.unit ?? ''}`.trim();
}

function formatPercent(value) {
  return typeof value === 'number' ? `${value}%` : '—';
}

function flagSources(countryRegion) {
  const code = countryRegion.toLowerCase();
  // Emoji flags render as plain letters ("AU") on Windows, so use real flag images.
  return { src: `https://flagcdn.com/w40/${code}.png`, srcset: `https://flagcdn.com/w80/${code}.png 2x` };
}

function currentTheme() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
  themeLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

async function fetchJson(path) {
  const response = await fetch(path, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`);
  }
  return response.json();
}

// Preserves the backend's ordering rather than sorting alphabetically.
function groupByCountry(cities) {
  const groups = new Map();
  for (const city of cities) {
    if (!groups.has(city.countryName)) {
      groups.set(city.countryName, { name: city.countryName, code: city.countryRegion, cities: [] });
    }
    groups.get(city.countryName).cities.push(city);
  }
  return [...groups.values()];
}

function buildCityCard(city, entry) {
  const fragment = cityTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.city-card');
  const current = entry?.current;

  card.href = `#/city/${encodeURIComponent(city.id)}`;
  card.setAttribute('aria-label', `${city.displayName} weather detail`);
  fragment.querySelector('.city-name').textContent = city.displayName;

  const emoji = fragment.querySelector('.city-emoji');
  emoji.textContent = weatherEmoji(current);
  emoji.setAttribute('aria-label', current?.phrase ?? 'Weather unavailable');

  if (!current) {
    card.classList.add('is-unavailable');
    fragment.querySelector('.city-temp').textContent = '—';
    fragment.querySelector('.city-phrase').textContent = 'Currently unavailable';
    fragment.querySelector('.city-feels').textContent = '—';
    fragment.querySelector('.city-humidity').textContent = '—';
    return fragment;
  }

  fragment.querySelector('.city-temp').textContent = formatTemperature(current.temperature);
  fragment.querySelector('.city-phrase').textContent = current.phrase ?? '';
  fragment.querySelector('.city-feels').textContent = formatTemperature(current.feelsLike);
  fragment.querySelector('.city-humidity').textContent = formatPercent(current.humidityPercent);

  return fragment;
}

function buildCountrySection(group, weatherByCityId) {
  const fragment = countryTemplate.content.cloneNode(true);

  const flag = fragment.querySelector('.country-flag');
  const sources = flagSources(group.code);
  flag.src = sources.src;
  flag.srcset = sources.srcset;
  flag.alt = `Flag of ${group.name}`;

  fragment.querySelector('.country-name').textContent = group.name;
  fragment.querySelector('.country-count').textContent =
    `${group.cities.length} ${group.cities.length === 1 ? 'city' : 'cities'}`;

  const list = fragment.querySelector('.country-cities');
  for (const city of group.cities) {
    list.appendChild(buildCityCard(city, weatherByCityId.get(city.id)));
  }

  return fragment;
}

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove('d-none');
}

function hideAlert() {
  alertBox.textContent = '';
  alertBox.classList.add('d-none');
}

async function loadDashboard() {
  refreshButton.disabled = true;
  dashboard.setAttribute('aria-busy', 'true');
  hideAlert();

  try {
    const [cityList, weather] = await Promise.all([fetchJson('/api/cities'), fetchJson('/api/weather')]);

    cityIndex = new Map((cityList.cities ?? []).map((city) => [city.id, city]));
    const weatherByCityId = new Map((weather.results ?? []).map((entry) => [entry.city.id, entry]));

    dashboard.replaceChildren();
    for (const group of groupByCountry(cityList.cities ?? [])) {
      dashboard.appendChild(buildCountrySection(group, weatherByCityId));
    }

    updatedLabel.textContent = `Updated ${new Date().toLocaleTimeString()}`;

    if (weather.errors?.length) {
      const names = weather.errors.map((error) => error.cityId).join(', ');
      showAlert(`Weather is temporarily unavailable for: ${names}.`);
    }
  } catch (error) {
    console.error(error);
    dashboard.replaceChildren();
    showAlert('Could not load weather data. Check that the backend is running, then try Refresh.');
  } finally {
    dashboard.setAttribute('aria-busy', 'false');
    refreshButton.disabled = false;
  }
}

function renderStats(current) {
  const stats = document.getElementById('detail-stats');
  stats.replaceChildren();

  const rows = [
    ['Feels like', formatTemperature(current.feelsLike)],
    ['Min (last 24 h)', formatTemperature(current.temperatureRange?.minimum)],
    ['Max (last 24 h)', formatTemperature(current.temperatureRange?.maximum)],
    ['Humidity', formatPercent(current.humidityPercent)],
    ['Cloud cover', formatPercent(current.cloudCoverPercent)],
    ['Wind', current.wind?.speed ? `${formatValue(current.wind.speed)} ${current.wind.directionLabel ?? ''}`.trim() : '—'],
    ['UV index', current.uvIndex != null ? `${current.uvIndex} (${current.uvIndexPhrase ?? '—'})` : '—'],
    ['Visibility', formatValue(current.visibility)],
  ];

  for (const [label, value] of rows) {
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = value;
    stats.append(term, definition);
  }
}

function renderMap(city, location) {
  const coordinates = [location.latitude, location.longitude];

  // Leaflet cannot measure a hidden container, so the map is only built once #detail is visible.
  if (map) map.remove();
  map = L.map('map').setView(coordinates, 10);
  L.tileLayer(TILE_LAYER.url, { maxZoom: 18, attribution: TILE_LAYER.attribution }).addTo(map);

  L.marker(coordinates).addTo(map).bindPopup(city.displayName).openPopup();
  map.invalidateSize();
}

function renderForecast() {
  forecastGrid.replaceChildren();

  for (const day of forecastDays.slice(0, selectedDays)) {
    const fragment = forecastTemplate.content.cloneNode(true);
    const date = day.date ? new Date(day.date) : null;

    fragment.querySelector('.forecast-weekday').textContent = date
      ? date.toLocaleDateString(undefined, { weekday: 'short' })
      : '—';
    fragment.querySelector('.forecast-date').textContent = date
      ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      : '';

    const emoji = fragment.querySelector('.forecast-emoji');
    emoji.textContent = weatherEmoji(day);
    emoji.setAttribute('aria-label', day.phrase ?? 'Forecast');

    fragment.querySelector('.forecast-range').textContent =
      `${formatTemperature(day.maximum)} / ${formatTemperature(day.minimum)}`;
    fragment.querySelector('.forecast-phrase').textContent = day.phrase ?? '';
    fragment.querySelector('.forecast-rain').textContent =
      typeof day.precipitationProbabilityPercent === 'number'
        ? `💧 ${day.precipitationProbabilityPercent}%`
        : '';

    forecastGrid.appendChild(fragment);
  }

  for (const button of forecastButtons) {
    button.classList.toggle('active', Number(button.dataset.days) === selectedDays);
    button.setAttribute('aria-pressed', String(Number(button.dataset.days) === selectedDays));
  }
}

async function loadDetail(cityId) {
  hideAlert();
  detail.setAttribute('aria-busy', 'true');

  try {
    if (cityIndex.size === 0) {
      const cityList = await fetchJson('/api/cities');
      cityIndex = new Map((cityList.cities ?? []).map((city) => [city.id, city]));
    }
    if (!cityIndex.has(cityId)) {
      showAlert(`"${cityId}" is not a supported city.`);
      location.hash = '#/';
      return;
    }

    const entry = await fetchJson(`/api/weather/${encodeURIComponent(cityId)}`);
    const { city, current } = entry;

    const flag = document.getElementById('detail-flag');
    const sources = flagSources(city.countryRegion);
    flag.src = sources.src;
    flag.srcset = sources.srcset;
    flag.alt = `Flag of ${city.countryName}`;

    document.getElementById('detail-city').textContent = city.displayName;
    document.getElementById('detail-country').textContent = city.countryName;
    document.getElementById('detail-temp').textContent = formatTemperature(current.temperature);
    document.getElementById('detail-phrase').textContent = current.phrase ?? '';

    const emoji = document.getElementById('detail-emoji');
    emoji.textContent = weatherEmoji(current);
    emoji.setAttribute('aria-label', current.phrase ?? 'Current conditions');

    document.getElementById('detail-observed').textContent = current.observedAt
      ? `Observed ${new Date(current.observedAt).toLocaleString()} · local time in ${city.timeZone}`
      : '';

    renderStats(current);
    renderMap(city, entry.location);

    // Always fetch the longest range, so switching 5 <-> 7 days needs no extra request.
    forecastGrid.replaceChildren();
    forecastSummary.textContent = '';
    const forecast = await fetchJson(`/api/forecast/${encodeURIComponent(cityId)}?days=${MAX_FORECAST_DAYS}`);
    forecastDays = forecast.days ?? [];
    forecastSummary.textContent = forecast.summary ?? '';
    renderForecast();
  } catch (error) {
    console.error(error);
    showAlert('Could not load this city. Try again, or go back to the dashboard.');
  } finally {
    detail.setAttribute('aria-busy', 'false');
  }
}

function showView(name) {
  const onDetail = name === 'detail';
  detail.classList.toggle('d-none', !onDetail);
  dashboard.classList.toggle('d-none', onDetail);
  dashControls.classList.toggle('d-none', onDetail);
  window.scrollTo(0, 0);
}

function route() {
  const match = /^#\/city\/(.+)$/.exec(location.hash);
  if (match) {
    showView('detail');
    loadDetail(decodeURIComponent(match[1]));
    return;
  }

  showView('dashboard');
  if (map) {
    map.remove();
    map = undefined;
  }
}

refreshButton.addEventListener('click', loadDashboard);
window.addEventListener('hashchange', route);

themeToggle.addEventListener('click', () => {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
});

for (const button of forecastButtons) {
  button.addEventListener('click', () => {
    selectedDays = Number(button.dataset.days);
    renderForecast();
  });
}

applyTheme(currentTheme());
loadDashboard().then(route);
