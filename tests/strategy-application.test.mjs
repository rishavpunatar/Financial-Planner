import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOptimizerStrategyApplication,
  buildRobustnessStrategyApplication,
} from '../src/strategyApplication.js';

test('optimizer apply patch uses stored baseline and objective growths when requested', () => {
  const patch = buildOptimizerStrategyApplication({
    result: {
      assumptionCase: { label: 'Income medium / Market high', incomeGrowth: 3.5, isaGrowth: 5.5, propertyGrowth: 2.5 },
      initialDeposit: 250000,
      optimizerIsaSeed: 50000,
      initialMortgage: 400000,
      firstHousePurchaseYear: 2027,
      salaryMortgageEarly: 18,
      salaryMortgageLater: 12,
      enableSecondHouse: true,
      secondHouseDeposit: 150000,
      secondMortgage: 200000,
      secondHouseYear: 2036,
    },
    strategyApplyMode: 'privateSchoolOn',
    optimizerUsePrivateSchool: false,
    appliedBaseParams: {
      startYear: 2027,
      mortgageRate: 2.3,
      realGrowthCosts: 2,
      child1BirthYear: 2032,
      child2BirthYear: 2034,
      baseLivingCost: 40000,
      child1AnnualCost: 30000,
      child2AnnualCost: 20000,
      emergencyFundAnnual: 5000,
      pensionContributionRate: 5,
      visaCostPreSecondHouse: 2200,
      visaCostAtSecondHouse: 2500,
      carCost: 20000,
      kid1GiftAmount: 100000,
      kid2GiftAmount: 100000,
      isaContributionCap: 40000,
      recessionHitPct: 20,
      cgtRatePct: 20,
      recessionYear: 2035,
      secondRecessionYear: 2042,
      thirdRecessionYear: 2050,
      enableRedundancy: false,
      redundancyYear: 2031,
      secondRedundancyYear: 2039,
      usePrivateSchool: false,
    },
  });

  assert.equal(patch.usePrivateSchool, true);
  assert.equal(patch.income1Start, 70000);
  assert.equal(patch.income2Start, 90000);
  assert.equal(patch.incomeGrowth, 3.5);
  assert.equal(patch.isaGrowth, 5.5);
  assert.equal(patch.realGrowthProperty, 2.5);
});

test('robustness apply patch keeps planner assumptions untouched in current-planner mode', () => {
  const patch = buildRobustnessStrategyApplication({
    robustStrategy: {
      strategyId: 'S001',
      decisionVector: {
        deposit1: 300000,
        mortgage1: 350000,
        optimizerIsaSeed: 0,
        buyYear1: 2027,
        salaryMortgageEarly: 18,
        salaryMortgageLater: 10,
        buyYear2: null,
        deposit2: 0,
        mortgage2: 0,
      },
    },
    strategyApplyMode: 'currentPlanner',
    appliedBaseParams: null,
    defaultApplyScenario: {
      incomeGrowth: 3.5,
      isaGrowth: 4.0,
      propertyGrowth: 1.5,
      usePrivateSchool: false,
    },
  });

  assert.equal(patch.incomeGrowth, undefined);
  assert.equal(patch.isaGrowth, undefined);
  assert.equal(patch.realGrowthProperty, undefined);
  assert.equal(patch.enableSecondHouse, false);
  assert.equal(patch.activeTab, 'planner');
});
