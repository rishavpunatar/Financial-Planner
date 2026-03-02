import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOptimizerSummaryMarkdown,
  buildPlannerSummaryMarkdown,
  buildRobustnessSummaryMarkdown,
} from '../src/exportSummaries.js';

test('planner summary markdown includes outcome and warnings sections', () => {
  const markdown = buildPlannerSummaryMarkdown({
    presetName: 'Base case',
    shareUrl: 'https://example.com',
    endAge: 70,
    metrics: {
      cashEnd: '£250k',
      finalPropertyValue: '£1.20M',
      finalMortgageBalance: '£0',
      totalMortgagePayments: '£600k',
      lifetimeInterestPaid: '£220k',
      minIsaBalance: '£75k',
      minLiquidBufferPost2032: '£55k',
    },
    currentInputs: ['First house £850k in 2027'],
    warnings: ['No breach'],
    assumptions: ['Model ends at age 70.'],
  });

  assert.match(markdown, /## Outcome/);
  assert.match(markdown, /## Warnings/);
  assert.match(markdown, /Final cash after age-70 mortgage payoff: £250k/);
});

test('robustness summary markdown includes coverage and why-this-wins sections', () => {
  const markdown = buildRobustnessSummaryMarkdown({
    objectiveLabel: 'Balanced robustness',
    strategy: {
      strategyId: 'S001',
      pathType: 'Two-home path',
      decisionVector: {
        buyYear1: 2027,
        deposit1: '£250k',
        mortgage1: '£400k',
        buyYear2: 2036,
        deposit2: '£150k',
        mortgage2: '£200k',
      },
      metrics: {
        expectedEndNetWorth: '£1.40M',
        endNetWorthCvar10: '£900k',
        regretCvar10: '£120k',
        feasibilityProbability: '68.0%',
        privateSchoolFeasibilityProbability: '42.0%',
        expectedCashEnd: '£500k',
        expectedFinalPropertyValue: '£1.30M',
      },
    },
    whyLines: ['It has the highest composite robust score.'],
    coverageNotes: ['Best within the screened candidate catalog.'],
    weightingExplanation: 'Medium cases count more.',
    sampleDescription: '54,000 weighted futures.',
  });

  assert.match(markdown, /## Why This Wins/);
  assert.match(markdown, /## Coverage/);
  assert.match(markdown, /54,000 weighted futures/);
});
