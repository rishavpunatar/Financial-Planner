import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  validatePrecomputedOptimizerPayload,
  validateRobustnessReport,
} from '../src/reportValidation.js';

const repoRoot = process.cwd();

test('precomputed optimizer payload validates and has objective bundles', async () => {
  const payload = validatePrecomputedOptimizerPayload(JSON.parse(
    await readFile(path.join(repoRoot, 'public', 'precomputed-optimizer-results.json'), 'utf8'),
  ));
  const standardVariant = payload.variants.standard;

  assert.ok(standardVariant.searchMeta.testedScenarioCount > 0);
  assert.ok(standardVariant.caseResults.length > 0);
  standardVariant.caseResults.forEach((caseResult) => {
    assert.ok(caseResult.objectiveResults.netWorth);
    assert.ok(caseResult.objectiveResults.cashEnd);
  });
});

test('robustness report validates and leader ids exist in strategy catalog', async () => {
  const report = validateRobustnessReport(JSON.parse(
    await readFile(path.join(repoRoot, 'public', 'robustness-analysis', 'report.json'), 'utf8'),
  ));
  const strategyIds = new Set(report.strategyCatalog.map((strategy) => strategy.strategyId));

  assert.ok(report.topStrategies.length > 0);
  report.topStrategies.forEach((strategy) => {
    assert.ok(strategyIds.has(strategy.strategyId));
  });

  Object.values(report.objectiveLeaders).forEach((pathLeaders) => {
    Object.values(pathLeaders).forEach((leaderId) => {
      if (leaderId) {
        assert.ok(strategyIds.has(leaderId));
      }
    });
  });
});
