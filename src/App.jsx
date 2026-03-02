// src/App.jsx
import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import RangeSlider from './RangeSlider.jsx';
import {
  loadStoredScenario,
  saveFiltersToURL,
} from './scenarioPersistence.js';
import {
  validatePrecomputedOptimizerPayload,
  validateRobustnessReport,
} from './reportValidation.js';

const PlannerChartSection = lazy(() => import('./PlannerChartSection.jsx'));
const OptimizerTabSection = lazy(() => import('./OptimizerTabSection.jsx'));
const RobustnessTabSection = lazy(() => import('./RobustnessTabSection.jsx'));

const calculateStampDuty = (propertyValue, isAdditionalProperty = false) => {
  const standardThresholds = [
    { limit: 250000, rate: 0 },
    { limit: 925000, rate: 5 },
    { limit: 1500000, rate: 10 },
    { limit: Infinity, rate: 12 },
  ];

  const additionalPropertySurcharge = 3;
  let stampDuty = 0;
  let remaining = propertyValue;
  let previousLimit = 0;

  for (const bracket of standardThresholds) {
    const bracketSize = Math.min(remaining, bracket.limit - previousLimit);
    if (bracketSize <= 0) break;

    let rate = bracket.rate;
    if (isAdditionalProperty && bracket.limit > 0) {
      rate += additionalPropertySurcharge;
    }

    stampDuty += (bracketSize * rate) / 100;
    remaining -= bracketSize;
    previousLimit = bracket.limit;

    if (remaining <= 0) break;
  }

  return Math.round(stampDuty);
};

const BASE_BIRTH_YEAR = 1998;
const END_AGE = 70;
const CAREER_GROWTH_PEAK_AGE = 40;
const CAREER_GROWTH_END_AGE = 55;
const OPTIMIZER_STARTING_INCOME_1 = 70000;
const OPTIMIZER_STARTING_INCOME_2 = 90000;
const OPTIMIZER_SAMPLE_COUNT = 3;
const OPTIMIZER_FULL_SEARCH_LIMIT = 60000;
const OPTIMIZER_MIN_FIRST_PROPERTY_VALUE = 500000;
const OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE = 400000;
const OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF = 2035;
const OPTIMIZER_MIN_UPGRADE_VALUE = 200000;
const OPTIMIZER_MAX_UPGRADE_VALUE = 600000;
const OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE = 850000;
const OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE = 900000;
const OPTIMIZER_FIXED_FIRST_HOUSE_YEAR = 2027;
const OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD = 750000;
const OPTIMIZER_FAST_UPGRADE_YEAR_MAX = 2036;
const OPTIMIZER_LATE_UPGRADE_YEAR_MAX = 2045;
const OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE = 700000;
const OPTIMIZER_MAX_TOTAL_MORTGAGE = 1000000;
const POST_2032_SAVINGS_FLOOR_START_YEAR = 2033;
const POST_2032_MIN_TOTAL_SAVINGS = 50000;
const OPTIMIZER_BIG_FIRST_HOUSE_TARGET = 800000;
const OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX = 600000;
const FIRST_HOME_SALE_AGENT_FEE_PCT = 1.5;
const FIRST_HOME_SALE_LEGAL_FEES = 2000;
const OPTIMIZER_FAILURE_REASON_DEFINITIONS = [
  {
    key: 'cashEnd',
    label: 'Liquid cash before the age-70 mortgage payoff ends at or below zero.',
  },
  {
    key: 'houseValueRule',
    label: `House-value rule fails: one-home plans need at least ${`£${(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE / 1000000).toFixed(2)}m`} on the first house, and two-home plans need at least ${`£${(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE / 1000000).toFixed(2)}m`} on the second house purchase value.`,
  },
  {
    key: 'fundingGap',
    label: 'Second-house deposit cannot be fully funded from surplus savings and ISA.',
  },
  {
    key: 'shortfall',
    label: 'Cash shortfall remains after using surplus savings and ISA.',
  },
  {
    key: 'negativeAmortization',
    label: 'Mortgage budget fails to cover interest in at least one year.',
  },
  {
    key: 'mortgageCap',
    label: `Peak total mortgage exceeds the ${`£${(OPTIMIZER_MAX_TOTAL_MORTGAGE / 1000000).toFixed(1)}m`} cap.`,
  },
  {
    key: 'post2032SavingsFloor',
    label: `Combined liquid savings (ISA + surplus) fall below ${`£${(POST_2032_MIN_TOTAL_SAVINGS / 1000).toFixed(0)}k`} at some point after 2032.`,
  },
];
const FIRST_HOUSE_LEGAL_FEES = 3000;
const SECOND_HOUSE_LEGAL_FEES = 3000;
const OPTIMIZER_INCOME_CASES = [
  {
    id: 'income-low',
    label: 'Income low',
    shortLabel: 'Low',
    growth: 2,
    description: 'Slower real career progression.',
  },
  {
    id: 'income-medium',
    label: 'Income medium',
    shortLabel: 'Medium',
    growth: 3.5,
    description: 'Reasonable long-run corporate base case.',
  },
  {
    id: 'income-high',
    label: 'Income high',
    shortLabel: 'High',
    growth: 5,
    description: 'Strong real progression without extreme jumps.',
  },
];
const OPTIMIZER_MARKET_CASES = [
  {
    id: 'market-low',
    label: 'Market low',
    shortLabel: 'Low',
    isaGrowth: 2.5,
    propertyGrowth: 0.5,
    description: 'More conservative real ISA and property growth.',
  },
  {
    id: 'market-medium',
    label: 'Market medium',
    shortLabel: 'Medium',
    isaGrowth: 4.0,
    propertyGrowth: 1.5,
    description: 'Reasonable long-run real ISA and property growth.',
  },
  {
    id: 'market-high',
    label: 'Market high',
    shortLabel: 'High',
    isaGrowth: 5.5,
    propertyGrowth: 2.5,
    description: 'Stronger real ISA and property growth.',
  },
];
const OPTIMIZER_ASSUMPTION_CASES = OPTIMIZER_INCOME_CASES.flatMap((incomeCase, incomeIndex) =>
  OPTIMIZER_MARKET_CASES.map((marketCase, marketIndex) => ({
      id: `${incomeCase.id}__${marketCase.id}`,
      incomeCase,
      marketCase,
      sortOrder: incomeIndex * 10 + marketIndex,
      label: `${incomeCase.label} / ${marketCase.label}`,
      description: `${incomeCase.description} ${marketCase.description}`,
      incomeGrowth: incomeCase.growth,
      isaGrowth: marketCase.isaGrowth,
      propertyGrowth: marketCase.propertyGrowth,
    })),
);
const OPTIMIZER_OBJECTIVE_DEFINITIONS = [
  {
    id: 'netWorth',
    label: 'Balanced',
    shortLabel: 'Balanced',
    description: 'Highest end net worth after the age-70 mortgage payoff.',
  },
  {
    id: 'cashEnd',
    label: 'Cash savings at end',
    shortLabel: 'Cash end',
    description: 'Highest liquid cash left after the age-70 mortgage payoff.',
  },
  {
    id: 'propertyValue',
    label: 'Highest property value',
    shortLabel: 'Property',
    description: 'Highest end property value, using the second home value where there is an upgrade path.',
  },
  {
    id: 'bigFirstHouse',
    label: 'Big first house',
    shortLabel: 'Big first house',
    description: `First house value as close as possible to about ${`£${(OPTIMIZER_BIG_FIRST_HOUSE_TARGET / 1000).toFixed(0)}k`}, with larger first houses preferred on ties.`,
  },
];
const STRATEGY_APPLY_MODE_DEFINITIONS = [
  {
    id: 'defaultScenario',
    label: 'Reset to model baseline',
    description: 'Apply the stored baseline assumptions from the optimizer or robustness report, then copy the housing strategy in.',
  },
  {
    id: 'currentPlanner',
    label: 'Keep current planner assumptions',
    description: 'Keep the current planner settings and only replace the housing strategy levers.',
  },
  {
    id: 'privateSchoolOn',
    label: 'Baseline + private school on',
    description: 'Use the stored baseline assumptions, but force private school on when copying the strategy in.',
  },
];
const TAX_YEAR_LABEL = '2025/26';
// Smoothed real-terms threshold tightening assumption for long-run UK fiscal drag.
const TAX_THRESHOLD_DRAG_PCT = 1.85;
const PERSONAL_ALLOWANCE = 12570;
const BASIC_RATE_LIMIT = 50270;
const ADDITIONAL_RATE_LIMIT = 125140;
const EMPLOYEE_NI_PRIMARY_THRESHOLD = 12570;
const EMPLOYEE_NI_UPPER_EARNINGS_LIMIT = 50270;

const getDraggedThreshold = (threshold, yearsFromStart) =>
  threshold * Math.pow(1 - TAX_THRESHOLD_DRAG_PCT / 100, yearsFromStart);

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const roundToStep = (value, step) => Math.round(value / step) * step;

const getYearPathValue = (pathValues, year, fallbackValue) => {
  if (!pathValues) {
    return fallbackValue;
  }

  if (Array.isArray(pathValues)) {
    const matchingEntry = pathValues.find((entry) => (
      entry && typeof entry === 'object' && entry.year === year
    ));
    if (matchingEntry && typeof matchingEntry.value === 'number') {
      return matchingEntry.value;
    }
  }

  if (typeof pathValues === 'object') {
    const directValue = pathValues[year];
    if (typeof directValue === 'number') {
      return directValue;
    }
  }

  return fallbackValue;
};

const passesOptimizerHouseValueRule = ({
  enableSecondHouse,
  firstHouseValue = 0,
  secondHousePurchasePrice = 0,
}) => (
  enableSecondHouse
    ? secondHousePurchasePrice >= OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE
    : firstHouseValue >= OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE
);

const buildSamplePoints = (min, max, step, count = OPTIMIZER_SAMPLE_COUNT) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  if (lower === upper) return [lower];

  const points = new Set([lower, upper]);
  const intervals = Math.max(1, count - 1);

  for (let index = 0; index < count; index += 1) {
    const rawValue = lower + ((upper - lower) * index) / intervals;
    const snapped = clampValue(roundToStep(rawValue, step), lower, upper);
    points.add(snapped);
  }

  return Array.from(points).sort((a, b) => a - b);
};

const buildSteppedPoints = (min, max, step) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const points = [];

  for (let value = lower; value <= upper + step / 2; value += step) {
    points.push(clampValue(roundToStep(value, step), lower, upper));
  }

  return Array.from(new Set(points)).sort((a, b) => a - b);
};

const getMinimumFirstHouseValue = (enableSecondHouse, secondHouseYear) => (
  enableSecondHouse && secondHouseYear <= OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF
    ? OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE
    : OPTIMIZER_MIN_FIRST_PROPERTY_VALUE
);

const applyTerminalMortgagePayoff = ({
  isaTotal = 0,
  surplusPot = 0,
  mortgageBalance = 0,
}) => {
  const cashBeforeTerminalMortgagePayoff = isaTotal + surplusPot;
  const terminalMortgagePaydown = Math.min(
    cashBeforeTerminalMortgagePayoff,
    mortgageBalance,
  );
  const surplusPaydown = Math.min(terminalMortgagePaydown, surplusPot);
  const isaPaydown = terminalMortgagePaydown - surplusPaydown;
  const isaEnd = Math.max(0, isaTotal - isaPaydown);
  const surplusPotEnd = Math.max(0, surplusPot - surplusPaydown);
  const finalMortgageBalance = Math.max(
    0,
    mortgageBalance - terminalMortgagePaydown,
  );

  return {
    cashBeforeTerminalMortgagePayoff,
    terminalMortgagePaydown,
    isaEnd,
    surplusPotEnd,
    finalMortgageBalance,
    cashEnd: isaEnd + surplusPotEnd,
  };
};

const createOptimizerFailureCounts = () => Object.fromEntries(
  OPTIMIZER_FAILURE_REASON_DEFINITIONS.map(({ key }) => [key, 0]),
);

const getOptimizerFailureKeys = (simulation) => {
  const failedKeys = [];

  if (simulation.cashBeforeTerminalMortgagePayoff <= 0) {
    failedKeys.push('cashEnd');
  }
  if (!passesOptimizerHouseValueRule(simulation)) {
    failedKeys.push('houseValueRule');
  }
  if (simulation.secondHouseFundingGap > 0.01) {
    failedKeys.push('fundingGap');
  }
  if (simulation.cumulativeShortfall > 0.01) {
    failedKeys.push('shortfall');
  }
  if (simulation.negativeAmortizationYears > 0) {
    failedKeys.push('negativeAmortization');
  }
  if (simulation.peakMortgageBalance > OPTIMIZER_MAX_TOTAL_MORTGAGE) {
    failedKeys.push('mortgageCap');
  }
  if (!simulation.post2032SavingsFloorOk) {
    failedKeys.push('post2032SavingsFloor');
  }

  return failedKeys;
};

const recordOptimizerFailures = (failureCounts, simulation) => {
  const failedKeys = getOptimizerFailureKeys(simulation);
  failedKeys.forEach((key) => {
    failureCounts[key] += 1;
  });
  return failedKeys.length === 0;
};

const summarizeOptimizerFailureCounts = (failureCounts, scenariosTested) => (
  OPTIMIZER_FAILURE_REASON_DEFINITIONS
    .map(({ key, label }) => ({
      key,
      label,
      count: failureCounts[key] ?? 0,
      share: scenariosTested > 0 ? ((failureCounts[key] ?? 0) / scenariosTested) * 100 : 0,
    }))
    .filter(item => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)
);

const getOptimizerUpgradeYearMax = (firstHouseValue) =>
  firstHouseValue < OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD
    ? OPTIMIZER_FAST_UPGRADE_YEAR_MAX
    : OPTIMIZER_LATE_UPGRADE_YEAR_MAX;

const buildOptimizerSearchPlan = (searchConfig) => {
  const firstHouseMortgageMin = Math.min(
    searchConfig.firstHouseMortgageMin,
    OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  );
  const firstHouseMortgageMax = Math.min(
    searchConfig.firstHouseMortgageMax,
    OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  );
  const secondHouseMortgageMin = Math.min(
    searchConfig.secondHouseMortgageMin,
    OPTIMIZER_MAX_TOTAL_MORTGAGE,
  );
  const secondHouseMortgageMax = Math.min(
    searchConfig.secondHouseMortgageMax,
    OPTIMIZER_MAX_TOTAL_MORTGAGE,
  );
  const exactFirstHouseDeposits = buildSteppedPoints(
    searchConfig.firstHouseDepositMin,
    searchConfig.firstHouseDepositMax,
    50000,
  );
  const exactFirstHouseMortgages = buildSteppedPoints(
    firstHouseMortgageMin,
    firstHouseMortgageMax,
    50000,
  );
  const exactFirstHouseYears = buildSteppedPoints(
    searchConfig.firstHouseYearMin,
    searchConfig.firstHouseYearMax,
    1,
  );
  const exactEarlyMortgagePcts = buildSteppedPoints(
    searchConfig.earlyMortgagePctMin,
    searchConfig.earlyMortgagePctMax,
    1,
  );
  const exactSecondHouseDeposits = buildSteppedPoints(
    searchConfig.secondHouseDepositMin,
    searchConfig.secondHouseDepositMax,
    50000,
  );
  const exactSecondHouseMortgages = buildSteppedPoints(
    secondHouseMortgageMin,
    secondHouseMortgageMax,
    50000,
  );
  const exactSecondHouseYears = buildSteppedPoints(
    searchConfig.secondHouseYearMin,
    Math.min(searchConfig.secondHouseYearMax, OPTIMIZER_LATE_UPGRADE_YEAR_MAX),
    1,
  );
  const exactLaterMortgagePcts = buildSteppedPoints(
    searchConfig.laterMortgagePctMin,
    searchConfig.laterMortgagePctMax,
    1,
  );

  const exactOnePropertyCount =
    exactFirstHouseDeposits.length *
    exactFirstHouseMortgages.length *
    exactFirstHouseYears.length *
    exactEarlyMortgagePcts.length;
  const exactTwoPropertyCount = exactFirstHouseDeposits.reduce(
    (depositCount, initialDeposit) => (
      depositCount + exactFirstHouseMortgages.reduce(
        (mortgageCount, initialMortgage) => {
          const firstHouseValue = initialDeposit + initialMortgage;
          const scenarioSecondHouseYearMax = Math.min(
            getOptimizerUpgradeYearMax(firstHouseValue),
            searchConfig.secondHouseYearMax,
            OPTIMIZER_LATE_UPGRADE_YEAR_MAX,
          );

          const yearOptionCount = exactFirstHouseYears.reduce(
            (yearCount, firstHousePurchaseYear) => (
              yearCount + exactSecondHouseYears.filter(
                secondHouseYear =>
                  secondHouseYear > firstHousePurchaseYear &&
                  secondHouseYear <= scenarioSecondHouseYearMax,
              ).length
            ),
            0,
          );

          return mortgageCount + (
            exactEarlyMortgagePcts.length *
            exactSecondHouseDeposits.length *
            exactSecondHouseMortgages.length *
            exactLaterMortgagePcts.length *
            yearOptionCount
          );
        },
        0,
      )
    ),
    0,
  );

  const propertyModes = searchConfig.propertyMode === 'both'
    ? ['one', 'two']
    : [searchConfig.propertyMode];

  const exactScenarioCount = propertyModes.reduce((count, propertyMode) => (
    count + (propertyMode === 'one' ? exactOnePropertyCount : exactTwoPropertyCount)
  ), 0);
  const totalScenarioCount = exactScenarioCount * OPTIMIZER_ASSUMPTION_CASES.length;
  const isExhaustive = totalScenarioCount <= OPTIMIZER_FULL_SEARCH_LIMIT;

  return {
    propertyModes,
    isExhaustive,
    exactScenarioCount: totalScenarioCount,
    firstHouseDeposits: isExhaustive
      ? exactFirstHouseDeposits
      : buildSamplePoints(searchConfig.firstHouseDepositMin, searchConfig.firstHouseDepositMax, 50000),
    firstHouseMortgages: isExhaustive
      ? exactFirstHouseMortgages
      : buildSamplePoints(
        firstHouseMortgageMin,
        firstHouseMortgageMax,
        50000,
      ),
    firstHouseYears: isExhaustive
      ? exactFirstHouseYears
      : buildSamplePoints(searchConfig.firstHouseYearMin, searchConfig.firstHouseYearMax, 1),
    earlyMortgagePcts: isExhaustive
      ? exactEarlyMortgagePcts
      : buildSamplePoints(searchConfig.earlyMortgagePctMin, searchConfig.earlyMortgagePctMax, 1),
    secondHouseDeposits: isExhaustive
      ? exactSecondHouseDeposits
      : buildSamplePoints(searchConfig.secondHouseDepositMin, searchConfig.secondHouseDepositMax, 50000),
    secondHouseMortgages: isExhaustive
      ? exactSecondHouseMortgages
      : buildSamplePoints(
        secondHouseMortgageMin,
        secondHouseMortgageMax,
        50000,
      ),
    secondHouseYears: isExhaustive
      ? exactSecondHouseYears
      : buildSamplePoints(
        searchConfig.secondHouseYearMin,
        Math.min(searchConfig.secondHouseYearMax, OPTIMIZER_LATE_UPGRADE_YEAR_MAX),
        1,
      ),
    laterMortgagePcts: isExhaustive
      ? exactLaterMortgagePcts
      : buildSamplePoints(searchConfig.laterMortgagePctMin, searchConfig.laterMortgagePctMax, 1),
  };
};

