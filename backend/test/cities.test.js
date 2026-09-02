import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SUPPORTED_CITIES, SUPPORTED_CITY_IDS, findCity } from '../src/config/cities.js';

describe('findCity', () => {
  it('matches an exact id', () => {
    assert.equal(findCity('bangkok')?.displayName, 'Bangkok');
  });

  it('normalizes case, padding and spaces', () => {
    assert.equal(findCity('  New York ')?.id, 'new-york');
    assert.equal(findCity('NEW_YORK')?.id, 'new-york');
  });

  it('returns undefined for unsupported or non-string input', () => {
    assert.equal(findCity('atlantis'), undefined);
    assert.equal(findCity(''), undefined);
    assert.equal(findCity(undefined), undefined);
    assert.equal(findCity(['bangkok']), undefined);
  });

  it('exposes ids that all resolve back to a city', () => {
    assert.equal(SUPPORTED_CITY_IDS.length, SUPPORTED_CITIES.length);
    for (const id of SUPPORTED_CITY_IDS) {
      assert.ok(findCity(id), `${id} should resolve`);
    }
  });
});
