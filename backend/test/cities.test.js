import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SUPPORTED_CITIES,
  SUPPORTED_CITY_IDS,
  SUPPORTED_COUNTRIES,
  findCity,
  findCountry,
} from '../src/config/cities.js';

describe('findCity', () => {
  it('matches an exact id', () => {
    assert.equal(findCity('singapore')?.displayName, 'Singapore');
  });

  it('normalizes case, padding and spaces', () => {
    assert.equal(findCity('  New Delhi ')?.id, 'new-delhi');
    assert.equal(findCity('MUMBAI')?.id, 'mumbai');
  });

  it('returns undefined for unsupported or non-string input', () => {
    assert.equal(findCity('atlantis'), undefined);
    assert.equal(findCity(''), undefined);
    assert.equal(findCity(undefined), undefined);
    assert.equal(findCity(['singapore']), undefined);
  });

  it('exposes ids that all resolve back to a city', () => {
    assert.equal(SUPPORTED_CITY_IDS.length, SUPPORTED_CITIES.length);
    for (const id of SUPPORTED_CITY_IDS) {
      assert.ok(findCity(id), `${id} should resolve`);
    }
  });
});

describe('findCountry', () => {
  it('matches a country name and an ISO code', () => {
    assert.equal(findCountry('Australia'), 'Australia');
    assert.equal(findCountry('in'), 'India');
    assert.equal(findCountry('sg'), 'Singapore');
    assert.equal(findCountry('india'), 'India');
  });

  it('returns undefined for unsupported or non-string input', () => {
    assert.equal(findCountry('Narnia'), undefined);
    assert.equal(findCountry(''), undefined);
    assert.equal(findCountry(undefined), undefined);
  });
});

describe('reference data', () => {
  it('covers the three supported countries', () => {
    assert.deepEqual([...SUPPORTED_COUNTRIES].sort(), ['Australia', 'India', 'Singapore']);
  });

  it('carries a flag, coordinates and a time zone for every city', () => {
    for (const city of SUPPORTED_CITIES) {
      assert.ok(city.flag, `${city.id} should have a flag`);
      assert.equal(typeof city.coordinates.latitude, 'number');
      assert.equal(typeof city.coordinates.longitude, 'number');
      assert.ok(city.timeZone.includes('/'), `${city.id} should have an IANA time zone`);
      assert.match(city.countryRegion, /^[A-Z]{2}$/);
    }
  });
});
