# GH-900-Sep-2026

Node.js backend that returns current weather for a fixed list of cities across Australia, Singapore,
South Africa, The Philippines and India, using
[Azure Maps](https://learn.microsoft.com/azure/azure-maps/) for both geocoding and weather data.

Each request resolves the city to coordinates with the Azure Maps **Geocoding** API, then reads
**current conditions** from the Azure Maps **Weather** API with those coordinates.
There is no caching layer — every request calls Azure Maps directly.

## Prerequisites

- Node.js 20 or newer
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

| City id | City | Country |
| --- | --- | --- |
| `sydney` | Sydney | 🇦🇺 Australia |
| `singapore` | Singapore | 🇸🇬 Singapore |
| `cape-town` | Cape Town | 🇿🇦 South Africa |
| `manila` | Manila | 🇵🇭 The Philippines |
| `new-delhi` | New Delhi | 🇮🇳 India |

The city is matched against this allowlist, so caller input is never forwarded to Azure Maps.
`country` is optional and accepts the country name or its ISO code (`PH`, `philippines`,
`The Philippines`). Errors are returned as `{ "error": { "code", "message" } }`:

| Case | Status | Code |
| --- | --- | --- |
| `city` missing or blank | `400` | `CITY_REQUIRED` |
| Unsupported city | `404` | `CITY_NOT_SUPPORTED` |
| Unsupported country | `404` | `COUNTRY_NOT_SUPPORTED` |
| Supported city that is not in the requested country | `400` | `CITY_COUNTRY_MISMATCH` |

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/cities
curl "http://localhost:3000/api/weather?city=manila&country=The%20Philippines"
curl http://localhost:3000/api/weather/sydney
curl http://localhost:3000/api/weather
```

`GET /api/weather?city=manila` responds with:

```json
{
  "city": {
    "id": "manila",
    "displayName": "Manila",
    "countryRegion": "PH",
    "countryName": "The Philippines",
    "flag": "🇵🇭",
    "coordinates": { "latitude": 14.5995, "longitude": 120.9842 },
    "timeZone": "Asia/Manila"
  },
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842,
    "formattedAddress": "Manila, Philippines",
    "confidence": "High"
  },
  "current": {
    "observedAt": "2026-09-02T15:08:00+08:00",
    "phrase": "Cloudy",
    "temperature": { "value": 31.4, "unit": "C" },
    "feelsLike": { "value": 36.1, "unit": "C" },
    "humidityPercent": 75,
    "wind": { "speed": { "value": 3.6, "unit": "km/h" }, "directionDegrees": 315, "directionLabel": "NW" }
  },
  "retrievedAt": "2026-09-02T08:08:12.345Z"
}
```

`GET /api/weather` uses `Promise.allSettled`, so one failing city is reported in `errors` instead of
failing the whole response.

## Project layout

```
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
