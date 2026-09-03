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

function weatherEmoji(current) {
  if (!current) return '❓';
  return WEATHER_EMOJI[current.iconCode] ?? (current.isDayTime === false ? '🌙' : '🌡️');
}

function formatMeasurement(measurement, digits = 0) {
  if (!measurement || typeof measurement.value !== 'number') return '—';
  return `${measurement.value.toFixed(digits)}°${measurement.unit ?? ''}`;
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

  fragment.querySelector('.city-temp').textContent = formatMeasurement(current.temperature);
  fragment.querySelector('.city-phrase').textContent = current.phrase ?? '';
  fragment.querySelector('.city-feels').textContent = formatMeasurement(current.feelsLike);
  fragment.querySelector('.city-humidity').textContent =
    typeof current.humidityPercent === 'number' ? `${current.humidityPercent}%` : '—';

  return fragment;
}

function buildCountrySection(group, weatherByCityId) {
  const fragment = countryTemplate.content.cloneNode(true);
  const code = group.code.toLowerCase();

  const flag = fragment.querySelector('.country-flag');
  // Emoji flags render as plain letters ("AU") on Windows, so use real flag images.
  flag.src = `https://flagcdn.com/w40/${code}.png`;
  flag.srcset = `https://flagcdn.com/w80/${code}.png 2x`;
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

async function load() {
  refreshButton.disabled = true;
  dashboard.setAttribute('aria-busy', 'true');
  hideAlert();

  try {
    const [cityList, weather] = await Promise.all([fetchJson('/api/cities'), fetchJson('/api/weather')]);

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

refreshButton.addEventListener('click', load);
load();
