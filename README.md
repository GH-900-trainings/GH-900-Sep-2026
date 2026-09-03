# GH-900-Sep-2026

Node.js backend and Bootstrap dashboard showing current weather for a fixed list of cities across
Australia, Singapore, India, The Philippines and South Africa, using
[Azure Maps](https://learn.microsoft.com/azure/azure-maps/) for both geocoding and weather data.

Each request resolves the city to coordinates with the Azure Maps **Geocoding** API, then reads
**current conditions** from the Azure Maps **Weather** API with those coordinates.
There is no caching layer — every request calls Azure Maps directly.

## Prerequisites

- Node.js 24 or newer
- An Azure Maps account and its subscription key
  (Azure portal → your Azure Maps account → *Authentication* → *Primary Key*)

## Setup

```powershell
cd backend
Copy-Item .env.example .env    # macOS/Linux: cp .env.example .env
# edit .env and set AZURE_MAPS_KEY
npm install
npm start
```

The server refuses to start if `AZURE_MAPS_KEY` is missing. The key is only ever read
from the environment, is never written to a source file, and is never returned in a response or an
error message. `.env` is gitignored.

Other scripts: `npm run dev` (restart on change), `npm test`.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `AZURE_MAPS_KEY` | yes | — | Azure Maps shared key (legacy name `AZURE_MAPS_SUBSCRIPTION_KEY` still works) |
| `PORT` | no | `3000` | Local listen port |
| `AZURE_MAPS_BASE_URL` | no | `https://atlas.microsoft.com` | Azure Maps host |
| `AZURE_MAPS_GEOCODE_API_VERSION` | no | `2025-01-01` | Geocoding API version |
| `AZURE_MAPS_WEATHER_API_VERSION` | no | `1.1` | Weather API version |
| `WEATHER_UNITS` | no | `metric` | `metric` or `imperial` |
| `HTTP_TIMEOUT_MS` | no | `8000` | Per-call timeout to Azure Maps |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/api/cities` | Reference data (flag, coordinates, time zone) for the supported cities |
| GET | `/api/weather?city={city}&country={country}` | Current weather for one supported city |
| GET | `/api/weather/:city` | Same, with the city in the path |
| GET | `/api/weather` | Current weather for every supported city |
| GET | `/api/forecast/:city?days={1-10}` | Daily forecast, `days` defaults to 5 |

| City id | City | Country |
| --- | --- | --- |
| `sydney` | Sydney | Australia |
| `melbourne` | Melbourne | Australia |
| `singapore` | Singapore | Singapore |
| `mumbai` | Mumbai | India |
| `new-delhi` | New Delhi | India |
| `manila` | Manila | The Philippines |
| `cape-town` | Cape Town | South Africa |

The city is matched against this allowlist, so caller input is never forwarded to Azure Maps.
`country` is optional and accepts the country name or its ISO code (`PH`, `philippines`,
`The Philippines`). Errors are returned as `{ "error": { "code", "message" } }`:

| Case | Status | Code |
| --- | --- | --- |
| `city` missing or blank | `400` | `CITY_REQUIRED` |
| Unsupported city | `404` | `CITY_NOT_SUPPORTED` |
| Unsupported country | `404` | `COUNTRY_NOT_SUPPORTED` |
| Supported city that is not in the requested country | `400` | `CITY_COUNTRY_MISMATCH` |
| `days` outside 1-10 | `400` | `DAYS_INVALID` |

Azure Maps only accepts a `duration` of 1, 5, 10, 15, 25 or 45 days, so `/api/forecast` asks for the
smallest supported duration that covers `days` and trims the result. A 7-day request is therefore one
call with `duration=10`.

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/cities
curl "http://localhost:3000/api/weather?city=mumbai&country=India"
curl http://localhost:3000/api/weather/sydney
curl http://localhost:3000/api/weather
```

`GET /api/weather?city=mumbai` responds with:

```json
{
  "city": {
    "id": "mumbai",
    "displayName": "Mumbai",
    "countryRegion": "IN",
    "countryName": "India",
    "flag": "🇮🇳",
    "coordinates": { "latitude": 19.076, "longitude": 72.8777 },
    "timeZone": "Asia/Kolkata"
  },
  "location": {
    "latitude": 19.076,
    "longitude": 72.8777,
    "formattedAddress": "Mumbai, Maharashtra, India",
    "confidence": "High"
  },
  "current": {
    "observedAt": "2026-09-02T15:08:00+08:00",
    "phrase": "Cloudy",
    "temperature": { "value": 31.4, "unit": "C" },
    "feelsLike": { "value": 36.1, "unit": "C" },
    "temperatureRange": {
      "minimum": { "value": 27.2, "unit": "C" },
      "maximum": { "value": 33.8, "unit": "C" }
    },
    "humidityPercent": 75,
    "wind": { "speed": { "value": 3.6, "unit": "km/h" }, "directionDegrees": 315, "directionLabel": "NW" }
  },
  "retrievedAt": "2026-09-02T08:08:12.345Z"
}
```

`GET /api/weather` uses `Promise.allSettled`, so one failing city is reported in `errors` instead of
failing the whole response.

## Dashboard

Start the backend and open <http://localhost:3000/> — Express serves the dashboard from `frontend/`,
so it is same-origin with the API.

Cities are grouped under their country with the national flag, and each card shows the current
temperature plus a weather emoji derived from the Azure Maps `iconCode`. The layout is Bootstrap 5
(CDN, with an SRI hash): one card per row on mobile, two from 768px, three from 1200px.

Clicking a city opens its detail view at `#/city/<id>`, which adds the condition description,
min/max temperature over the last 24 hours, humidity, cloud cover, wind, UV index and visibility,
plus the city plotted on a [Leaflet](https://leafletjs.com/) map with OpenStreetMap tiles, and a
**5-day / 7-day forecast** (fetched once at 7 days, so switching between them needs no new request).
"← Back to dashboard" and the browser Back button both return to the grid.

The header has a light/dark theme toggle built on Bootstrap's `data-bs-theme` colour modes. It
follows `prefers-color-scheme` on first visit, remembers the choice in `localStorage`, and is applied
by a tiny inline script before first paint so the page never flashes the wrong theme. In dark mode
the OpenStreetMap tiles are darkened with a CSS filter, since the dark tile providers now require
their own API key.

Leaflet is used rather than the Azure Maps Web SDK because the Web SDK needs a credential in the
browser; OpenStreetMap tiles need none, so the subscription key stays on the server.

The page calls only `/api/cities`, `/api/weather`, `/api/weather/:city` and `/api/forecast/:city`.
It never talks to Azure Maps directly.

Flags are rendered as images from `flagcdn.com` rather than 🇦🇺-style emoji, because Windows renders
regional-indicator emoji as plain letters ("AU"), which would show a text acronym instead of a flag.

## Project layout

```
frontend/       dashboard served statically by the backend
  index.html    Bootstrap layout, card templates and the detail view
  app.js        hash routing, data fetching, country grouping, Leaflet map
  styles.css    flat card styling on top of Bootstrap
backend/
  src/
    config/     env parsing + the supported-city reference data / allowlist
    services/   Azure Maps client, geocoding, weather, orchestration
    routes/     health, cities, weather
    middleware/ async wrapper + central error handler
    app.js      Express app (no listen, so tests can import it)
    server.js   config check, listen, graceful shutdown
  test/         node:test suites with a stubbed fetch
```