const calculateRealTermsTakeHomePay = (
  income,
  yearsFromStart,
  pensionContributionRate = 0,
) => {
  const taxableIncome = income * (1 - pensionContributionRate / 100);
  const incomeTax = calculateIncomeTax(taxableIncome, {
    personalAllowance: getDraggedThreshold(PERSONAL_ALLOWANCE, yearsFromStart),
    basicRateLimit: getDraggedThreshold(BASIC_RATE_LIMIT, yearsFromStart),
    additionalRateLimit: getDraggedThreshold(ADDITIONAL_RATE_LIMIT, yearsFromStart),
    allowanceTaperStart: getDraggedThreshold(100000, yearsFromStart),
  });
  const nationalInsurance = calculateEmployeeNationalInsurance(taxableIncome, {
    primaryThreshold: getDraggedThreshold(
      EMPLOYEE_NI_PRIMARY_THRESHOLD,
      yearsFromStart,
    ),
    upperEarningsLimit: getDraggedThreshold(
      EMPLOYEE_NI_UPPER_EARNINGS_LIMIT,
      yearsFromStart,
    ),
  });

  return taxableIncome - incomeTax - nationalInsurance;
};

const calculateIncomeTax = (income, thresholds = {}) => {
  const {
    personalAllowance: personalAllowanceBase = PERSONAL_ALLOWANCE,
    basicRateLimit = BASIC_RATE_LIMIT,
    additionalRateLimit = ADDITIONAL_RATE_LIMIT,
    allowanceTaperStart = 100000,
  } = thresholds;

  if (income <= personalAllowanceBase) return 0;

  let personalAllowance = personalAllowanceBase;
  if (income > allowanceTaperStart) {
    const excessOverTaper = income - allowanceTaperStart;
    const taperAmount = Math.floor(excessOverTaper / 2);
    personalAllowance = Math.max(0, personalAllowance - taperAmount);
  }

  const basicRateBand = Math.max(0, basicRateLimit - personalAllowanceBase);
  const higherRateBand = Math.max(0, additionalRateLimit - basicRateLimit);

  let tax = 0;
  let remainingIncome = income - personalAllowance;

  if (remainingIncome > 0) {
    const taxedAtBasicRate = Math.min(remainingIncome, basicRateBand);
    tax += taxedAtBasicRate * 0.2;
    remainingIncome -= taxedAtBasicRate;
  }

  if (remainingIncome > 0) {
    const taxedAtHigherRate = Math.min(remainingIncome, higherRateBand);
    tax += taxedAtHigherRate * 0.4;
    remainingIncome -= taxedAtHigherRate;
  }

  if (remainingIncome > 0) {
    tax += remainingIncome * 0.45;
  }

  return tax;
};

const calculateEmployeeNationalInsurance = (income, thresholds = {}) => {
  const {
    primaryThreshold = EMPLOYEE_NI_PRIMARY_THRESHOLD,
    upperEarningsLimit = EMPLOYEE_NI_UPPER_EARNINGS_LIMIT,
  } = thresholds;

  if (income <= primaryThreshold) return 0;

  let nationalInsurance = 0;
  const mainBand = Math.min(income, upperEarningsLimit) - primaryThreshold;

  if (mainBand > 0) {
    nationalInsurance += mainBand * 0.08;
  }

  if (income > upperEarningsLimit) {
    nationalInsurance += (income - upperEarningsLimit) * 0.02;
  }

  return nationalInsurance;
};

const getCareerGrowthFactor = (age) => {
  if (age < CAREER_GROWTH_PEAK_AGE) return 1;
  if (age >= CAREER_GROWTH_END_AGE) return 0;

  return 1 - (
    (age - CAREER_GROWTH_PEAK_AGE) /
    (CAREER_GROWTH_END_AGE - CAREER_GROWTH_PEAK_AGE)
  );
};

const calculateCareerIncome = (
  startIncome,
  baseGrowthRate,
  startAge,
  currentAge,
) => {
  if (currentAge <= startAge || baseGrowthRate <= 0) {
    return startIncome;
  }

  const baseIncrement = startIncome * (baseGrowthRate / 100);
  let income = startIncome;

  for (let age = startAge; age < currentAge; age += 1) {
    income += baseIncrement * getCareerGrowthFactor(age);
  }

  return income;
};

const simulateFinancialPlan = (params) => {
  const {
    startYear,
    firstHousePurchaseYear,
    startAge,
    maxYear = BASE_BIRTH_YEAR + END_AGE,
    mortgageRate,
    salaryMortgageEarly,
    salaryMortgageLater,
    realGrowthCosts,
    realGrowthProperty,
    isaGrowth,
    initialMortgage,
    secondMortgage,
    initialDeposit,
    secondHouseDeposit,
    isaSeed,
    income1Start,
    income2Start,
    incomeGrowth,
    secondHouseYear,
    child1BirthYear,
    child2BirthYear,
    kid1GiftYear,
    kid2GiftYear,
    recessionYear,
    secondRecessionYear,
    thirdRecessionYear,
    enableRedundancy,
    redundancyYear,
    secondRedundancyYear,
    baseLivingCost,
    child1AnnualCost,
    child2AnnualCost,
    emergencyFundAnnual,
    pensionContributionRate,
    visaCostPreSecondHouse,
    visaCostAtSecondHouse,
    carCost,
    kid1GiftAmount,
    kid2GiftAmount,
    isaContributionCap,
    recessionHitPct,
    cgtRatePct,
    usePrivateSchool,
    enableSecondHouse,
    mortgageRatePath,
    isaGrowthPath,
    propertyGrowthPath,
    income1Path,
    income2Path,
    calculateTakeHomePayFn = calculateRealTermsTakeHomePay,
    returnFullData = true,
  } = params;

  const initialPropertyValue = initialMortgage + initialDeposit;
  const moveIncrementValue = enableSecondHouse ? secondMortgage + secondHouseDeposit : 0;

  const data = returnFullData ? [] : null;

  let firstMortgageBalance = 0;
  let secondMortgageBalance = 0;
  let propertyValue = 0;
  let hasFirstHouse = false;

  let isaTotal = isaSeed;
  let cumulativeMortgageInterest = 0;
  let cumulativeMortgageRepayment = 0;
  let surplusPot = 0;
  let cumulativeShortfall = 0;

  const cgtRate = cgtRatePct / 100;
  const recessionFactor = 1 - recessionHitPct / 100;

  let mortgageRepayYearLocal = null;
  let firstMortgagePaidOffYearLocal = null;
  let secondHouseValueAtMoveLocal = null;
  let secondHousePurchasePriceLocal = null;
  let secondHouseFundingGapLocal = 0;
  let firstHouseSaleCostsLocal = 0;
  let minIsaBalance = isaSeed || 0;
  let negativeAmortizationYears = 0;
  let capitalizedInterestTotal = 0;
  let peakMortgageBalance = 0;
  let minLiquidBuffer = isaSeed || 0;
  let minLiquidBufferPost2032 = Number.POSITIVE_INFINITY;
  let cashBufferOk = true;
  let privateSchoolAffordable = true;
  let finalSnapshot = null;

  const recordLiquiditySnapshot = (year) => {
    const liquidBuffer = isaTotal + surplusPot;
    minIsaBalance = Math.min(minIsaBalance, isaTotal);
    minLiquidBuffer = Math.min(minLiquidBuffer, liquidBuffer);

    if (year >= POST_2032_SAVINGS_FLOOR_START_YEAR) {
      minLiquidBufferPost2032 = Math.min(minLiquidBufferPost2032, liquidBuffer);
    }
  };

  for (let year = startYear; year <= maxYear; year++) {
    const buysFirstHouseThisYear = !hasFirstHouse && year === firstHousePurchaseYear;

    if (buysFirstHouseThisYear) {
      hasFirstHouse = true;
      propertyValue = initialPropertyValue;
      firstMortgageBalance = initialMortgage;
    }

    recordLiquiditySnapshot(year);

    if (hasFirstHouse && !buysFirstHouseThisYear) {
      const propertyGrowthRate = getYearPathValue(
        propertyGrowthPath,
        year,
        realGrowthProperty,
      );
      propertyValue *= 1 + propertyGrowthRate / 100;
    }

    const yearsFromStart = year - startYear;
    const age = startAge + yearsFromStart;

    let income1 = getYearPathValue(
      income1Path,
      year,
      calculateCareerIncome(
        income1Start,
        incomeGrowth,
        startAge,
        age,
      ),
    );
    let income2 = getYearPathValue(
      income2Path,
      year,
      calculateCareerIncome(
        income2Start,
        incomeGrowth,
        startAge,
        age,
      ),
    );

    const isRedundancyYear = enableRedundancy
      && [redundancyYear, secondRedundancyYear].filter(Boolean).includes(year);
    if (isRedundancyYear) {
      income1 = 0;
    }

    if (year === child1BirthYear || year === child2BirthYear) {
      income2 *= 0.5;
    }

    const grossIncome = income1 + income2;
    const takeHome1 = calculateTakeHomePayFn(
      income1,
      yearsFromStart,
      pensionContributionRate,
    );
    const takeHome2 = calculateTakeHomePayFn(
      income2,
      yearsFromStart,
      pensionContributionRate,
    );
    const netIncome = takeHome1 + takeHome2;
    const totalPostTax = netIncome;

    const isRecessionYearFlag = [recessionYear, secondRecessionYear, thirdRecessionYear]
      .filter(Boolean)
      .includes(year);

    if (isRecessionYearFlag) {
      if (hasFirstHouse) {
        propertyValue *= recessionFactor;
      }
      isaTotal *= recessionFactor;
      surplusPot *= recessionFactor;
      recordLiquiditySnapshot(year);
    }

    let purchaseLumpSum = 0;
    if (year === firstHousePurchaseYear) {
      purchaseLumpSum += calculateStampDuty(initialPropertyValue, false) + FIRST_HOUSE_LEGAL_FEES;
    }

    if (enableSecondHouse && year === secondHouseYear) {
      const plannedSecondHouseValue = propertyValue + moveIncrementValue;
      const plannedSecondHouseStampDuty = calculateStampDuty(plannedSecondHouseValue, false);
      const firstHouseSaleCosts =
        (propertyValue * FIRST_HOME_SALE_AGENT_FEE_PCT / 100) + FIRST_HOME_SALE_LEGAL_FEES;
      const surplusWithdrawn = Math.min(secondHouseDeposit, surplusPot);
      surplusPot -= surplusWithdrawn;
      const depositNeedAfterSurplus = secondHouseDeposit - surplusWithdrawn;
      const isaWithdrawn = Math.min(depositNeedAfterSurplus, isaTotal);
      isaTotal -= isaWithdrawn;
      const depositGap = Math.max(0, secondHouseDeposit - surplusWithdrawn - isaWithdrawn);
      if (depositGap > 0) {
        secondHouseFundingGapLocal += depositGap;
        cumulativeShortfall += depositGap;
      }
      recordLiquiditySnapshot(year);
      secondMortgageBalance = secondMortgage;
      propertyValue = plannedSecondHouseValue;
      secondHouseValueAtMoveLocal = propertyValue;
      secondHousePurchasePriceLocal = propertyValue;
      firstHouseSaleCostsLocal = firstHouseSaleCosts;
      purchaseLumpSum += plannedSecondHouseStampDuty + SECOND_HOUSE_LEGAL_FEES + firstHouseSaleCosts;
    }

    let visaCost = 0;
    if (year <= 2036) {
      visaCost = visaCostPreSecondHouse;
    } else if (enableSecondHouse && year === secondHouseYear) {
      visaCost = visaCostAtSecondHouse;
    }

    const yearlyMortgageRate = getYearPathValue(
      mortgageRatePath,
      year,
      mortgageRate,
    );
    const yearlyRate = yearlyMortgageRate / 100;
    const openingMortgageBalance = firstMortgageBalance + secondMortgageBalance;
    peakMortgageBalance = Math.max(peakMortgageBalance, openingMortgageBalance);
    const mortgageInterest = openingMortgageBalance * yearlyRate;

    let mortgageRepayment = 0;
    if (openingMortgageBalance > 0) {
      const isLatePhase = enableSecondHouse ? year > secondHouseYear : false;
      const salaryPercent = isLatePhase
        ? salaryMortgageLater / 100
        : salaryMortgageEarly / 100;

      mortgageRepayment = grossIncome * salaryPercent;

      const maxPossible = openingMortgageBalance + mortgageInterest;
      if (mortgageRepayment > maxPossible) {
        mortgageRepayment = maxPossible;
      }

      const interestPaid = Math.min(mortgageRepayment, mortgageInterest);
      let principalPayment = Math.max(0, mortgageRepayment - mortgageInterest);
      const unpaidInterest = Math.max(0, mortgageInterest - interestPaid);

      if (unpaidInterest > 0.01) {
        negativeAmortizationYears += 1;
        capitalizedInterestTotal += unpaidInterest;

        const firstShare = firstMortgageBalance / openingMortgageBalance;
        const secondShare = secondMortgageBalance / openingMortgageBalance;

        firstMortgageBalance += unpaidInterest * firstShare;
        secondMortgageBalance += unpaidInterest * secondShare;
      }

      peakMortgageBalance = Math.max(
        peakMortgageBalance,
        firstMortgageBalance + secondMortgageBalance,
      );

      if (firstMortgageBalance > 0) {
        const firstMortgagePayment = Math.min(principalPayment, firstMortgageBalance);
        firstMortgageBalance -= firstMortgagePayment;
        principalPayment -= firstMortgagePayment;

        if (firstMortgageBalance <= 0.01 && firstMortgagePaidOffYearLocal === null) {
          firstMortgagePaidOffYearLocal = year;
        }
      }

      if (principalPayment > 0 && secondMortgageBalance > 0) {
        const secondMortgagePayment = Math.min(principalPayment, secondMortgageBalance);
        secondMortgageBalance -= secondMortgagePayment;
      }

      cumulativeMortgageInterest += interestPaid;
      cumulativeMortgageRepayment += mortgageRepayment;

      if (
        firstMortgageBalance + secondMortgageBalance <= 0.01 &&
        mortgageRepayYearLocal === null
      ) {
        mortgageRepayYearLocal = year;
      }
    }

    const baseLivingCosts =
      baseLivingCost * Math.pow(1 + realGrowthCosts / 100, yearsFromStart);

    let childCosts = 0;
    if (year >= child1BirthYear + 1 && year <= child1BirthYear + 21) {
      childCosts += child1AnnualCost;
    }
    if (year >= child2BirthYear + 1 && year <= child2BirthYear + 21) {
      childCosts += child2AnnualCost;
    }

    let privateSchoolCost = 0;
    if (usePrivateSchool) {
      const kid1Age = year - child1BirthYear;
      const kid2Age = year - child2BirthYear;
      const feeBase = 30000;
      const feeFactor = Math.pow(1 + realGrowthCosts / 100, yearsFromStart);

      if (kid1Age >= 11 && kid1Age <= 18) {
        privateSchoolCost += feeBase * feeFactor;
      }
      if (kid2Age >= 11 && kid2Age <= 18) {
        privateSchoolCost += feeBase * feeFactor;
      }
    }

    const emergencyFund = emergencyFundAnnual;

    let lumpSum = 0;
    if (year === 2028) {
      lumpSum += carCost;
    }
    if (year === kid1GiftYear) {
      lumpSum += kid1GiftAmount;
    }
    if (year === kid2GiftYear) {
      lumpSum += kid2GiftAmount;
    }
    lumpSum += purchaseLumpSum;

    const totalLeft =
      totalPostTax -
      visaCost -
      mortgageRepayment -
      baseLivingCosts -
      childCosts -
      privateSchoolCost -
      emergencyFund -
      lumpSum;

    if (totalLeft < 0) {
      const shortfall = -totalLeft;
      const surplusDeduction = Math.min(shortfall, surplusPot);
      surplusPot -= surplusDeduction;

      const remainingShortfall = shortfall - surplusDeduction;
      const isaDeduction = Math.min(remainingShortfall, isaTotal);
      isaTotal -= isaDeduction;

      cumulativeShortfall += remainingShortfall - isaDeduction;

      if (remainingShortfall - isaDeduction > 0.01) {
        cashBufferOk = false;
        if (privateSchoolCost > 0.01) {
          privateSchoolAffordable = false;
        }
      }

      recordLiquiditySnapshot(year);
    }

    const isaContribution = Math.min(Math.max(0, totalLeft), isaContributionCap);
    const currentIsaGrowth = getYearPathValue(isaGrowthPath, year, isaGrowth);
    isaTotal = isaTotal * (1 + currentIsaGrowth / 100) + isaContribution;

    const surplusContribution = Math.max(0, totalLeft - isaContribution);
    const growthRate = currentIsaGrowth / 100;
    const grossGrowth = surplusPot * growthRate;
    const afterTaxGrowth = grossGrowth * (1 - cgtRate);
    surplusPot = surplusPot + afterTaxGrowth + surplusContribution;
    recordLiquiditySnapshot(year);

    const isaBelowThreshold = isaTotal < 60000;

    let displayMortgagePayments = cumulativeMortgageRepayment;
    let displayInterestPaid = cumulativeMortgageInterest;
    if (mortgageRepayYearLocal && year > mortgageRepayYearLocal) {
      displayMortgagePayments = null;
      displayInterestPaid = null;
    }

    const closingMortgageBalance =
      firstMortgageBalance + secondMortgageBalance;
    peakMortgageBalance = Math.max(peakMortgageBalance, closingMortgageBalance);
    const displayTotalMortgage =
      closingMortgageBalance > 0.01 ? closingMortgageBalance : null;

    if (returnFullData && data) {
      data.push({
        year,
        age,
        combinedIncomeGross: grossIncome,
        combinedIncomeNet: netIncome,
        propertyValue,
        isaTotal,
        isaBelowThreshold,
        mortgageBalance: displayTotalMortgage,
        totalMortgagePayments: cumulativeMortgageRepayment,
        totalInterestPaid: cumulativeMortgageInterest,
        totalMortgagePaymentsDisplay: displayMortgagePayments,
        totalInterestPaidDisplay: displayInterestPaid,
        surplusPot,
        cumulativeShortfall,
      });
    }

    finalSnapshot = {
      propertyValue,
      isaTotal,
      surplusPot,
      mortgageBalance: displayTotalMortgage || 0,
      cumulativeShortfall,
      totalMortgagePayments: cumulativeMortgageRepayment,
      totalInterestPaid: cumulativeMortgageInterest,
      negativeAmortizationYears,
      capitalizedInterestTotal,
      peakMortgageBalance,
    };
  }

  const terminalPayoff = finalSnapshot
    ? applyTerminalMortgagePayoff({
      isaTotal: finalSnapshot.isaTotal,
      surplusPot: finalSnapshot.surplusPot,
      mortgageBalance: finalSnapshot.mortgageBalance,
    })
    : applyTerminalMortgagePayoff({});

  if (returnFullData && data && data.length > 0) {
    const finalDataPoint = data[data.length - 1];
    data[data.length - 1] = {
      ...finalDataPoint,
      isaTotal: terminalPayoff.isaEnd,
      surplusPot: terminalPayoff.surplusPotEnd,
      isaBelowThreshold: terminalPayoff.isaEnd < 60000,
      mortgageBalance: terminalPayoff.finalMortgageBalance > 0.01
        ? terminalPayoff.finalMortgageBalance
        : null,
    };
  }

  minIsaBalance = Math.min(minIsaBalance, terminalPayoff.isaEnd);
  if (maxYear >= POST_2032_SAVINGS_FLOOR_START_YEAR) {
    minLiquidBufferPost2032 = Math.min(
      minLiquidBufferPost2032,
      terminalPayoff.cashEnd,
    );
  }

  const normalizedMinLiquidBufferPost2032 = Number.isFinite(minLiquidBufferPost2032)
    ? minLiquidBufferPost2032
    : minLiquidBuffer;

  const finalLiquidNet = terminalPayoff.cashEnd - (finalSnapshot?.cumulativeShortfall ?? 0);
  const cashEnd = terminalPayoff.cashEnd;
  const equityEnd = finalSnapshot
    ? finalSnapshot.propertyValue - terminalPayoff.finalMortgageBalance
    : 0;
  const netWorthEnd = cashEnd + equityEnd;

  return {
    financialData: returnFullData && data ? data : [],
    enableSecondHouse,
    firstHouseValue: initialPropertyValue,
    mortgageRepayYear: mortgageRepayYearLocal,
    secondHouseValueAtMove: secondHouseValueAtMoveLocal,
    secondHousePurchasePrice: secondHousePurchasePriceLocal,
    secondHouseFundingGap: secondHouseFundingGapLocal,
    firstHouseSaleCosts: firstHouseSaleCostsLocal,
    firstMortgagePaidOffYear: firstMortgagePaidOffYearLocal,
    minIsaBalance,
    minLiquidBuffer,
    minLiquidBufferPost2032: normalizedMinLiquidBufferPost2032,
    finalLiquidNet,
    cashBeforeTerminalMortgagePayoff: terminalPayoff.cashBeforeTerminalMortgagePayoff,
    terminalMortgagePaydown: terminalPayoff.terminalMortgagePaydown,
    cashEnd,
    equityEnd,
    netWorthEnd,
    finalPropertyValue: finalSnapshot?.propertyValue ?? 0,
    finalMortgageBalance: terminalPayoff.finalMortgageBalance,
    totalMortgagePayments: finalSnapshot?.totalMortgagePayments ?? 0,
    lifetimeInterestPaid: finalSnapshot?.totalInterestPaid ?? 0,
    cumulativeShortfall: finalSnapshot?.cumulativeShortfall ?? 0,
    cashBufferOk: cashBufferOk && (finalSnapshot?.cumulativeShortfall ?? 0) <= 0.01,
    canBuyHouse2IfChosen: secondHouseFundingGapLocal <= 0.01,
    privateSchoolAffordable: usePrivateSchool ? privateSchoolAffordable : true,
    negativeAmortizationYears,
    capitalizedInterestTotal,
    peakMortgageBalance: finalSnapshot?.peakMortgageBalance ?? 0,
    post2032SavingsFloorOk: normalizedMinLiquidBufferPost2032 >= POST_2032_MIN_TOTAL_SAVINGS,
  };
};

