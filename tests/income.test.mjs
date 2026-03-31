import test from 'node:test';
import assert from 'node:assert/strict';

import {
  logisticTaper,
  piecewiseTaper,
  getCareerGrowthFactor,
  calculateCareerIncome as calculateCareerIncomeFromHelper,
} from '../src/income.js';
import {
  CAREER_GROWTH_PEAK_AGE,
  CAREER_GROWTH_END_AGE,
  calculateCareerIncome,
} from '../src/plannerModel.js';

test('piecewise taper stays flat before taper age and reaches the end multiplier', () => {
  assert.equal(piecewiseTaper(45, 5, { age50: 50, taperEnd: 70, endMultiplier: 0.4 }), 5);
  assert.equal(piecewiseTaper(70, 5, { age50: 50, taperEnd: 70, endMultiplier: 0.4 }), 2);
});

test('logistic taper declines smoothly after the midpoint age', () => {
  const earlier = logisticTaper(45, 4);
  const later = logisticTaper(60, 4);

  assert.ok(earlier > later);
  assert.ok(later > 0);
});

test('career growth factor matches the planner default shape', () => {
  assert.equal(getCareerGrowthFactor(CAREER_GROWTH_PEAK_AGE), 1);
  assert.equal(getCareerGrowthFactor(CAREER_GROWTH_END_AGE), 0);
  assert.ok(getCareerGrowthFactor(CAREER_GROWTH_PEAK_AGE + 5) < 1);
});

test('helper income curve matches the planner-model income curve', () => {
  const helperIncome = calculateCareerIncomeFromHelper(100000, 10, 38, 43, {
    peakAge: CAREER_GROWTH_PEAK_AGE,
    endAge: CAREER_GROWTH_END_AGE,
  });
  const plannerIncome = calculateCareerIncome(100000, 10, 38, 43);

  assert.equal(helperIncome, plannerIncome);
  assert.equal(plannerIncome, 148000);
});
