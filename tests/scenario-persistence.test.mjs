import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SCENARIO_SCHEMA_VERSION,
  loadFiltersFromURL,
  sanitizeScenarioPayload,
} from '../src/scenarioPersistence.js';

test('sanitizeScenarioPayload drops non-scalar values', () => {
  const payload = sanitizeScenarioPayload({
    mortgageRate: 2.3,
    presetName: 'Base',
    nested: { nope: true },
    arrayValue: [1, 2, 3],
  });

  assert.deepEqual(payload, {
    mortgageRate: 2.3,
    presetName: 'Base',
  });
});

test('loadFiltersFromURL rejects schema-version mismatch', () => {
  global.window = {
    location: {
      search: `?filters=${encodeURIComponent(JSON.stringify({
        schemaVersion: SCENARIO_SCHEMA_VERSION + 1,
        payload: { mortgageRate: 9.9 },
      }))}`,
    },
  };

  assert.equal(loadFiltersFromURL(), null);
  delete global.window;
});