const runHousingOptimizer = ({ baseParams, searchConfig }) => {
  const {
    propertyModes,
    isExhaustive,
    exactScenarioCount,
    firstHouseDeposits,
    firstHouseMortgages,
    firstHouseYears,
    earlyMortgagePcts,
    secondHouseDeposits,
    secondHouseMortgages,
    secondHouseYears,
    laterMortgagePcts,
  } = buildOptimizerSearchPlan(searchConfig);
  const startingCashPool = baseParams.initialDeposit + baseParams.isaSeed;

  const caseResults = OPTIMIZER_ASSUMPTION_CASES.map((assumptionCase) => {
    const results = [];
    let scenariosTested = 0;
    const failureCounts = createOptimizerFailureCounts();

    for (const currentPropertyMode of propertyModes) {
      for (const initialDeposit of firstHouseDeposits) {
        for (const initialMortgage of firstHouseMortgages) {
          for (const firstHousePurchaseYear of firstHouseYears) {
            for (const salaryMortgageEarly of earlyMortgagePcts) {
              const firstHouseValue = initialDeposit + initialMortgage;
              const optimizerIsaSeed = Math.max(0, startingCashPool - initialDeposit);

              if (
                initialDeposit > startingCashPool ||
                firstHouseValue < OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE ||
                initialMortgage > OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE
              ) {
                continue;
              }

              if (currentPropertyMode === 'one') {
                scenariosTested += 1;
                const simulation = simulateFinancialPlan({
                  ...baseParams,
                  returnFullData: false,
                  enableSecondHouse: false,
                  firstHousePurchaseYear,
                  salaryMortgageEarly,
                  salaryMortgageLater: salaryMortgageEarly,
                  initialDeposit,
                  initialMortgage,
                  isaSeed: optimizerIsaSeed,
                  secondHouseDeposit: 0,
                  secondMortgage: 0,
                  income1Start: OPTIMIZER_STARTING_INCOME_1,
                  income2Start: OPTIMIZER_STARTING_INCOME_2,
                  incomeGrowth: assumptionCase.incomeGrowth,
                  isaGrowth: assumptionCase.isaGrowth,
                  realGrowthProperty: assumptionCase.propertyGrowth,
                });

                const feasible = recordOptimizerFailures(failureCounts, simulation);

                if (!feasible) continue;

                results.push({
                  assumptionCase,
                  enableSecondHouse: false,
                  firstHousePurchaseYear,
                  initialDeposit,
                  initialMortgage,
                  firstHouseValue,
                  salaryMortgageEarly,
                  salaryMortgageLater: salaryMortgageEarly,
                  optimizerIsaSeed,
                  secondHouseYear: null,
                  secondHouseDeposit: 0,
                  secondMortgage: 0,
                  secondUpgradeValue: 0,
                  ...simulation,
                });

                continue;
              }

              for (const secondHouseDeposit of secondHouseDeposits) {
                for (const secondMortgage of secondHouseMortgages) {
                  for (const salaryMortgageLater of laterMortgagePcts) {
                    const secondUpgradeValue = secondHouseDeposit + secondMortgage;

                    if (
                      secondUpgradeValue < OPTIMIZER_MIN_UPGRADE_VALUE ||
                      secondUpgradeValue > OPTIMIZER_MAX_UPGRADE_VALUE
                    ) {
                      continue;
                    }

                    const scenarioSecondHouseYearMax = Math.min(
                      getOptimizerUpgradeYearMax(firstHouseValue),
                      searchConfig.secondHouseYearMax,
                      OPTIMIZER_LATE_UPGRADE_YEAR_MAX,
                    );
                    const validSecondHouseYears = secondHouseYears.filter(
                      secondHouseYear =>
                        secondHouseYear > firstHousePurchaseYear &&
                        secondHouseYear <= scenarioSecondHouseYearMax,
                    );

                    if (validSecondHouseYears.length === 0) {
                      continue;
                    }

                    for (const secondHouseYear of validSecondHouseYears) {
                      const minimumFirstHouseValue = getMinimumFirstHouseValue(true, secondHouseYear);
                      if (firstHouseValue < minimumFirstHouseValue) {
                        continue;
                      }
                      scenariosTested += 1;
                      const simulation = simulateFinancialPlan({
                        ...baseParams,
                        returnFullData: false,
                        enableSecondHouse: true,
                        firstHousePurchaseYear,
                        secondHouseYear,
                        salaryMortgageEarly,
                        salaryMortgageLater,
                        initialDeposit,
                        initialMortgage,
                        isaSeed: optimizerIsaSeed,
                        secondHouseDeposit,
                        secondMortgage,
                        income1Start: OPTIMIZER_STARTING_INCOME_1,
                        income2Start: OPTIMIZER_STARTING_INCOME_2,
                        incomeGrowth: assumptionCase.incomeGrowth,
                        isaGrowth: assumptionCase.isaGrowth,
                        realGrowthProperty: assumptionCase.propertyGrowth,
                      });

                      const feasible = recordOptimizerFailures(failureCounts, simulation);

                      if (!feasible) continue;

                      results.push({
                        assumptionCase,
                        enableSecondHouse: true,
                        firstHousePurchaseYear,
                        initialDeposit,
                        initialMortgage,
                        firstHouseValue,
                        salaryMortgageEarly,
                        salaryMortgageLater,
                        optimizerIsaSeed,
                        secondHouseYear,
                        secondHouseDeposit,
                        secondMortgage,
                        secondUpgradeValue,
                        ...simulation,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const sortedResults = [...results].sort(compareOptimizerResults);
    const objectiveResults = buildOptimizerObjectiveResults(sortedResults, 3);

    return {
      assumptionCase,
      scenariosTested,
      feasibleCount: results.length,
      bestResult: objectiveResults.netWorth?.bestResult ?? sortedResults[0] ?? null,
      topResults: objectiveResults.netWorth?.topResults ?? sortedResults.slice(0, 3),
      objectiveResults,
      failureCounts,
      failureSummary: summarizeOptimizerFailureCounts(failureCounts, scenariosTested),
    };
  });

  return {
    caseResults,
    searchMeta: {
      isExhaustive,
      exactScenarioCount,
      testedScenarioCount: caseResults.reduce(
        (count, caseResult) => count + caseResult.scenariosTested,
        0,
      ),
      startingCashPool,
    },
  };
};

const getOptimizerResultKey = (result) => [
  result.assumptionCase.id,
  result.enableSecondHouse ? 'two' : 'one',
  result.firstHousePurchaseYear,
  result.firstHouseValue,
  result.initialDeposit,
  result.initialMortgage,
  result.secondHouseYear ?? 'none',
  result.secondUpgradeValue ?? 0,
  result.secondHouseDeposit ?? 0,
  result.secondMortgage ?? 0,
  result.salaryMortgageEarly,
  result.salaryMortgageLater,
].join('|');

const getOptimizerNetWorth = (result) => result.netWorthEnd;
const getOptimizerObjectiveDefinition = (objectiveId) => (
  OPTIMIZER_OBJECTIVE_DEFINITIONS.find((objective) => objective.id === objectiveId)
  ?? OPTIMIZER_OBJECTIVE_DEFINITIONS[0]
);
const hasRemainingMortgageAfterPayoff = (result) => (result?.finalMortgageBalance ?? 0) > 0.01;
const getOptimizerHousingEndLabel = (result) => (
  hasRemainingMortgageAfterPayoff(result)
    ? 'Home Equity End'
    : 'Property Value End'
);
const getOptimizerHousingEndValue = (result) => (
  hasRemainingMortgageAfterPayoff(result)
    ? result.equityEnd
    : result.finalPropertyValue
);
const getOptimizerHousingEndSub = (result) => (
  hasRemainingMortgageAfterPayoff(result)
    ? 'Property value after any remaining mortgage'
    : 'Mortgage fully cleared by the age-70 payoff'
);
const getOptimizerHousingEndInlineLabel = (result) => (
  hasRemainingMortgageAfterPayoff(result) ? 'equity' : 'property'
);

const compareOptimizerResultsByNetWorth = (left, right) => {
  const leftNetWorth = getOptimizerNetWorth(left);
  const rightNetWorth = getOptimizerNetWorth(right);

  if (rightNetWorth !== leftNetWorth) {
    return rightNetWorth - leftNetWorth;
  }

  if (right.cashEnd !== left.cashEnd) {
    return right.cashEnd - left.cashEnd;
  }

  if (right.equityEnd !== left.equityEnd) {
    return right.equityEnd - left.equityEnd;
  }

  if (left.lifetimeInterestPaid !== right.lifetimeInterestPaid) {
    return left.lifetimeInterestPaid - right.lifetimeInterestPaid;
  }

  return 0;
};

const compareOptimizerResultsForObjective = (objectiveId, left, right) => {
  if (objectiveId === 'cashEnd') {
    if (right.cashEnd !== left.cashEnd) {
      return right.cashEnd - left.cashEnd;
    }
    return compareOptimizerResultsByNetWorth(left, right);
  }

  if (objectiveId === 'propertyValue') {
    if (right.finalPropertyValue !== left.finalPropertyValue) {
      return right.finalPropertyValue - left.finalPropertyValue;
    }
    if (right.equityEnd !== left.equityEnd) {
      return right.equityEnd - left.equityEnd;
    }
    return compareOptimizerResultsByNetWorth(left, right);
  }

  if (objectiveId === 'bigFirstHouse') {
    const leftDistance = Math.abs(left.firstHouseValue - OPTIMIZER_BIG_FIRST_HOUSE_TARGET);
    const rightDistance = Math.abs(right.firstHouseValue - OPTIMIZER_BIG_FIRST_HOUSE_TARGET);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    if (right.firstHouseValue !== left.firstHouseValue) {
      return right.firstHouseValue - left.firstHouseValue;
    }
    return compareOptimizerResultsByNetWorth(left, right);
  }

  return compareOptimizerResultsByNetWorth(left, right);
};

const compareOptimizerResults = (left, right) => (
  compareOptimizerResultsForObjective('netWorth', left, right)
);

const compareRobustnessStrategiesForObjective = (objectiveId, left, right) => {
  if (objectiveId === 'cashEnd') {
    if (right.metrics.expectedCashEnd !== left.metrics.expectedCashEnd) {
      return right.metrics.expectedCashEnd - left.metrics.expectedCashEnd;
    }
    if (right.metrics.feasibilityProbability !== left.metrics.feasibilityProbability) {
      return right.metrics.feasibilityProbability - left.metrics.feasibilityProbability;
    }
    if (left.metrics.regretCvar10 !== right.metrics.regretCvar10) {
      return left.metrics.regretCvar10 - right.metrics.regretCvar10;
    }
    return right.metrics.expectedEndNetWorth - left.metrics.expectedEndNetWorth;
  }

  if (objectiveId === 'propertyValue') {
    if (right.metrics.expectedFinalPropertyValue !== left.metrics.expectedFinalPropertyValue) {
      return right.metrics.expectedFinalPropertyValue - left.metrics.expectedFinalPropertyValue;
    }
    if (right.metrics.feasibilityProbability !== left.metrics.feasibilityProbability) {
      return right.metrics.feasibilityProbability - left.metrics.feasibilityProbability;
    }
    if (left.metrics.regretCvar10 !== right.metrics.regretCvar10) {
      return left.metrics.regretCvar10 - right.metrics.regretCvar10;
    }
    return right.metrics.expectedEndNetWorth - left.metrics.expectedEndNetWorth;
  }

  if (objectiveId === 'bigFirstHouse') {
    const leftDistance = Math.abs(left.decisionVector.deposit1 + left.decisionVector.mortgage1 - OPTIMIZER_BIG_FIRST_HOUSE_TARGET);
    const rightDistance = Math.abs(right.decisionVector.deposit1 + right.decisionVector.mortgage1 - OPTIMIZER_BIG_FIRST_HOUSE_TARGET);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    const leftFirstHouseValue = left.decisionVector.deposit1 + left.decisionVector.mortgage1;
    const rightFirstHouseValue = right.decisionVector.deposit1 + right.decisionVector.mortgage1;
    if (rightFirstHouseValue !== leftFirstHouseValue) {
      return rightFirstHouseValue - leftFirstHouseValue;
    }
    if (right.metrics.feasibilityProbability !== left.metrics.feasibilityProbability) {
      return right.metrics.feasibilityProbability - left.metrics.feasibilityProbability;
    }
    return right.metrics.expectedEndNetWorth - left.metrics.expectedEndNetWorth;
  }

  if (objectiveId === 'privateSchoolSuccess') {
    if (right.metrics.privateSchoolFeasibilityProbability !== left.metrics.privateSchoolFeasibilityProbability) {
      return right.metrics.privateSchoolFeasibilityProbability - left.metrics.privateSchoolFeasibilityProbability;
    }
    if (right.metrics.feasibilityProbability !== left.metrics.feasibilityProbability) {
      return right.metrics.feasibilityProbability - left.metrics.feasibilityProbability;
    }
    if (left.metrics.regretCvar10 !== right.metrics.regretCvar10) {
      return left.metrics.regretCvar10 - right.metrics.regretCvar10;
    }
    return right.metrics.expectedEndNetWorth - left.metrics.expectedEndNetWorth;
  }

  if (right.metrics.compositeRobustScore !== left.metrics.compositeRobustScore) {
    return right.metrics.compositeRobustScore - left.metrics.compositeRobustScore;
  }
  if (right.metrics.feasibilityProbability !== left.metrics.feasibilityProbability) {
    return right.metrics.feasibilityProbability - left.metrics.feasibilityProbability;
  }
  if (left.metrics.regretCvar10 !== right.metrics.regretCvar10) {
    return left.metrics.regretCvar10 - right.metrics.regretCvar10;
  }
  return right.metrics.expectedEndNetWorth - left.metrics.expectedEndNetWorth;
};

const buildOptimizerObjectiveResults = (results, topCount = 3) => Object.fromEntries(
  OPTIMIZER_OBJECTIVE_DEFINITIONS.map((objective) => {
    const sortedResults = [...results].sort((left, right) => (
      compareOptimizerResultsForObjective(objective.id, left, right)
    ));

    return [
      objective.id,
      {
        objective,
        bestResult: sortedResults[0] ?? null,
        topResults: sortedResults.slice(0, topCount),
      },
    ];
  }),
);

const App = () => {
  const initialScenario = useMemo(() => loadStoredScenario(), []);

  const [mortgageRate, setMortgageRate] = useState(initialScenario?.mortgageRate ?? 2.3);
  const [salaryMortgageEarly, setSalaryMortgageEarly] = useState(initialScenario?.salaryMortgageEarly ?? 18);
  const [salaryMortgageLater, setSalaryMortgageLater] = useState(initialScenario?.salaryMortgageLater ?? 10);

  const [realGrowthCosts, setRealGrowthCosts] = useState(initialScenario?.realGrowthCosts ?? 2);
  const [realGrowthProperty, setRealGrowthProperty] = useState(initialScenario?.realGrowthProperty ?? 2);
  const [isaGrowth, setIsaGrowth] = useState(initialScenario?.isaGrowth ?? 3);

  const [initialMortgage, setInitialMortgage] = useState(initialScenario?.initialMortgage ?? 300000);
  const [initialDeposit, setInitialDeposit] = useState(initialScenario?.initialDeposit ?? 300000);
  const [secondMortgage, setSecondMortgage] = useState(initialScenario?.secondMortgage ?? 100000);
  const [isaSeed, setIsaSeed] = useState(initialScenario?.isaSeed ?? 0);

  const [income1Start, setIncome1Start] = useState(initialScenario?.income1Start ?? 90000);
  const [income2Start, setIncome2Start] = useState(initialScenario?.income2Start ?? 90000);
  const [incomeGrowth, setIncomeGrowth] = useState(initialScenario?.incomeGrowth ?? 0);

  const [secondHouseYear, setSecondHouseYear] = useState(initialScenario?.secondHouseYear ?? 2037);
  const [secondHouseDeposit, setSecondHouseDeposit] = useState(initialScenario?.secondHouseDeposit ?? 200000);

  const [child1BirthYear, setChild1BirthYear] = useState(initialScenario?.child1BirthYear ?? 2032);
  const [child2BirthYear, setChild2BirthYear] = useState(initialScenario?.child2BirthYear ?? 2034);

  const [recessionYear, setRecessionYear] = useState(initialScenario?.recessionYear ?? 2035);
  const [secondRecessionYear, setSecondRecessionYear] = useState(initialScenario?.secondRecessionYear ?? 2042);
  const [thirdRecessionYear, setThirdRecessionYear] = useState(initialScenario?.thirdRecessionYear ?? 2050);
  const [enableRedundancy, setEnableRedundancy] = useState(initialScenario?.enableRedundancy ?? false);
  const [redundancyYear, setRedundancyYear] = useState(initialScenario?.redundancyYear ?? 2031);
  const [secondRedundancyYear, setSecondRedundancyYear] = useState(
    initialScenario?.secondRedundancyYear ?? 2039,
  );

  const [baseLivingCost, setBaseLivingCost] = useState(initialScenario?.baseLivingCost ?? 40000);
  const [child1AnnualCost, setChild1AnnualCost] = useState(initialScenario?.child1AnnualCost ?? 30000);
  const [child2AnnualCost, setChild2AnnualCost] = useState(initialScenario?.child2AnnualCost ?? 20000);
  const [emergencyFundAnnual, setEmergencyFundAnnual] = useState(initialScenario?.emergencyFundAnnual ?? 5000);
  const [pensionContributionRate, setPensionContributionRate] = useState(
    initialScenario?.pensionContributionRate ?? 5,
  );

  const [visaCostPreSecondHouse, setVisaCostPreSecondHouse] = useState(initialScenario?.visaCostPreSecondHouse ?? 2200);
  const [visaCostAtSecondHouse, setVisaCostAtSecondHouse] = useState(initialScenario?.visaCostAtSecondHouse ?? 2500);

  const [carCost, setCarCost] = useState(initialScenario?.carCost ?? 20000);
  const [kid1GiftAmount, setKid1GiftAmount] = useState(initialScenario?.kid1GiftAmount ?? 100000);
  const [kid2GiftAmount, setKid2GiftAmount] = useState(initialScenario?.kid2GiftAmount ?? 100000);
  const [combinedGiftAmount, setCombinedGiftAmount] = useState(
    (initialScenario?.kid1GiftAmount ?? 100000) + (initialScenario?.kid2GiftAmount ?? 100000),
  );

  const [isaContributionCap, setIsaContributionCap] = useState(initialScenario?.isaContributionCap ?? 40000);
  const [recessionHitPct, setRecessionHitPct] = useState(initialScenario?.recessionHitPct ?? 20);
  const [cgtRatePct, setCgtRatePct] = useState(initialScenario?.cgtRatePct ?? 20);

  const [initialCash, setInitialCash] = useState(initialScenario?.initialCash ?? 300000);

  const [showAdvanced, setShowAdvanced] = useState(initialScenario?.showAdvanced ?? false);

  const [lockHouseLink, setLockHouseLink] = useState(initialScenario?.lockHouseLink ?? false);
  const [depositPool, setDepositPool] = useState(
    (initialScenario?.initialDeposit ?? 300000) + (initialScenario?.secondHouseDeposit ?? 200000),
  );
  const [mortgagePool, setMortgagePool] = useState(
    (initialScenario?.initialMortgage ?? 300000) + (initialScenario?.secondMortgage ?? 100000),
  );

  const [usePrivateSchool, setUsePrivateSchool] = useState(initialScenario?.usePrivateSchool ?? false);

  const [showIncomeLine, setShowIncomeLine] = useState(initialScenario?.showIncomeLine ?? true);
  const [showSurplusLine, setShowSurplusLine] = useState(initialScenario?.showSurplusLine ?? true);
  const [showIsaLine, setShowIsaLine] = useState(initialScenario?.showIsaLine ?? true);
  const [showMortgageBalanceLine, setShowMortgageBalanceLine] = useState(initialScenario?.showMortgageBalanceLine ?? true);
  const [showPieChart, setShowPieChart] = useState(initialScenario?.showPieChart ?? false);
  const [showAssumptions, setShowAssumptions] = useState(initialScenario?.showAssumptions ?? false);

  const [presetName, setPresetName] = useState(initialScenario?.presetName ?? '');
  const [linkCopyStatus, setLinkCopyStatus] = useState('');
  const [activeTab, setActiveTab] = useState(initialScenario?.activeTab ?? 'planner');
  const [strategyApplyMode, setStrategyApplyMode] = useState(
    initialScenario?.strategyApplyMode ?? 'defaultScenario',
  );

  const [startYear, setStartYear] = useState(initialScenario?.startYear ?? 2027);
  const [firstHousePurchaseYear, setFirstHousePurchaseYear] = useState(initialScenario?.firstHousePurchaseYear ?? 2027);
  const [enableSecondHouse, setEnableSecondHouse] = useState(initialScenario?.enableSecondHouse ?? true);

  const initialPropertyValue = useMemo(
    () => initialMortgage + initialDeposit,
    [initialMortgage, initialDeposit],
  );

  const moveIncrementValue = useMemo(
    () => (enableSecondHouse ? secondMortgage + secondHouseDeposit : 0),
    [enableSecondHouse, secondMortgage, secondHouseDeposit],
  );
  const plannerSecondHouseYearMax = useMemo(
    () => getOptimizerUpgradeYearMax(initialPropertyValue),
    [initialPropertyValue],
  );
  const effectiveSecondHouseYear = useMemo(
    () => Math.min(secondHouseYear, plannerSecondHouseYearMax),
    [secondHouseYear, plannerSecondHouseYearMax],
  );

  const [optimizerPropertyMode, setOptimizerPropertyMode] = useState(
    initialScenario?.optimizerPropertyMode ?? 'both',
  );
  const [optimizerUsePrivateSchool, setOptimizerUsePrivateSchool] = useState(
    initialScenario?.optimizerUsePrivateSchool ?? initialScenario?.usePrivateSchool ?? false,
  );
  const [optimizerFirstHouseDepositMin, setOptimizerFirstHouseDepositMin] = useState(
    initialScenario?.optimizerFirstHouseDepositMin
      ?? Math.max(0, roundToStep(Math.max(initialDeposit, 50000) * 0.75, 50000)),
  );
  const [optimizerFirstHouseDepositMax, setOptimizerFirstHouseDepositMax] = useState(
    initialScenario?.optimizerFirstHouseDepositMax
      ?? Math.max(
        Math.max(0, roundToStep(Math.max(initialDeposit, 50000) * 0.75, 50000)),
        roundToStep(Math.max(initialDeposit, 50000) * 1.25, 50000),
      ),
  );
  const [optimizerFirstHouseMortgageMin, setOptimizerFirstHouseMortgageMin] = useState(
    clampValue(
      initialScenario?.optimizerFirstHouseMortgageMin
        ?? Math.max(0, roundToStep(Math.max(initialMortgage, 100000) * 0.75, 50000)),
      0,
      OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
    ),
  );
  const [optimizerFirstHouseMortgageMax, setOptimizerFirstHouseMortgageMax] = useState(
    clampValue(
      initialScenario?.optimizerFirstHouseMortgageMax
        ?? Math.max(
          Math.max(0, roundToStep(Math.max(initialMortgage, 100000) * 0.75, 50000)),
          OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
          roundToStep(Math.max(initialMortgage, 100000) * 1.25, 50000),
        ),
      0,
      OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
    ),
  );
  const [optimizerSecondHouseDepositMin, setOptimizerSecondHouseDepositMin] = useState(
    initialScenario?.optimizerSecondHouseDepositMin
      ?? Math.max(0, roundToStep(Math.max(secondHouseDeposit, 100000) * 0.75, 50000)),
  );
  const [optimizerSecondHouseDepositMax, setOptimizerSecondHouseDepositMax] = useState(
    initialScenario?.optimizerSecondHouseDepositMax
      ?? Math.max(
        Math.max(0, roundToStep(Math.max(secondHouseDeposit, 100000) * 0.75, 50000)),
        roundToStep(Math.max(secondHouseDeposit, 100000) * 1.25, 50000),
      ),
  );
  const [optimizerSecondHouseMortgageMin, setOptimizerSecondHouseMortgageMin] = useState(
    clampValue(
      initialScenario?.optimizerSecondHouseMortgageMin
        ?? Math.max(0, roundToStep(Math.max(secondMortgage, 100000) * 0.75, 50000)),
      0,
      OPTIMIZER_MAX_TOTAL_MORTGAGE,
    ),
  );
  const [optimizerSecondHouseMortgageMax, setOptimizerSecondHouseMortgageMax] = useState(
    clampValue(
      initialScenario?.optimizerSecondHouseMortgageMax
        ?? Math.max(
          Math.max(0, roundToStep(Math.max(secondMortgage, 100000) * 0.75, 50000)),
          Math.max(
            0,
            OPTIMIZER_MAX_UPGRADE_VALUE - Math.max(
              Math.max(0, roundToStep(Math.max(secondHouseDeposit, 100000) * 0.75, 50000)),
              roundToStep(Math.max(secondHouseDeposit, 100000) * 1.25, 50000),
            ),
          ),
          roundToStep(Math.max(secondMortgage, 100000) * 1.25, 50000),
        ),
      0,
      OPTIMIZER_MAX_TOTAL_MORTGAGE,
    ),
  );
  const [optimizerSecondHouseYearMin, setOptimizerSecondHouseYearMin] = useState(
    initialScenario?.optimizerSecondHouseYearMin ?? Math.max(secondHouseYear - 3, startYear + 1),
  );
  const [optimizerSecondHouseYearMax, setOptimizerSecondHouseYearMax] = useState(
    initialScenario?.optimizerSecondHouseYearMax ?? Math.min(secondHouseYear + 3, OPTIMIZER_LATE_UPGRADE_YEAR_MAX),
  );
  const [optimizerEarlyMortgagePctMin, setOptimizerEarlyMortgagePctMin] = useState(
    initialScenario?.optimizerEarlyMortgagePctMin ?? clampValue(salaryMortgageEarly - 5, 5, 35),
  );
  const [optimizerEarlyMortgagePctMax, setOptimizerEarlyMortgagePctMax] = useState(
    initialScenario?.optimizerEarlyMortgagePctMax ?? clampValue(salaryMortgageEarly + 5, 5, 35),
  );
  const [optimizerLaterMortgagePctMin, setOptimizerLaterMortgagePctMin] = useState(
    initialScenario?.optimizerLaterMortgagePctMin ?? clampValue(salaryMortgageLater - 5, 5, 50),
  );
  const [optimizerLaterMortgagePctMax, setOptimizerLaterMortgagePctMax] = useState(
    initialScenario?.optimizerLaterMortgagePctMax ?? clampValue(salaryMortgageLater + 5, 5, 50),
  );
  const [selectedOptimizerResultKey, setSelectedOptimizerResultKey] = useState('');
  const [precomputedOptimizerPayload, setPrecomputedOptimizerPayload] = useState(null);
  const [precomputedOptimizerError, setPrecomputedOptimizerError] = useState('');
  const [showAllFeasibleResults, setShowAllFeasibleResults] = useState(false);
  const [allFeasiblePage, setAllFeasiblePage] = useState(1);
  const [showOptimizerIntro, setShowOptimizerIntro] = useState(
    initialScenario?.showOptimizerIntro ?? false,
  );
  const [showOptimizerAssumptions, setShowOptimizerAssumptions] = useState(
    initialScenario?.showOptimizerAssumptions ?? false,
  );
  const [expandedOptimizerIncomeId, setExpandedOptimizerIncomeId] = useState(
    initialScenario?.expandedOptimizerIncomeId ?? OPTIMIZER_INCOME_CASES[0].id,
  );
  const [selectedOptimizerObjective, setSelectedOptimizerObjective] = useState(
    initialScenario?.selectedOptimizerObjective ?? 'netWorth',
  );
  const [robustnessObjective, setRobustnessObjective] = useState(
    initialScenario?.robustnessObjective ?? 'robust',
  );
  const [robustnessReport, setRobustnessReport] = useState(null);
  const [robustnessError, setRobustnessError] = useState('');
  const [robustnessPathView, setRobustnessPathView] = useState('all');

  const kid1GiftYear = child1BirthYear + 27;
  const kid2GiftYear = child2BirthYear + 27;

  const startAge = useMemo(() => startYear - BASE_BIRTH_YEAR, [startYear]);

  const firstHouseStampDuty = useMemo(
    () => calculateStampDuty(initialPropertyValue, false),
    [initialPropertyValue],
  );

  const handleCombinedGiftAmountChange = (value) => {
    const totalGift = Math.max(0, value);
    const firstGift = Math.round(totalGift / 2);
    const secondGift = totalGift - firstGift;

    setCombinedGiftAmount(totalGift);
    setKid1GiftAmount(firstGift);
    setKid2GiftAmount(secondGift);
  };

  const handleInitialCashChange = (value) => {
    const newCash = Math.max(0, value);
    let newDeposit = initialDeposit;
    if (newDeposit > newCash) {
      newDeposit = newCash;
    }
    const newIsa = Math.max(0, newCash - newDeposit);
    setInitialCash(newCash);
    setInitialDeposit(newDeposit);
    setIsaSeed(newIsa);
  };

  const handleInitialDepositChange = (value) => {
    const raw = Math.max(0, value);
    const maxFromCash = initialCash;
    const maxFromPool = lockHouseLink ? depositPool : Infinity;
    const maxAllowed = Math.min(maxFromCash, maxFromPool);
    const newDeposit = Math.min(raw, maxAllowed);

    const newIsa = Math.max(0, initialCash - newDeposit);
    setInitialDeposit(newDeposit);
    setIsaSeed(newIsa);

    if (lockHouseLink) {
      const newSecondDeposit = Math.max(0, depositPool - newDeposit);
      setSecondHouseDeposit(newSecondDeposit);
    }
  };

  const handleIsaSeedChange = (value) => {
    const raw = Math.max(0, value);
    const newIsa = Math.min(raw, initialCash);
    const newDeposit = Math.max(0, initialCash - newIsa);
    setIsaSeed(newIsa);
    setInitialDeposit(newDeposit);

    if (lockHouseLink) {
      const newSecondDeposit = Math.max(0, depositPool - newDeposit);
      setSecondHouseDeposit(newSecondDeposit);
    }
  };

  const handleInitialMortgageChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setInitialMortgage(raw);
      return;
    }
    const maxAllowed = mortgagePool;
    const newInitialMortgage = Math.min(raw, maxAllowed);
    const newSecondMortgage = Math.max(0, mortgagePool - newInitialMortgage);
    setInitialMortgage(newInitialMortgage);
    setSecondMortgage(newSecondMortgage);
  };

  const handleSecondMortgageChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setSecondMortgage(raw);
      return;
    }
    const maxAllowed = mortgagePool;
    const newSecondMortgage = Math.min(raw, maxAllowed);
    const newInitialMortgage = Math.max(0, mortgagePool - newSecondMortgage);
    setSecondMortgage(newSecondMortgage);
    setInitialMortgage(newInitialMortgage);
  };

  const handleSecondHouseDepositChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setSecondHouseDeposit(raw);
      return;
    }
    const maxSecondFromPool = depositPool;
    let newSecondDeposit = Math.min(raw, maxSecondFromPool);
    let newInitialDeposit = depositPool - newSecondDeposit;

    if (newInitialDeposit > initialCash) {
      newInitialDeposit = initialCash;
      newSecondDeposit = Math.max(0, depositPool - newInitialDeposit);
    }

    const newIsa = Math.max(0, initialCash - newInitialDeposit);

    setSecondHouseDeposit(newSecondDeposit);
    setInitialDeposit(newInitialDeposit);
    setIsaSeed(newIsa);
  };

  const toggleHouseLock = () => {
    setLockHouseLink(prev => {
      const next = !prev;
      if (next) {
        setDepositPool(initialDeposit + secondHouseDeposit);
        setMortgagePool(initialMortgage + secondMortgage);
      }
      return next;
    });
  };

  const currentScenario = useMemo(() => ({
    mortgageRate,
    salaryMortgageEarly,
    salaryMortgageLater,
    realGrowthCosts,
    realGrowthProperty,
    isaGrowth,
    initialMortgage,
    initialDeposit,
    secondMortgage,
    isaSeed,
    income1Start,
    income2Start,
    incomeGrowth,
    secondHouseYear: effectiveSecondHouseYear,
    secondHouseDeposit,
    child1BirthYear,
    child2BirthYear,
    recessionYear,
    secondRecessionYear,
    thirdRecessionYear,
    enableRedundancy,
    redundancyYear,
    secondRedundancyYear,
    baseLivingCost,
    child1AnnualCost,
    child2AnnualCost,
    emergencyFundAnnual,
    pensionContributionRate,
    visaCostPreSecondHouse,
    visaCostAtSecondHouse,
    carCost,
    kid1GiftAmount,
    kid2GiftAmount,
    isaContributionCap,
    recessionHitPct,
    cgtRatePct,
    initialCash,
    usePrivateSchool,
    lockHouseLink,
    showIncomeLine,
    showSurplusLine,
    showIsaLine,
    showMortgageBalanceLine,
    showPieChart,
    showAssumptions,
    startYear,
    firstHousePurchaseYear,
    enableSecondHouse,
    presetName,
    showAdvanced,
    activeTab,
    strategyApplyMode,
    optimizerPropertyMode,
    optimizerUsePrivateSchool,
    showOptimizerIntro,
    showOptimizerAssumptions,
    expandedOptimizerIncomeId,
    selectedOptimizerObjective,
    robustnessObjective,
    optimizerFirstHouseDepositMin,
    optimizerFirstHouseDepositMax,
    optimizerFirstHouseMortgageMin,
    optimizerFirstHouseMortgageMax,
    optimizerSecondHouseDepositMin,
    optimizerSecondHouseDepositMax,
    optimizerSecondHouseMortgageMin,
    optimizerSecondHouseMortgageMax,
    optimizerSecondHouseYearMin,
    optimizerSecondHouseYearMax,
    optimizerEarlyMortgagePctMin,
    optimizerEarlyMortgagePctMax,
    optimizerLaterMortgagePctMin,
    optimizerLaterMortgagePctMax,
  }), [
    mortgageRate,
    salaryMortgageEarly,
    salaryMortgageLater,
    realGrowthCosts,
    realGrowthProperty,
    isaGrowth,
    initialMortgage,
    initialDeposit,
    secondMortgage,
    isaSeed,
    income1Start,
    income2Start,
    incomeGrowth,
    effectiveSecondHouseYear,
    secondHouseDeposit,
    child1BirthYear,
    child2BirthYear,
    recessionYear,
    secondRecessionYear,
    thirdRecessionYear,
    enableRedundancy,
    redundancyYear,
    secondRedundancyYear,
    baseLivingCost,
    child1AnnualCost,
    child2AnnualCost,
    emergencyFundAnnual,
    pensionContributionRate,
    visaCostPreSecondHouse,
    visaCostAtSecondHouse,
    carCost,
    kid1GiftAmount,
    kid2GiftAmount,
    isaContributionCap,
    recessionHitPct,
    cgtRatePct,
    initialCash,
    usePrivateSchool,
    lockHouseLink,
    showIncomeLine,
    showSurplusLine,
    showIsaLine,
    showMortgageBalanceLine,
    showPieChart,
    showAssumptions,
    startYear,
    firstHousePurchaseYear,
    enableSecondHouse,
    presetName,
    showAdvanced,
    activeTab,
    strategyApplyMode,
    optimizerPropertyMode,
    optimizerUsePrivateSchool,
    showOptimizerIntro,
    showOptimizerAssumptions,
    expandedOptimizerIncomeId,
    selectedOptimizerObjective,
    robustnessObjective,
    optimizerFirstHouseDepositMin,
    optimizerFirstHouseDepositMax,
    optimizerFirstHouseMortgageMin,
    optimizerFirstHouseMortgageMax,
    optimizerSecondHouseDepositMin,
    optimizerSecondHouseDepositMax,
    optimizerSecondHouseMortgageMin,
    optimizerSecondHouseMortgageMax,
    optimizerSecondHouseYearMin,
    optimizerSecondHouseYearMax,
    optimizerEarlyMortgagePctMin,
    optimizerEarlyMortgagePctMax,
    optimizerLaterMortgagePctMin,
    optimizerLaterMortgagePctMax,
  ]);

  const handleCopyScenarioLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopyStatus('Link copied');
    } catch {
      setLinkCopyStatus('Copy failed');
    }
  };

  useEffect(() => {
    if (!linkCopyStatus) return undefined;

    const timeoutId = window.setTimeout(() => {
      setLinkCopyStatus('');
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [linkCopyStatus]);

  useEffect(() => {
    saveFiltersToURL(currentScenario);
  }, [currentScenario]);

  useEffect(() => {
    if (activeTab !== 'optimizer' || precomputedOptimizerPayload || precomputedOptimizerError) {
      return undefined;
    }

    let cancelled = false;

    const loadPrecomputedOptimizerResults = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}precomputed-optimizer-results.json`);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload = validatePrecomputedOptimizerPayload(await response.json());
        if (!cancelled) {
          setPrecomputedOptimizerPayload(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setPrecomputedOptimizerError(error instanceof Error ? error.message : 'Failed to load precomputed optimizer results');
        }
      }
    };

    loadPrecomputedOptimizerResults();

    return () => {
      cancelled = true;
    };
  }, [activeTab, precomputedOptimizerPayload, precomputedOptimizerError]);

  useEffect(() => {
    if (activeTab !== 'robustness' || robustnessReport || robustnessError) {
      return undefined;
    }

    let cancelled = false;

    const loadRobustnessReport = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}robustness-analysis/report.json`);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload = validateRobustnessReport(await response.json());
        if (!cancelled) {
          setRobustnessReport(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setRobustnessError(error instanceof Error ? error.message : 'Failed to load robustness report');
        }
      }
    };

    loadRobustnessReport();

    return () => {
      cancelled = true;
    };
  }, [activeTab, robustnessReport, robustnessError]);

  const handleSecondHouseYearChange = (value) => {
    const adjusted = Math.min(
      Math.max(value, firstHousePurchaseYear + 1),
      plannerSecondHouseYearMax,
    );
    setSecondHouseYear(adjusted);
  };

  const handleFirstHouseYearChange = (value) => {
    setFirstHousePurchaseYear(Math.max(startYear, value));
  };

  const buildSimulationParams = useCallback(
    (overrides = {}) => ({
      startYear,
      firstHousePurchaseYear,
      startAge,
      mortgageRate,
      salaryMortgageEarly,
      salaryMortgageLater,
      realGrowthCosts,
      realGrowthProperty,
      isaGrowth,
      initialMortgage,
      secondMortgage,
      initialDeposit,
      secondHouseDeposit,
      isaSeed,
      income1Start,
      income2Start,
      incomeGrowth,
      secondHouseYear: effectiveSecondHouseYear,
      child1BirthYear,
      child2BirthYear,
      kid1GiftYear,
      kid2GiftYear,
      recessionYear,
      secondRecessionYear,
      thirdRecessionYear,
      enableRedundancy,
      redundancyYear,
      secondRedundancyYear,
      baseLivingCost,
      child1AnnualCost,
      child2AnnualCost,
      emergencyFundAnnual,
      pensionContributionRate,
      visaCostPreSecondHouse,
      visaCostAtSecondHouse,
      carCost,
      kid1GiftAmount,
      kid2GiftAmount,
      isaContributionCap,
      recessionHitPct,
      cgtRatePct,
      usePrivateSchool,
      enableSecondHouse,
      calculateTakeHomePayFn: calculateRealTermsTakeHomePay,
      ...overrides,
    }),
    [
      startYear,
      firstHousePurchaseYear,
      startAge,
      mortgageRate,
      salaryMortgageEarly,
      salaryMortgageLater,
      realGrowthCosts,
      realGrowthProperty,
      isaGrowth,
      initialMortgage,
      secondMortgage,
      initialDeposit,
      secondHouseDeposit,
      isaSeed,
      income1Start,
      income2Start,
      incomeGrowth,
      effectiveSecondHouseYear,
      child1BirthYear,
      child2BirthYear,
      kid1GiftYear,
      kid2GiftYear,
      recessionYear,
      secondRecessionYear,
      thirdRecessionYear,
      enableRedundancy,
      redundancyYear,
      secondRedundancyYear,
      baseLivingCost,
      child1AnnualCost,
      child2AnnualCost,
      emergencyFundAnnual,
      pensionContributionRate,
      visaCostPreSecondHouse,
      visaCostAtSecondHouse,
      carCost,
      kid1GiftAmount,
      kid2GiftAmount,
      isaContributionCap,
      recessionHitPct,
      cgtRatePct,
      usePrivateSchool,
      enableSecondHouse,
    ],
  );

  const {
    financialData,
    mortgageRepayYear,
    secondHouseValueAtMove,
    secondHousePurchasePrice,
    secondHouseFundingGap,
    firstHouseSaleCosts,
    firstMortgagePaidOffYear,
    minIsaBalance,
    minLiquidBufferPost2032,
    finalLiquidNet: simulatedFinalLiquidNet,
    terminalMortgagePaydown,
    finalMortgageBalance: simulatedFinalMortgageBalance,
    negativeAmortizationYears,
    capitalizedInterestTotal,
  } = useMemo(
    () => simulateFinancialPlan(buildSimulationParams()),
    [buildSimulationParams],
  );

  const secondHouseStampDuty = useMemo(() => {
    if (!enableSecondHouse) return 0;
    const purchasePrice = secondHousePurchasePrice || (initialPropertyValue + moveIncrementValue);
    return calculateStampDuty(purchasePrice, false);
  }, [enableSecondHouse, secondHousePurchasePrice, initialPropertyValue, moveIncrementValue]);
  const firstHousePurchaseCosts = firstHouseStampDuty + FIRST_HOUSE_LEGAL_FEES;
  const secondHousePurchaseCosts = enableSecondHouse
    ? secondHouseStampDuty + SECOND_HOUSE_LEGAL_FEES + firstHouseSaleCosts
    : 0;

  const finalYear = financialData[financialData.length - 1] || {};
  const totalMortgagePayments = finalYear.totalMortgagePayments || 0;
  const finalPropertyValue = finalYear.propertyValue || 0;
  const finalIsaTotal = finalYear.isaTotal || 0;
  const finalSurplusPot = finalYear.surplusPot || 0;
  const finalMortgageBalance = financialData.length
    ? finalYear.mortgageBalance || 0
    : simulatedFinalMortgageBalance;
  const finalShortfall = finalYear.cumulativeShortfall || 0;
  const finalLiquidNet = financialData.length
    ? finalIsaTotal + finalSurplusPot - finalShortfall
    : simulatedFinalLiquidNet;

  const { caseResults: optimizerResults, searchMeta: optimizerSearchMeta } = useMemo(() => {
    if (activeTab !== 'optimizer') {
      return {
        caseResults: [],
        searchMeta: null,
      };
    }

    return runHousingOptimizer({
      baseParams: buildSimulationParams({
        usePrivateSchool: optimizerUsePrivateSchool,
      }),
      searchConfig: {
        propertyMode: optimizerPropertyMode,
        firstHouseDepositMin: optimizerFirstHouseDepositMin,
        firstHouseDepositMax: optimizerFirstHouseDepositMax,
        firstHouseMortgageMin: optimizerFirstHouseMortgageMin,
        firstHouseMortgageMax: optimizerFirstHouseMortgageMax,
        firstHouseYearMin: OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
        firstHouseYearMax: OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
        secondHouseDepositMin: optimizerSecondHouseDepositMin,
        secondHouseDepositMax: optimizerSecondHouseDepositMax,
        secondHouseMortgageMin: optimizerSecondHouseMortgageMin,
        secondHouseMortgageMax: optimizerSecondHouseMortgageMax,
        secondHouseYearMin: optimizerSecondHouseYearMin,
        secondHouseYearMax: optimizerSecondHouseYearMax,
        earlyMortgagePctMin: optimizerEarlyMortgagePctMin,
        earlyMortgagePctMax: optimizerEarlyMortgagePctMax,
        laterMortgagePctMin: optimizerLaterMortgagePctMin,
        laterMortgagePctMax: optimizerLaterMortgagePctMax,
      },
    });
  }, [
    activeTab,
    buildSimulationParams,
    optimizerPropertyMode,
    optimizerUsePrivateSchool,
    optimizerFirstHouseDepositMin,
    optimizerFirstHouseDepositMax,
    optimizerFirstHouseMortgageMin,
    optimizerFirstHouseMortgageMax,
    optimizerSecondHouseDepositMin,
    optimizerSecondHouseDepositMax,
    optimizerSecondHouseMortgageMin,
    optimizerSecondHouseMortgageMax,
    optimizerSecondHouseYearMin,
    optimizerSecondHouseYearMax,
    optimizerEarlyMortgagePctMin,
    optimizerEarlyMortgagePctMax,
    optimizerLaterMortgagePctMin,
    optimizerLaterMortgagePctMax,
  ]);

  const selectedOptimizerObjectiveDefinition = useMemo(
    () => getOptimizerObjectiveDefinition(selectedOptimizerObjective),
    [selectedOptimizerObjective],
  );
  const getOptimizerCaseObjectiveBundle = useCallback((caseResult) => (
    caseResult?.objectiveResults?.[selectedOptimizerObjective] ?? {
      bestResult: caseResult?.bestResult ?? null,
      topResults: caseResult?.topResults ?? [],
    }
  ), [selectedOptimizerObjective]);

  const optimizerRecommendedResults = useMemo(() => (
    optimizerResults
      .map((caseResult) => getOptimizerCaseObjectiveBundle(caseResult).bestResult)
      .filter(Boolean)
      .sort((left, right) => compareOptimizerResultsForObjective(
        selectedOptimizerObjective,
        left,
        right,
      ))
  ), [getOptimizerCaseObjectiveBundle, optimizerResults, selectedOptimizerObjective]);

  const selectedPrecomputedOptimizerPayload = useMemo(() => {
    if (!precomputedOptimizerPayload) return null;

    if (precomputedOptimizerPayload.variants) {
      return optimizerUsePrivateSchool
        ? precomputedOptimizerPayload.variants.privateSchool
        : precomputedOptimizerPayload.variants.standard;
    }

    return precomputedOptimizerPayload;
  }, [optimizerUsePrivateSchool, precomputedOptimizerPayload]);
  const precomputedOptimizerResults = useMemo(
    () => selectedPrecomputedOptimizerPayload?.caseResults ?? [],
    [selectedPrecomputedOptimizerPayload],
  );
  const optimizerAssumptionBaseParams = selectedPrecomputedOptimizerPayload?.baseParams ?? null;
  const precomputedOptimizerSearchMeta = selectedPrecomputedOptimizerPayload?.searchMeta ?? null;
  const precomputedOptimizerGeneratedAt = selectedPrecomputedOptimizerPayload?.generatedAt ?? '';
  const hasPrecomputedOptimizerResults = selectedPrecomputedOptimizerPayload !== null;
  const precomputedRecommendedResults = useMemo(() => (
    precomputedOptimizerResults
      .map((caseResult) => getOptimizerCaseObjectiveBundle(caseResult).bestResult)
      .filter(Boolean)
      .sort((left, right) => compareOptimizerResultsForObjective(
        selectedOptimizerObjective,
        left,
        right,
      ))
  ), [getOptimizerCaseObjectiveBundle, precomputedOptimizerResults, selectedOptimizerObjective]);
  const precomputedStoredResults = useMemo(() => (
    precomputedOptimizerResults
      .flatMap((caseResult) => getOptimizerCaseObjectiveBundle(caseResult).topResults)
      .sort((left, right) => compareOptimizerResultsForObjective(
        selectedOptimizerObjective,
        left,
        right,
      ))
  ), [getOptimizerCaseObjectiveBundle, precomputedOptimizerResults, selectedOptimizerObjective]);
  const displayOptimizerSearchMeta = hasPrecomputedOptimizerResults
    ? precomputedOptimizerSearchMeta
    : optimizerSearchMeta;
  const allFeasiblePageSize = 50;
  const allFeasiblePageCount = Math.max(
    1,
    Math.ceil(precomputedStoredResults.length / allFeasiblePageSize),
  );
  const pagedFeasibleResults = useMemo(() => {
    const start = (allFeasiblePage - 1) * allFeasiblePageSize;
    return precomputedStoredResults.slice(start, start + allFeasiblePageSize);
  }, [allFeasiblePage, precomputedStoredResults]);
  useEffect(() => {
    if (allFeasiblePage > allFeasiblePageCount) {
      setAllFeasiblePage(allFeasiblePageCount);
    }
  }, [allFeasiblePage, allFeasiblePageCount]);
  useEffect(() => {
    setSelectedOptimizerResultKey('');
    setAllFeasiblePage(1);
  }, [optimizerUsePrivateSchool, selectedOptimizerObjective]);

  const optimizerResultsByIncome = useMemo(() => (
    OPTIMIZER_INCOME_CASES.map((incomeCase) => ({
      incomeCase,
      caseResults: optimizerResults
        .filter(({ assumptionCase }) => assumptionCase.incomeCase.id === incomeCase.id)
        .sort(
          (left, right) => left.assumptionCase.sortOrder - right.assumptionCase.sortOrder,
        ),
    }))
  ), [optimizerResults]);
  const precomputedResultsByIncome = useMemo(() => (
    OPTIMIZER_INCOME_CASES.map((incomeCase) => ({
      incomeCase,
      caseResults: precomputedOptimizerResults
        .filter(({ assumptionCase }) => assumptionCase.incomeCase.id === incomeCase.id)
        .sort(
          (left, right) => left.assumptionCase.sortOrder - right.assumptionCase.sortOrder,
        ),
    }))
  ), [precomputedOptimizerResults]);

  const displayOptimizerResults = hasPrecomputedOptimizerResults
    ? precomputedStoredResults
    : optimizerRecommendedResults;
  const displayOptimizerRecommendedResults = hasPrecomputedOptimizerResults
    ? precomputedRecommendedResults
    : optimizerRecommendedResults;
  const displayOptimizerResultsByIncome = hasPrecomputedOptimizerResults
    ? precomputedResultsByIncome
    : optimizerResultsByIncome;

  const selectedOptimizerResult = useMemo(() => {
    if (!displayOptimizerResults.length) return null;

    return displayOptimizerResults.find(
      result => getOptimizerResultKey(result) === selectedOptimizerResultKey,
    ) || displayOptimizerResults[0];
  }, [displayOptimizerResults, selectedOptimizerResultKey]);

  const applyPlannerBaseParams = useCallback((appliedBaseParams, fallbackPrivateSchool = false) => {
    const forcedPrivateSchool = strategyApplyMode === 'privateSchoolOn';

    if (appliedBaseParams) {
      setStartYear(appliedBaseParams.startYear);
      setMortgageRate(appliedBaseParams.mortgageRate);
      setRealGrowthCosts(appliedBaseParams.realGrowthCosts);
      setChild1BirthYear(appliedBaseParams.child1BirthYear);
      setChild2BirthYear(appliedBaseParams.child2BirthYear);
      setBaseLivingCost(appliedBaseParams.baseLivingCost);
      setChild1AnnualCost(appliedBaseParams.child1AnnualCost);
      setChild2AnnualCost(appliedBaseParams.child2AnnualCost);
      setEmergencyFundAnnual(appliedBaseParams.emergencyFundAnnual);
      setPensionContributionRate(appliedBaseParams.pensionContributionRate);
      setVisaCostPreSecondHouse(appliedBaseParams.visaCostPreSecondHouse);
      setVisaCostAtSecondHouse(appliedBaseParams.visaCostAtSecondHouse);
      setCarCost(appliedBaseParams.carCost);
      setKid1GiftAmount(appliedBaseParams.kid1GiftAmount);
      setKid2GiftAmount(appliedBaseParams.kid2GiftAmount);
      setCombinedGiftAmount(appliedBaseParams.kid1GiftAmount + appliedBaseParams.kid2GiftAmount);
      setIsaContributionCap(appliedBaseParams.isaContributionCap);
      setRecessionHitPct(appliedBaseParams.recessionHitPct);
      setCgtRatePct(appliedBaseParams.cgtRatePct);
      setRecessionYear(appliedBaseParams.recessionYear);
      setSecondRecessionYear(appliedBaseParams.secondRecessionYear);
      setThirdRecessionYear(appliedBaseParams.thirdRecessionYear);
      setEnableRedundancy(appliedBaseParams.enableRedundancy);
      setRedundancyYear(appliedBaseParams.redundancyYear);
      setSecondRedundancyYear(appliedBaseParams.secondRedundancyYear);
      setUsePrivateSchool(forcedPrivateSchool || appliedBaseParams.usePrivateSchool);
    } else {
      setUsePrivateSchool(forcedPrivateSchool || fallbackPrivateSchool);
    }
  }, [strategyApplyMode]);

  const shouldUseStoredApplyBaseline = strategyApplyMode !== 'currentPlanner';

  const handleApplyOptimizerResult = (result) => {
    const appliedBaseParams = selectedPrecomputedOptimizerPayload?.baseParams ?? null;

    if (shouldUseStoredApplyBaseline) {
      applyPlannerBaseParams(appliedBaseParams, optimizerUsePrivateSchool);
      setIncome1Start(OPTIMIZER_STARTING_INCOME_1);
      setIncome2Start(OPTIMIZER_STARTING_INCOME_2);
      setIncomeGrowth(result.assumptionCase.incomeGrowth);
      setIsaGrowth(result.assumptionCase.isaGrowth);
      setRealGrowthProperty(result.assumptionCase.propertyGrowth);
    }

    setInitialCash(result.initialDeposit + result.optimizerIsaSeed);
    setInitialDeposit(result.initialDeposit);
    setInitialMortgage(result.initialMortgage);
    setIsaSeed(result.optimizerIsaSeed);
    setFirstHousePurchaseYear(result.firstHousePurchaseYear);
    setSalaryMortgageEarly(result.salaryMortgageEarly);
    setSalaryMortgageLater(result.salaryMortgageLater);
    setEnableSecondHouse(result.enableSecondHouse);
    setLockHouseLink(false);

    if (result.enableSecondHouse) {
      setSecondHouseDeposit(result.secondHouseDeposit);
      setSecondMortgage(result.secondMortgage);
      setSecondHouseYear(result.secondHouseYear);
    } else {
      setSecondHouseDeposit(0);
      setSecondMortgage(0);
    }

    setPresetName(`${result.assumptionCase.label} plan`);
    setActiveTab('planner');
  };

  const handleApplyRobustnessStrategy = (robustStrategy) => {
    if (!robustnessReport) return;

    if (shouldUseStoredApplyBaseline) {
      applyPlannerBaseParams(
        robustnessReport.baseParams ?? null,
        robustnessReport.meta?.defaultApplyScenario?.usePrivateSchool ?? false,
      );
      setIncome1Start(OPTIMIZER_STARTING_INCOME_1);
      setIncome2Start(OPTIMIZER_STARTING_INCOME_2);
      setIncomeGrowth(robustnessReport.meta?.defaultApplyScenario?.incomeGrowth ?? incomeGrowth);
      setIsaGrowth(robustnessReport.meta?.defaultApplyScenario?.isaGrowth ?? isaGrowth);
      setRealGrowthProperty(
        robustnessReport.meta?.defaultApplyScenario?.propertyGrowth ?? realGrowthProperty,
      );
    }

    setInitialCash(
      robustStrategy.decisionVector.deposit1 + (robustStrategy.decisionVector.optimizerIsaSeed ?? 0),
    );
    setInitialDeposit(robustStrategy.decisionVector.deposit1);
    setInitialMortgage(robustStrategy.decisionVector.mortgage1);
    setIsaSeed(robustStrategy.decisionVector.optimizerIsaSeed ?? 0);
    setFirstHousePurchaseYear(robustStrategy.decisionVector.buyYear1);
    setSalaryMortgageEarly(robustStrategy.decisionVector.salaryMortgageEarly);
    setSalaryMortgageLater(robustStrategy.decisionVector.salaryMortgageLater);
    setEnableSecondHouse(Boolean(robustStrategy.decisionVector.buyYear2));
    setLockHouseLink(false);

    if (robustStrategy.decisionVector.buyYear2) {
      setSecondHouseDeposit(robustStrategy.decisionVector.deposit2);
      setSecondMortgage(robustStrategy.decisionVector.mortgage2);
      setSecondHouseYear(robustStrategy.decisionVector.buyYear2);
    } else {
      setSecondHouseDeposit(0);
      setSecondMortgage(0);
    }

    setPresetName(`Robust ${robustStrategy.strategyId}`);
    setActiveTab('planner');
  };

  const pieData = [
    { name: 'Mortgage Paid', value: totalMortgagePayments, color: '#f97316' },
    { name: 'Total Cash', value: Math.max(0, finalLiquidNet), color: '#8b5cf6' },
    { name: 'Property Value', value: Math.max(0, finalPropertyValue), color: '#22c55e' },
  ];

  const secondHouseValue = enableSecondHouse
    ? secondHouseValueAtMove || (initialPropertyValue + moveIncrementValue)
    : null;

  const minIsaSafe = minIsaBalance >= 60000;
  const post2032SavingsFloorSafe = minLiquidBufferPost2032 >= POST_2032_MIN_TOTAL_SAVINGS;

  const formatCurrency = (value) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };
  const formatProbability = (value) => `${(value * 100).toFixed(1)}%`;
  const formatStrategyOrigin = (origin) => ({
    'explicit-grid-one-home': 'Explicit grid: one-home',
    'explicit-grid-two-home': 'Explicit grid: two-home',
  }[origin] ?? String(origin || 'Unknown').replaceAll('-', ' '));

  const robustnessTopStrategies = robustnessReport?.topStrategies ?? [];
  const robustnessRecommendation = robustnessReport?.recommendation ?? null;
  const robustnessMeta = robustnessReport?.meta ?? null;
  const robustnessCharts = robustnessReport?.charts ?? null;
  const robustnessObjectiveDefinitions = robustnessMeta?.objectiveDefinitions ?? [
    {
      id: 'robust',
      label: 'Balanced robustness',
      description: 'Highest composite robust score: success rate first, then downside regret, then expected end net worth.',
    },
    {
      id: 'cashEnd',
      label: 'Cash savings at end',
      description: 'Highest weighted mean liquid cash left after the age-70 mortgage payoff.',
    },
    {
      id: 'propertyValue',
      label: 'Highest property value',
      description: 'Highest weighted mean end property value.',
    },
    {
      id: 'bigFirstHouse',
      label: 'Big first house',
      description: `First house value as close as possible to about ${formatCurrency(OPTIMIZER_BIG_FIRST_HOUSE_TARGET)}.`,
    },
    {
      id: 'privateSchoolSuccess',
      label: 'Private school',
      description: 'Highest weighted success rate inside the private-school futures.',
    },
  ];
  const strategyApplyModeDefinitions = STRATEGY_APPLY_MODE_DEFINITIONS;
  const selectedStrategyApplyModeDefinition = strategyApplyModeDefinitions.find(
    (mode) => mode.id === strategyApplyMode,
  ) ?? strategyApplyModeDefinitions[0];
  const selectedRobustnessObjectiveDefinition = robustnessObjectiveDefinitions.find(
    (objective) => objective.id === robustnessObjective,
  ) ?? robustnessObjectiveDefinitions[0];
  const robustnessStrategyCatalog = robustnessReport?.strategyCatalog ?? robustnessTopStrategies;
  const usePrivateSchoolApplyFilter = (
    robustnessObjective === 'privateSchoolSuccess'
    || strategyApplyMode === 'privateSchoolOn'
  );
  const getActiveRobustnessApplyCheck = useCallback((strategy) => (
    usePrivateSchoolApplyFilter
      ? (strategy.privateSchoolApplyScenarioCheck ?? strategy.defaultApplyScenarioCheck)
      : strategy.defaultApplyScenarioCheck
  ), [usePrivateSchoolApplyFilter]);
  const robustnessSelectedScatter = typeof robustnessCharts?.scatter === 'string'
    ? robustnessCharts.scatter
    : robustnessCharts?.scatter?.[robustnessObjective]?.[robustnessPathView]
      ?? robustnessCharts?.scatter?.[robustnessObjective]?.all
      ?? robustnessCharts?.scatter?.robust?.[robustnessPathView]
      ?? robustnessCharts?.scatter?.robust?.all
      ?? '';
  const robustnessSelectedCdf = typeof robustnessCharts?.cdf === 'string'
    ? robustnessCharts.cdf
    : robustnessCharts?.cdf?.[robustnessObjective]?.[robustnessPathView]
      ?? robustnessCharts?.cdf?.[robustnessObjective]?.all
      ?? robustnessCharts?.cdf?.robust?.[robustnessPathView]
      ?? robustnessCharts?.cdf?.robust?.all
      ?? '';
  const robustnessFilteredStrategies = useMemo(() => {
    if (robustnessPathView === 'oneHome') {
      return robustnessStrategyCatalog.filter((strategy) => strategy.pathType === 'One-home path');
    }
    if (robustnessPathView === 'twoHome') {
      return robustnessStrategyCatalog.filter((strategy) => strategy.pathType === 'Two-home path');
    }
    return robustnessStrategyCatalog;
  }, [robustnessPathView, robustnessStrategyCatalog]);
  const robustnessEligibleStrategies = useMemo(() => {
    const eligible = robustnessFilteredStrategies.filter(
      (strategy) => getActiveRobustnessApplyCheck(strategy)?.overallPass !== false,
    );
    return eligible.length > 0 ? eligible : robustnessFilteredStrategies;
  }, [getActiveRobustnessApplyCheck, robustnessFilteredStrategies]);
  const robustnessRankedStrategies = useMemo(
    () => [...robustnessEligibleStrategies].sort((left, right) => (
      compareRobustnessStrategiesForObjective(robustnessObjective, left, right)
    )),
    [robustnessEligibleStrategies, robustnessObjective],
  );
  const robustnessDisplayedStrategies = useMemo(
    () => robustnessRankedStrategies.slice(0, 15),
    [robustnessRankedStrategies],
  );
  const robustnessPathLeaderCards = useMemo(() => ([
    {
      key: 'all',
      label: 'Best overall',
      strategy: [...robustnessStrategyCatalog]
        .filter((strategy) => getActiveRobustnessApplyCheck(strategy)?.overallPass !== false)
        .sort((left, right) => compareRobustnessStrategiesForObjective(robustnessObjective, left, right))[0]
        ?? null,
    },
    {
      key: 'oneHome',
      label: 'Best one-home',
      strategy: [...robustnessStrategyCatalog]
        .filter((strategy) => getActiveRobustnessApplyCheck(strategy)?.overallPass !== false)
        .filter((strategy) => strategy.pathType === 'One-home path')
        .sort((left, right) => compareRobustnessStrategiesForObjective(robustnessObjective, left, right))[0]
        ?? null,
    },
    {
      key: 'twoHome',
      label: 'Best two-home',
      strategy: [...robustnessStrategyCatalog]
        .filter((strategy) => getActiveRobustnessApplyCheck(strategy)?.overallPass !== false)
        .filter((strategy) => strategy.pathType === 'Two-home path')
        .sort((left, right) => compareRobustnessStrategiesForObjective(robustnessObjective, left, right))[0]
        ?? null,
    },
  ]), [getActiveRobustnessApplyCheck, robustnessObjective, robustnessStrategyCatalog]);
  const buildRobustnessWhyLines = useCallback((strategy) => {
    if (!strategy) return [];

    if (robustnessObjective === 'cashEnd') {
      return [
        `This strategy ranks first on weighted cash left at the end: ${formatCurrency(strategy.metrics.expectedCashEnd)} after the age-${END_AGE} mortgage payoff.`,
        `It still keeps a weighted success rate of ${formatProbability(strategy.metrics.feasibilityProbability)}, so the extra cash is not coming from a fragile low-success path.`,
        `Its downside regret remains ${formatCurrency(strategy.metrics.regretCvar10)} in the worst 10% regret tail.`,
      ];
    }

    if (robustnessObjective === 'propertyValue') {
      return [
        `This strategy ranks first on weighted end property value: ${formatCurrency(strategy.metrics.expectedFinalPropertyValue)}.`,
        `It still keeps a weighted success rate of ${formatProbability(strategy.metrics.feasibilityProbability)} while getting there.`,
        `Its expected end net worth is ${formatCurrency(strategy.metrics.expectedEndNetWorth)}, so the higher property value is not being achieved by ignoring overall wealth entirely.`,
      ];
    }

    if (robustnessObjective === 'bigFirstHouse') {
      const firstHouseValue = strategy.decisionVector.deposit1 + strategy.decisionVector.mortgage1;
      const distance = Math.abs(firstHouseValue - OPTIMIZER_BIG_FIRST_HOUSE_TARGET);
      return [
        `Its first house value is ${formatCurrency(firstHouseValue)}, which is ${formatCurrency(distance)} away from the ${formatCurrency(OPTIMIZER_BIG_FIRST_HOUSE_TARGET)} target.`,
        `Among the strategies closest to that target, it has the strongest weighted success rate at ${formatProbability(strategy.metrics.feasibilityProbability)}.`,
        `Its expected end net worth is ${formatCurrency(strategy.metrics.expectedEndNetWorth)}, which is used as a later tie-breaker once the first-house target fit is satisfied.`,
      ];
    }

    if (robustnessObjective === 'privateSchoolSuccess') {
      return [
        `This strategy ranks first on private-school success rate: ${formatProbability(strategy.metrics.privateSchoolFeasibilityProbability)} inside the private-school futures.`,
        `It still keeps an overall weighted success rate of ${formatProbability(strategy.metrics.feasibilityProbability)} across the full future set.`,
        `Its downside regret remains ${formatCurrency(strategy.metrics.regretCvar10)}, so it is not only a school-fee specialist with weak downside behavior elsewhere.`,
      ];
    }

    return [
      `This strategy has the highest composite robust score at ${strategy.metrics.compositeRobustScore.toFixed(1)}.`,
      `Its weighted success rate is ${formatProbability(strategy.metrics.feasibilityProbability)}, with regret CVaR 10% of ${formatCurrency(strategy.metrics.regretCvar10)}.`,
      `Its weighted expected end net worth is ${formatCurrency(strategy.metrics.expectedEndNetWorth)}, so it balances survivability, downside control, and long-run wealth better than the nearby alternatives.`,
    ];
  }, [robustnessObjective]);

  const renderEndLabel = (color) => (props) => {
    const { x, y, index, value } = props;
    if (!financialData.length || index !== financialData.length - 1) return null;
    if (value == null || Number.isNaN(value)) return null;

    return (
      <text x={x + 4} y={y} fill={color} fontSize={10}>
        {formatCurrency(value)}
      </text>
    );
  };

  const labelIndex = financialData.length
    ? Math.floor(financialData.length * 0.6)
    : 0;

  const renderInlineNameLabel = (text, color) => (props) => {
    const { x, y, index } = props;
    if (index !== labelIndex) return null;
    return (
      <text
        x={x + 4}
        y={y - 6}
        fill={color}
        fontSize={10}
        fontWeight={600}
      >
        {text}
      </text>
    );
  };

  const derivedSecondHouseText = enableSecondHouse && secondHouseValue
    ? `${formatCurrency(secondHouseValue)}${secondHouseFundingGap > 0 ? ` (gap ${formatCurrency(secondHouseFundingGap)})` : ''}`
    : 'Second house disabled';

  const totalPurchaseCosts = firstHousePurchaseCosts + secondHousePurchaseCosts;

  const bakedInAssumptions = [
    `All values are modelled in today's money, and the mortgage rate input is treated as a real annual borrowing rate.`,
    `Net pay uses England/Wales/Northern Ireland income tax plus employee National Insurance thresholds for ${TAX_YEAR_LABEL}.`,
    `Tax and NI thresholds are assumed to shrink by ${TAX_THRESHOLD_DRAG_PCT}% a year in real terms as a smoothed fiscal-drag assumption.`,
    `Income rises by a fixed real cash increment until age ${CAREER_GROWTH_PEAK_AGE}, then that increment linearly tapers to zero by age ${CAREER_GROWTH_END_AGE}.`,
    `The model stops at age ${END_AGE}.`,
    `Pension contributions are assumed to reduce taxable pay by ${pensionContributionRate}% before tax and NI, but no pension pot or future pension income is modelled.`,
    `Partner 2 income falls by 50% in each birth year (${child1BirthYear} and ${child2BirthYear}).`,
    'Child costs start one year after birth and continue until age 21.',
    `Stamp duty and fixed legal fees (${formatCurrency(FIRST_HOUSE_LEGAL_FEES)} on the first purchase and ${formatCurrency(SECOND_HOUSE_LEGAL_FEES)} on the move) are charged as cash outflows in the relevant house-purchase year. If the second house is enabled, the first-home sale also incurs ${FIRST_HOME_SALE_AGENT_FEE_PCT.toFixed(1)}% estate-agent cost plus ${formatCurrency(FIRST_HOME_SALE_LEGAL_FEES)} of sale legal fees; no CGT is assumed on selling the main home.`,
    usePrivateSchool
      ? 'Private school fees are applied in real terms between ages 11 and 18.'
      : 'Private school fees are excluded unless the toggle is turned on.',
    `Shortfalls are met from surplus savings first, then ISA, with any remaining gap tracked as a cumulative shortfall.`,
    `Combined liquid savings (ISA plus surplus savings) are now expected to stay above ${formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} from ${POST_2032_SAVINGS_FLOOR_START_YEAR} onward. The current plan bottoms at ${formatCurrency(minLiquidBufferPost2032)}${post2032SavingsFloorSafe ? '.' : ' and fails that floor.'}`,
    `Surplus savings grow at the ISA real growth rate less ${cgtRatePct}% CGT on gains.`,
    `At age ${END_AGE}, surplus savings and then ISA are used to pay down any remaining mortgage before the final cash and equity figures are reported. The current plan applies ${formatCurrency(terminalMortgagePaydown)} and leaves ${formatCurrency(finalMortgageBalance)} of mortgage outstanding.`,
    `A car purchase is assumed in 2028, and gifts are assumed at age 27 (currently ${formatCurrency(kid1GiftAmount)} and ${formatCurrency(kid2GiftAmount)}).`,
    enableSecondHouse
      ? `The second house uses surplus savings first and then ISA for the deposit, adds a second mortgage in ${effectiveSecondHouseYear}, and assumes the first property is sold for stamp duty treatment.${secondHouseFundingGap > 0 ? ` The current plan is short by ${formatCurrency(secondHouseFundingGap)} on the move deposit.` : ''}`
      : 'Second house purchase is currently disabled.',
    `If the first property is below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the latest second-house year is ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}; otherwise it is ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}.`,
    `Recession years (${recessionYear}, ${secondRecessionYear}, ${thirdRecessionYear}) reduce ISA, surplus savings, and property value by ${recessionHitPct}%.`,
    enableRedundancy
      ? `Redundancy years (${redundancyYear} and ${secondRedundancyYear}) set person 1 income to zero for the full year.`
      : 'Redundancy shocks are excluded unless the toggle is turned on.',
    negativeAmortizationYears > 0
      ? `In ${negativeAmortizationYears} year(s), the mortgage budget does not cover all interest, so ${formatCurrency(capitalizedInterestTotal)} is added back onto the loan balance.`
      : 'Mortgage repayments always cover interest under the current assumptions.',
    'Mortgage repayments are budget-driven from salary percentages rather than a lender-style amortisation schedule. The salary percentage is treated as the total mortgage payment, with interest paid first and only the remainder reducing principal.',
  ];

  const optimizerModeLabel = optimizerPropertyMode === 'both'
    ? 'Let optimizer choose'
    : optimizerPropertyMode === 'one'
      ? 'Keep one home'
      : 'Buy then upgrade';
  const optimizerModeDescription = optimizerPropertyMode === 'both'
    ? 'Tests both a one-home path and a later move to a second home, then keeps whichever leaves you with the strongest end cash position.'
    : optimizerPropertyMode === 'one'
      ? 'Only tests scenarios where you buy one property and never move again.'
      : 'Only tests scenarios where you buy a first property and later move to a second home.';
  const showOptimizerSecondHouseControls = optimizerPropertyMode !== 'one';
  const optimizerFirstHouseTotalMin = optimizerFirstHouseDepositMin + optimizerFirstHouseMortgageMin;
  const optimizerFirstHouseTotalMax = optimizerFirstHouseDepositMax + optimizerFirstHouseMortgageMax;
  const optimizerUpgradeTotalMin = optimizerSecondHouseDepositMin + optimizerSecondHouseMortgageMin;
  const optimizerUpgradeTotalMax = Math.min(
    optimizerSecondHouseDepositMax + optimizerSecondHouseMortgageMax,
    OPTIMIZER_MAX_UPGRADE_VALUE,
  );
  const optimizerUpgradeYearRuleText =
    optimizerFirstHouseTotalMax < OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD
      ? `Latest upgrade year ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}`
      : optimizerFirstHouseTotalMin >= OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD
        ? `Latest upgrade year ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}`
        : `Latest upgrade year ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX} below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, otherwise ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}`;
  const optimizerAssumptionMortgageRate = optimizerAssumptionBaseParams?.mortgageRate ?? mortgageRate;
  const optimizerAssumptionRealGrowthCosts = optimizerAssumptionBaseParams?.realGrowthCosts ?? realGrowthCosts;
  const optimizerAssumptionSourceLabel = hasPrecomputedOptimizerResults
    ? 'the stored full-search baseline from the last terminal run'
    : 'the current planner tab settings';
  const optimizerFrozenAssumptions = [
    `Starting incomes are fixed at ${formatCurrency(OPTIMIZER_STARTING_INCOME_1)} and ${formatCurrency(OPTIMIZER_STARTING_INCOME_2)}.`,
    `The first house purchase year is fixed at ${OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}.`,
    `The first-house deposit and starting ISA seed share one fixed starting cash pool of ${formatCurrency(displayOptimizerSearchMeta?.startingCashPool ?? (initialDeposit + isaSeed))}.`,
    `For upgrade paths, the first property must be at least ${formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}, except early upgrade paths completing by ${OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF} can start from ${formatCurrency(OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE)}. Any upgrade step must add between ${formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} and ${formatCurrency(OPTIMIZER_MAX_UPGRADE_VALUE)} of extra property value from deposit plus mortgage.`,
    `The first-house mortgage cannot exceed ${formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)}, and total mortgage outstanding can never exceed ${formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)} at any point in the path.`,
    `If the first house total is below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the latest upgrade year is ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}. If it is ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)} or above, the latest upgrade year is ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}.`,
    `A one-home path is only feasible if the first house bought in ${OPTIMIZER_FIXED_FIRST_HOUSE_YEAR} is at least ${formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)}. A two-home path is only feasible if the second house purchase value reaches at least ${formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} at the move year.`,
    `From ${POST_2032_SAVINGS_FLOOR_START_YEAR} onward, combined liquid savings (ISA plus surplus savings) must stay above ${formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} throughout the path.`,
    `At age ${END_AGE}, surplus savings and then ISA are used to pay down any remaining mortgage before end cash and end equity are measured.`,
    'The optimizer ranks plans by end net worth, defined as liquid cash after that payoff plus home equity. Lifetime interest is shown separately and does not drive the ranking directly.',
    `The optimizer now tests a 9-case matrix across income growth and correlated market growth. Each market case couples ISA and property growth together. Other planner assumptions stay frozen from ${optimizerAssumptionSourceLabel}, including mortgage real rate ${optimizerAssumptionMortgageRate}% and living-cost growth ${optimizerAssumptionRealGrowthCosts}%.`,
    optimizerUsePrivateSchool
      ? 'Private school costs are forced on for this optimizer run.'
      : 'Private school costs are forced off for this optimizer run.',
    `Base living costs, child costs, visa costs, car purchase, gifts, recessions, redundancy years, tax drag, and pension contribution rate all stay frozen from ${optimizerAssumptionSourceLabel}.`,
    `House move costs include stamp duty plus fixed legal fees of ${formatCurrency(FIRST_HOUSE_LEGAL_FEES)} on the first purchase, ${formatCurrency(SECOND_HOUSE_LEGAL_FEES)} on the second purchase, and first-home sale costs of ${FIRST_HOME_SALE_AGENT_FEE_PCT.toFixed(1)}% estate-agent fee plus ${formatCurrency(FIRST_HOME_SALE_LEGAL_FEES)} sale legal fees. Second-house deposits are funded from surplus savings first and then ISA. No CGT is assumed on selling the main home.`,
    `The optimizer still uses the same model rules shown in the planner assumptions, including stamp duty, legal fees, surplus-and-ISA deposit funding for the second move, and the age-${END_AGE} end point.`,
  ];

  const sharedOptimizerConstants = {
    END_AGE,
    FIRST_HOME_SALE_AGENT_FEE_PCT,
    FIRST_HOME_SALE_LEGAL_FEES,
    FIRST_HOUSE_LEGAL_FEES,
    OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE,
    OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF,
    OPTIMIZER_FAST_UPGRADE_YEAR_MAX,
    OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD,
    OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
    OPTIMIZER_LATE_UPGRADE_YEAR_MAX,
    OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
    OPTIMIZER_MAX_TOTAL_MORTGAGE,
    OPTIMIZER_MIN_FIRST_PROPERTY_VALUE,
    OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
    OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
    OPTIMIZER_MIN_UPGRADE_VALUE,
    OPTIMIZER_MAX_UPGRADE_VALUE,
    SECOND_HOUSE_LEGAL_FEES,
  };

  const optimizerTabProps = {
    constants: sharedOptimizerConstants,
    formatCurrency,
    showOptimizerIntro,
    setShowOptimizerIntro,
    optimizerModeLabel,
    optimizerModeDescription,
    displayOptimizerSearchMeta,
    optimizerPropertyMode,
    setOptimizerPropertyMode,
    optimizerObjectiveDefinitions: OPTIMIZER_OBJECTIVE_DEFINITIONS,
    selectedOptimizerObjective,
    setSelectedOptimizerObjective,
    selectedOptimizerObjectiveDefinition,
    optimizerUsePrivateSchool,
    setOptimizerUsePrivateSchool,
    showOptimizerAssumptions,
    setShowOptimizerAssumptions,
    optimizerFrozenAssumptions,
    optimizerFirstHouseTotalMin,
    optimizerFirstHouseTotalMax,
    optimizerUpgradeYearRuleText,
    showOptimizerSecondHouseControls,
    optimizerUpgradeTotalMin,
    optimizerUpgradeTotalMax,
    optimizerFirstHouseDepositMin,
    setOptimizerFirstHouseDepositMin,
    optimizerFirstHouseDepositMax,
    setOptimizerFirstHouseDepositMax,
    optimizerFirstHouseMortgageMin,
    setOptimizerFirstHouseMortgageMin,
    optimizerFirstHouseMortgageMax,
    setOptimizerFirstHouseMortgageMax,
    optimizerEarlyMortgagePctMin,
    setOptimizerEarlyMortgagePctMin,
    optimizerEarlyMortgagePctMax,
    setOptimizerEarlyMortgagePctMax,
    optimizerSecondHouseDepositMin,
    setOptimizerSecondHouseDepositMin,
    optimizerSecondHouseDepositMax,
    setOptimizerSecondHouseDepositMax,
    optimizerSecondHouseMortgageMin,
    setOptimizerSecondHouseMortgageMin,
    optimizerSecondHouseMortgageMax,
    setOptimizerSecondHouseMortgageMax,
    optimizerSecondHouseYearMin,
    setOptimizerSecondHouseYearMin,
    optimizerSecondHouseYearMax,
    setOptimizerSecondHouseYearMax,
    optimizerLaterMortgagePctMin,
    setOptimizerLaterMortgagePctMin,
    optimizerLaterMortgagePctMax,
    setOptimizerLaterMortgagePctMax,
    startYear,
    selectedOptimizerResult,
    precomputedStoredResults,
    precomputedOptimizerSearchMeta,
    optimizerRecommendedResults,
    displayOptimizerRecommendedResults,
    getOptimizerResultKey,
    setSelectedOptimizerResultKey,
    getOptimizerNetWorth,
    getOptimizerHousingEndLabel,
    getOptimizerHousingEndValue,
    getOptimizerHousingEndSub,
    getOptimizerHousingEndInlineLabel,
    strategyApplyModeDefinitions,
    strategyApplyMode,
    setStrategyApplyMode,
    selectedStrategyApplyModeDefinition,
    handleApplyOptimizerResult,
    precomputedOptimizerGeneratedAt,
    showAllFeasibleResults,
    setShowAllFeasibleResults,
    allFeasiblePage,
    setAllFeasiblePage,
    allFeasiblePageCount,
    pagedFeasibleResults,
    allFeasiblePageSize,
    precomputedOptimizerError,
    displayOptimizerResultsByIncome,
    expandedOptimizerIncomeId,
    setExpandedOptimizerIncomeId,
    getOptimizerCaseObjectiveBundle,
  };

  const robustnessTabProps = {
    constants: {
      OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
      OPTIMIZER_INCOME_CASES,
      OPTIMIZER_MARKET_CASES,
      OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
      OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
      POST_2032_MIN_TOTAL_SAVINGS,
    },
    formatCurrency,
    formatProbability,
    formatStrategyOrigin,
    robustnessError,
    robustnessReport,
    robustnessMeta,
    robustnessRecommendation,
    robustnessCharts,
    robustnessObjectiveDefinitions,
    robustnessObjective,
    setRobustnessObjective,
    selectedRobustnessObjectiveDefinition,
    strategyApplyModeDefinitions,
    strategyApplyMode,
    setStrategyApplyMode,
    selectedStrategyApplyModeDefinition,
    robustnessPathLeaderCards,
    buildRobustnessWhyLines,
    handleApplyRobustnessStrategy,
    robustnessPathView,
    setRobustnessPathView,
    robustnessEligibleStrategies,
    robustnessDisplayedStrategies,
    robustnessSelectedScatter,
    robustnessSelectedCdf,
    robustnessApplyFilterDescription: usePrivateSchoolApplyFilter
      ? 'private-school apply scenario'
      : 'default apply scenario',
  };

  return (
    <div className="app-root">
      <h1 className="app-title">Financial Life Planner</h1>
      <p className="app-subtitle">
        Combined pre-tax income line; all figures are shown in real terms, mortgage uses a real rate, tax bands drift tighter over time, and the model ends at age {END_AGE}.
      </p>

      <div className="view-tabs">
        <button
          type="button"
          className={`view-tab${activeTab === 'planner' ? ' view-tab-active' : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          Planner
        </button>
        <button
          type="button"
          className={`view-tab${activeTab === 'optimizer' ? ' view-tab-active' : ''}`}
          onClick={() => setActiveTab('optimizer')}
        >
          Housing Optimizer
        </button>
        <button
          type="button"
          className={`view-tab${activeTab === 'robustness' ? ' view-tab-active' : ''}`}
          onClick={() => setActiveTab('robustness')}
        >
          Robustness
        </button>
      </div>

      {activeTab === 'planner' ? (
        <>
      <div className="summary-grid">
          <div className="summary-card summary-accent-cyan">
          <div className="summary-label">Final Cash After Payoff</div>
          <div className="summary-value">
            {formatCurrency(finalLiquidNet)}
          </div>
          <div className="summary-sub">
            {`Liquid cash left after the age-${END_AGE} mortgage payoff`}
          </div>
        </div>

        <div className="summary-card summary-accent-blue">
          <div className="summary-label">Total Mortgage Payments</div>
          <div className="summary-value">
            {formatCurrency(totalMortgagePayments)}
          </div>
          <div className="summary-sub">
            Principal + interest to age {END_AGE}
          </div>
        </div>

        <div className="summary-card summary-accent-green">
          <div className="summary-label">Final Property Value</div>
          <div className="summary-value">
            {formatCurrency(finalPropertyValue)}
          </div>
          <div className="summary-sub">
            Real property growth {realGrowthProperty}%
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h2 className="panel-title">Complete Financial Overview</h2>

        <div className="preset-row">
          <input
            className="preset-name-input"
            type="text"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="Scenario name"
          />
          <button
            type="button"
            className="preset-button preset-button-secondary"
            onClick={handleCopyScenarioLink}
          >
            Copy share link
          </button>
          {linkCopyStatus && (
            <span className="helper-text helper-text-inline">{linkCopyStatus}</span>
          )}
        </div>

        <p className="helper-text">
          The page URL is now the only save/share method. Your scenario name and all current settings are encoded in the link, so bookmarking or copying the share link will reopen the same setup on any browser.
        </p>

        <div className="advanced-box">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced(prev => !prev)}
          >
            {showAdvanced ? 'Hide advanced cost parameters' : 'Show advanced cost parameters'}
          </button>

          {showAdvanced && (
            <div className="advanced-grid">
              <RangeSlider
                label="Initial Cash Level (Deposit + ISA seed)"
                value={initialCash}
                min={0}
                max={2000000}
                step={10000}
                onChange={handleInitialCashChange}
                formatValue={formatCurrency}
              />

              <RangeSlider
                label="Timeline Start Year"
                value={startYear}
                min={2023}
                max={2035}
                step={1}
                onChange={setStartYear}
                formatValue={v => v}
              />

              <RangeSlider
                label="Base Living Costs (start)"
                value={baseLivingCost}
                min={20000}
                max={80000}
                step={2000}
                onChange={setBaseLivingCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Child 1 Annual Cost"
                value={child1AnnualCost}
                min={5000}
                max={50000}
                step={5000}
                onChange={setChild1AnnualCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Child 2 Annual Cost"
                value={child2AnnualCost}
                min={5000}
                max={50000}
                step={5000}
                onChange={setChild2AnnualCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Emergency Fund per Year"
                value={emergencyFundAnnual}
                min={0}
                max={20000}
                step={1000}
                onChange={setEmergencyFundAnnual}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Pension Contributions (% gross, no pot tracked)"
                value={pensionContributionRate}
                min={0}
                max={20}
                step={0.5}
                onChange={setPensionContributionRate}
                formatValue={v => `${v}%`}
              />

              <RangeSlider
                label="Living Costs Real Growth"
                value={realGrowthCosts}
                min={0}
                max={5}
                step={0.1}
                onChange={setRealGrowthCosts}
                formatValue={v => `${v}%`}
              />
              <RangeSlider
                label="ISA Real Growth"
                value={isaGrowth}
                min={0}
                max={10}
                step={0.1}
                onChange={setIsaGrowth}
                formatValue={v => `${v}%`}
              />

              <RangeSlider
                label="Visa Cost (years ≤ 2036)"
                value={visaCostPreSecondHouse}
                min={0}
                max={5000}
                step={100}
                onChange={setVisaCostPreSecondHouse}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Visa Cost at Second House Year"
                value={visaCostAtSecondHouse}
                min={0}
                max={5000}
                step={100}
                onChange={setVisaCostAtSecondHouse}
                formatValue={formatCurrency}
              />

              <RangeSlider
                label="Car Cost (2028)"
                value={carCost}
                min={0}
                max={60000}
                step={2000}
                onChange={setCarCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Gift to Children"
                value={combinedGiftAmount}
                min={0}
                max={400000}
                step={5000}
                onChange={handleCombinedGiftAmountChange}
                formatValue={formatCurrency}
              />

              <RangeSlider
                label="ISA Contribution Cap per Year"
                value={isaContributionCap}
                min={5000}
                max={80000}
                step={5000}
                onChange={setIsaContributionCap}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Recession Hit (%) on Property, ISA & Surplus"
                value={recessionHitPct}
                min={0}
                max={50}
                step={1}
                onChange={setRecessionHitPct}
                formatValue={v => `${v}%`}
              />
              <RangeSlider
                label="CGT Rate on Surplus Pot"
                value={cgtRatePct}
                min={0}
                max={40}
                step={1}
                onChange={setCgtRatePct}
                formatValue={v => `${v}%`}
              />
            </div>
          )}
        </div>

        <div className="chart-top-row">
          <div className="chart-summary-inline">
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Cash After Payoff</div>
              <div className="chart-summary-value">
                {formatCurrency(finalLiquidNet)}
              </div>
            </div>
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Mortgage Paid</div>
              <div className="chart-summary-value">
                {formatCurrency(totalMortgagePayments)}
              </div>
            </div>
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Property</div>
              <div className="chart-summary-value">
                {formatCurrency(finalPropertyValue)}
              </div>
            </div>
          </div>

          <div className="chart-sliders-inline">
            <div className="slider-header-row">
              <div className="slider-header">House & mortgages</div>
              <div className="slider-header">Income & growth</div>
              <div className="slider-header">Kids & shocks</div>
            </div>

            <div className="slider-columns-row">
              <div className="slider-column">
                <RangeSlider
                  label="Initial Deposit"
                  value={initialDeposit}
                  min={0}
                  max={initialCash}
                  step={10000}
                  onChange={handleInitialDepositChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Initial Mortgage"
                  value={initialMortgage}
                  min={100000}
                  max={1500000}
                  step={10000}
                  onChange={handleInitialMortgageChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Property Real Growth"
                  value={realGrowthProperty}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setRealGrowthProperty}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Mortgage Real Rate"
                  value={mortgageRate}
                  min={1}
                  max={10}
                  step={0.1}
                  onChange={setMortgageRate}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Salary % on Mortgage (up to second house)"
                  value={salaryMortgageEarly}
                  min={5}
                  max={30}
                  step={1}
                  onChange={setSalaryMortgageEarly}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="First House Purchase Year"
                  value={firstHousePurchaseYear}
                  min={startYear}
                  max={enableSecondHouse ? effectiveSecondHouseYear - 1 : BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={handleFirstHouseYearChange}
                  formatValue={v => v}
                />
              </div>

              <div className="slider-column">
                <RangeSlider
                  label="Second House Deposit (from ISA)"
                  value={secondHouseDeposit}
                  min={0}
                  max={800000}
                  step={10000}
                  onChange={handleSecondHouseDepositChange}
                  formatValue={formatCurrency}
                  disabled={!enableSecondHouse}
                />
                <RangeSlider
                  label="Second Mortgage Amount"
                  value={secondMortgage}
                  min={0}
                  max={800000}
                  step={10000}
                  onChange={handleSecondMortgageChange}
                  formatValue={formatCurrency}
                  disabled={!enableSecondHouse}
                />
                <RangeSlider
                  label="Salary % on Mortgage (after second house)"
                  value={salaryMortgageLater}
                  min={5}
                  max={50}
                  step={1}
                  onChange={setSalaryMortgageLater}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Second House Purchase Year"
                  value={effectiveSecondHouseYear}
                  min={firstHousePurchaseYear + 1}
                  max={plannerSecondHouseYearMax}
                  step={1}
                  onChange={handleSecondHouseYearChange}
                  formatValue={v => v}
                  disabled={!enableSecondHouse}
                />
              </div>

              <div className="slider-column">
                <RangeSlider
                  label="Starting Income 1"
                  value={income1Start}
                  min={40000}
                  max={250000}
                  step={5000}
                  onChange={setIncome1Start}
                  formatValue={v => `£${(v / 1000).toFixed(0)}k`}
                />
                <RangeSlider
                  label="Starting Income 2"
                  value={income2Start}
                  min={40000}
                  max={250000}
                  step={5000}
                  onChange={setIncome2Start}
                  formatValue={v => `£${(v / 1000).toFixed(0)}k`}
                />
                <RangeSlider
                  label="Base Career Income Growth"
                  value={incomeGrowth}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setIncomeGrowth}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="ISA Seed (starting balance)"
                  value={isaSeed}
                  min={0}
                  max={initialCash}
                  step={5000}
                  onChange={handleIsaSeedChange}
                  formatValue={formatCurrency}
                />
              </div>

              <div className="slider-column">
                <RangeSlider
                  label="Child 1 Birth Year"
                  value={child1BirthYear}
                  min={2029}
                  max={2050}
                  step={1}
                  onChange={setChild1BirthYear}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Child 2 Birth Year"
                  value={child2BirthYear}
                  min={2030}
                  max={2052}
                  step={1}
                  onChange={setChild2BirthYear}
                  formatValue={v => v}
                />
              </div>

              <div className="slider-column">
                <RangeSlider
                  label="Recession Year 1"
                  value={recessionYear}
                  min={2027}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setRecessionYear}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Recession Year 2"
                  value={secondRecessionYear}
                  min={2027}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setSecondRecessionYear}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Recession Year 3"
                  value={thirdRecessionYear}
                  min={2027}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setThirdRecessionYear}
                  formatValue={v => v}
                />
              </div>

              <div className="slider-column">
                <label className="line-toggle">
                  <input
                    type="checkbox"
                    checked={enableRedundancy}
                    onChange={e => setEnableRedundancy(e.target.checked)}
                  />
                  Redundancy shocks
                </label>
                <RangeSlider
                  label="Redundancy Year 1"
                  value={redundancyYear}
                  min={2027}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setRedundancyYear}
                  formatValue={v => v}
                  disabled={!enableRedundancy}
                />
                <RangeSlider
                  label="Redundancy Year 2"
                  value={secondRedundancyYear}
                  min={2027}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setSecondRedundancyYear}
                  formatValue={v => v}
                  disabled={!enableRedundancy}
                />
              </div>
            </div>
          </div>

          <div className="toggle-row">
            <label className={`line-toggle${!enableSecondHouse ? ' toggle-disabled' : ''}`}>
              <input
                type="checkbox"
                checked={lockHouseLink}
                onChange={toggleHouseLock}
                disabled={!enableSecondHouse}
              />
              Lock initial vs second house (same total)
            </label>
            <label className="line-toggle">
              <input
                type="checkbox"
                checked={usePrivateSchool}
                onChange={e => setUsePrivateSchool(e.target.checked)}
              />
              Private school age 11–18
            </label>
            <label className="line-toggle">
              <input
                type="checkbox"
                checked={enableSecondHouse}
                onChange={e => setEnableSecondHouse(e.target.checked)}
              />
              Enable second house purchase
            </label>
          </div>
        </div>

        <div className="stamp-duty-box">
          <h3 className="stamp-duty-title">House Move Costs (England)</h3>
          <div className="stamp-duty-row">
            <div className="stamp-duty-item">
              <div className="stamp-duty-label">First House</div>
              <div className="stamp-duty-value">{formatCurrency(firstHousePurchaseCosts)}</div>
              <div className="stamp-duty-details">
                Property value: {formatCurrency(initialPropertyValue)} | Stamp duty {formatCurrency(firstHouseStampDuty)} | Legal fees {formatCurrency(FIRST_HOUSE_LEGAL_FEES)}
              </div>
            </div>
            {enableSecondHouse ? (
              <div className="stamp-duty-item">
                <div className="stamp-duty-label">Second House (assumes first sold)</div>
                <div className="stamp-duty-value">{formatCurrency(secondHousePurchaseCosts)}</div>
                <div className="stamp-duty-details">
                  Property value: {formatCurrency(secondHousePurchasePrice || (initialPropertyValue + moveIncrementValue))} | Stamp duty {formatCurrency(secondHouseStampDuty)} | Legal fees {formatCurrency(SECOND_HOUSE_LEGAL_FEES)} | First-home sale costs {formatCurrency(firstHouseSaleCosts)}
                </div>
              </div>
            ) : (
              <div className="stamp-duty-item">
                <div className="stamp-duty-label">Second House</div>
                <div className="stamp-duty-value">—</div>
                <div className="stamp-duty-details">Second purchase disabled</div>
              </div>
            )}
            <div className="stamp-duty-item">
              <div className="stamp-duty-label">Total House Costs</div>
              <div className="stamp-duty-value stamp-duty-total">
                {formatCurrency(totalPurchaseCosts)}
              </div>
              <div className="stamp-duty-details">
                Stamp duty + legal fees combined
              </div>
            </div>
          </div>
        </div>

        <div className="derived-line derived-line-inline">
          Initial Property Value:{' '}
          <span className="derived-highlight">
            {formatCurrency(initialPropertyValue)}
          </span>
          {'  •  '}
          Second House Value:{' '}
          <span className={`derived-highlight${enableSecondHouse ? '' : ' derived-muted'}`}>
            {derivedSecondHouseText}
          </span>
          {'  •  '}
          Min ISA balance:{' '}
          <span className={`derived-highlight${minIsaSafe ? '' : ' derived-warning'}`}>
            {formatCurrency(minIsaBalance)} {minIsaSafe ? '' : '⚠️'}
          </span>
          {'  •  '}
          Min liquid savings after 2032:{' '}
          <span className={`derived-highlight${post2032SavingsFloorSafe ? '' : ' derived-warning'}`}>
            {formatCurrency(minLiquidBufferPost2032)} {post2032SavingsFloorSafe ? '' : '⚠️'}
          </span>
          {'  •  '}
          Total House Costs:{' '}
          <span className="derived-highlight">
            {formatCurrency(totalPurchaseCosts)}
          </span>
          {'  •  '}
          Capitalised Interest:{' '}
          <span className={`derived-highlight${negativeAmortizationYears > 0 ? ' derived-warning' : ''}`}>
            {formatCurrency(capitalizedInterestTotal)}
          </span>
        </div>

        <div className="display-controls-row">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAssumptions(prev => !prev)}
          >
            {showAssumptions ? 'Hide assumptions' : 'Show assumptions'}
          </button>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showPieChart}
              onChange={e => setShowPieChart(e.target.checked)}
            />
            Show financial breakdown
          </label>
        </div>

        {showAssumptions && (
          <div className="assumptions-box">
            <h3 className="assumptions-title">Assumptions baked into the model</h3>
            <div className="assumptions-list">
              {bakedInAssumptions.map((assumption) => (
                <div key={assumption} className="assumption-item">
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="line-toggle-row">
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showIncomeLine}
              onChange={e => setShowIncomeLine(e.target.checked)}
            />
            Income
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showIsaLine}
              onChange={e => setShowIsaLine(e.target.checked)}
            />
            ISA
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showSurplusLine}
              onChange={e => setShowSurplusLine(e.target.checked)}
            />
            Surplus savings
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showMortgageBalanceLine}
              onChange={e => setShowMortgageBalanceLine(e.target.checked)}
            />
            Mortgage value
          </label>
        </div>

        <Suspense fallback={<div style={{ padding: '20px', color: '#666' }}>Loading chart...</div>}>
          <PlannerChartSection
            financialData={financialData}
            formatCurrency={formatCurrency}
            firstHousePurchaseYear={firstHousePurchaseYear}
            child1BirthYear={child1BirthYear}
            child2BirthYear={child2BirthYear}
            effectiveSecondHouseYear={effectiveSecondHouseYear}
            enableSecondHouse={enableSecondHouse}
            kid1GiftYear={kid1GiftYear}
            kid2GiftYear={kid2GiftYear}
            recessionYear={recessionYear}
            secondRecessionYear={secondRecessionYear}
            thirdRecessionYear={thirdRecessionYear}
            enableRedundancy={enableRedundancy}
            redundancyYear={redundancyYear}
            secondRedundancyYear={secondRedundancyYear}
            mortgageRepayYear={mortgageRepayYear}
            firstMortgagePaidOffYear={firstMortgagePaidOffYear}
            showIncomeLine={showIncomeLine}
            showSurplusLine={showSurplusLine}
            showIsaLine={showIsaLine}
            showMortgageBalanceLine={showMortgageBalanceLine}
            renderInlineNameLabel={renderInlineNameLabel}
            renderEndLabel={renderEndLabel}
            pieData={pieData}
            showPieChart={showPieChart}
            carCost={carCost}
          />
        </Suspense>
      </div>
        </>
      ) : activeTab === 'optimizer' ? (
        <Suspense fallback={<div className="chart-card"><div className="optimizer-empty">Loading optimizer...</div></div>}>
          <OptimizerTabSection {...optimizerTabProps} />
        </Suspense>
      ) : (
        <Suspense fallback={<div className="chart-card"><div className="optimizer-empty">Loading robustness...</div></div>}>
          <RobustnessTabSection {...robustnessTabProps} />
        </Suspense>
      )}
    </div>
  );
};

export default App;
