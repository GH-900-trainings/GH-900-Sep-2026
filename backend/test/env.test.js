import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Ignore any local .env so the "missing key" case is deterministic on a developer machine.
process.env.DOTENV_CONFIG_PATH = '/nonexistent/.env';

// Each import specifier gets its own module instance, so env can be re-read per case.
describe('assertConfig', () => {
  it('fails fast when no key is set', async () => {
    delete process.env.AZURE_MAPS_KEY;
    delete process.env.AZURE_MAPS_SUBSCRIPTION_KEY;

    const { assertConfig } = await import('../src/config/env.js?case=missing');

    assert.throws(assertConfig, /AZURE_MAPS_KEY is required/);
  });

  it('accepts AZURE_MAPS_KEY', async () => {
    process.env.AZURE_MAPS_KEY = 'test-key-123';

    const { assertConfig, config } = await import('../src/config/env.js?case=current');

    assert.doesNotThrow(assertConfig);
    assert.equal(config.subscriptionKey, 'test-key-123');
  });

  it('still accepts the legacy AZURE_MAPS_SUBSCRIPTION_KEY', async () => {
    delete process.env.AZURE_MAPS_KEY;
    process.env.AZURE_MAPS_SUBSCRIPTION_KEY = 'legacy-key-123';

    const { assertConfig, config } = await import('../src/config/env.js?case=legacy');

    assert.doesNotThrow(assertConfig);
    assert.equal(config.subscriptionKey, 'legacy-key-123');
  });
});
