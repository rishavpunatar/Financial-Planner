// src/App.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './App.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RangeSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  disabled = false,
}) => (
  <div className={`slider-block${disabled ? ' slider-block-disabled' : ''}`}>
    <label className="slider-label">
      {label}: {formatValue ? formatValue(value) : value}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="slider-input"
      disabled={disabled}
    />
  </div>
);

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

const saveFiltersToURL = (filters) => {
  const encodedFilters = encodeURIComponent(JSON.stringify(filters));
  const newURL = `${window.location.origin}${window.location.pathname}?filters=${encodedFilters}`;
  window.history.replaceState(null, '', newURL);
};

const loadFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const filters = params.get('filters');
  return filters ? JSON.parse(decodeURIComponent(filters)) : null;
};

const loadStoredScenario = () => {
  if (typeof window === 'undefined') return null;
  return loadFiltersFromURL();
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

  for (let year = startYear; year <= maxYear; year++) {
    if (!hasFirstHouse && year === firstHousePurchaseYear) {
      hasFirstHouse = true;
      propertyValue = initialPropertyValue;
      firstMortgageBalance = initialMortgage;
    }

    if (hasFirstHouse) {
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
    }

    const isaContribution = Math.min(Math.max(0, totalLeft), isaContributionCap);
    const currentIsaGrowth = getYearPathValue(isaGrowthPath, year, isaGrowth);
    isaTotal = isaTotal * (1 + currentIsaGrowth / 100) + isaContribution;

    const surplusContribution = Math.max(0, totalLeft - isaContribution);
    const growthRate = currentIsaGrowth / 100;
    const grossGrowth = surplusPot * growthRate;
    const afterTaxGrowth = grossGrowth * (1 - cgtRate);
    surplusPot = surplusPot + afterTaxGrowth + surplusContribution;

    const isaBelowThreshold = isaTotal < 60000;
    minIsaBalance = Math.min(minIsaBalance, isaTotal);
    minLiquidBuffer = Math.min(minLiquidBuffer, isaTotal + surplusPot);
    if (year >= POST_2032_SAVINGS_FLOOR_START_YEAR) {
      minLiquidBufferPost2032 = Math.min(minLiquidBufferPost2032, isaTotal + surplusPot);
    }

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

    const sortedResults = results.sort(compareOptimizerResults).slice(0, 3);

    return {
      assumptionCase,
      scenariosTested,
      feasibleCount: results.length,
      bestResult: sortedResults[0] ?? null,
      topResults: sortedResults,
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

const compareOptimizerResults = (left, right) => {
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
    optimizerPropertyMode,
    optimizerUsePrivateSchool,
    showOptimizerIntro,
    showOptimizerAssumptions,
    expandedOptimizerIncomeId,
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
    optimizerPropertyMode,
    optimizerUsePrivateSchool,
    showOptimizerIntro,
    showOptimizerAssumptions,
    expandedOptimizerIncomeId,
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

        const payload = await response.json();
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

        const payload = await response.json();
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

  const optimizerRecommendedResults = useMemo(() => (
    optimizerResults
      .map(({ bestResult }) => bestResult)
      .filter(Boolean)
      .sort(compareOptimizerResults)
  ), [optimizerResults]);

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
  const precomputedOptimizerSearchMeta = selectedPrecomputedOptimizerPayload?.searchMeta ?? null;
  const precomputedOptimizerGeneratedAt = selectedPrecomputedOptimizerPayload?.generatedAt ?? '';
  const hasPrecomputedOptimizerResults = selectedPrecomputedOptimizerPayload !== null;
  const precomputedRecommendedResults = useMemo(() => (
    precomputedOptimizerResults
      .map(({ bestResult }) => bestResult)
      .filter(Boolean)
      .sort(compareOptimizerResults)
  ), [precomputedOptimizerResults]);
  const precomputedStoredResults = useMemo(() => (
    precomputedOptimizerResults
      .flatMap(({ topResults = [] }) => topResults)
      .sort(compareOptimizerResults)
  ), [precomputedOptimizerResults]);
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
  }, [optimizerUsePrivateSchool]);

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
      setUsePrivateSchool(appliedBaseParams.usePrivateSchool);
    } else {
      setUsePrivateSchool(fallbackPrivateSchool);
    }
  }, []);

  const handleApplyOptimizerResult = (result) => {
    const appliedBaseParams = selectedPrecomputedOptimizerPayload?.baseParams ?? null;

    applyPlannerBaseParams(appliedBaseParams, optimizerUsePrivateSchool);

    setIncome1Start(OPTIMIZER_STARTING_INCOME_1);
    setIncome2Start(OPTIMIZER_STARTING_INCOME_2);
    setIncomeGrowth(result.assumptionCase.incomeGrowth);
    setIsaGrowth(result.assumptionCase.isaGrowth);
    setRealGrowthProperty(result.assumptionCase.propertyGrowth);
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

  const robustnessTopStrategies = robustnessReport?.topStrategies ?? [];
  const robustnessRecommendation = robustnessReport?.recommendation ?? null;
  const robustnessMeta = robustnessReport?.meta ?? null;
  const robustnessCharts = robustnessReport?.charts ?? null;
  const robustnessStrategyCatalog = robustnessReport?.strategyCatalog ?? robustnessTopStrategies;
  const robustnessStrategiesById = useMemo(
    () => new Map(robustnessStrategyCatalog.map((strategy) => [strategy.strategyId, strategy])),
    [robustnessStrategyCatalog],
  );
  const robustnessSelectedScatter = typeof robustnessCharts?.scatter === 'string'
    ? robustnessCharts.scatter
    : robustnessCharts?.scatter?.[robustnessPathView] ?? robustnessCharts?.scatter?.all ?? '';
  const robustnessSelectedCdf = typeof robustnessCharts?.cdf === 'string'
    ? robustnessCharts.cdf
    : robustnessCharts?.cdf?.[robustnessPathView] ?? robustnessCharts?.cdf?.all ?? '';
  const robustnessFilteredStrategies = useMemo(() => {
    if (robustnessPathView === 'oneHome') {
      return robustnessStrategyCatalog.filter((strategy) => strategy.pathType === 'One-home path');
    }
    if (robustnessPathView === 'twoHome') {
      return robustnessStrategyCatalog.filter((strategy) => strategy.pathType === 'Two-home path');
    }
    return robustnessStrategyCatalog;
  }, [robustnessPathView, robustnessStrategyCatalog]);
  const robustnessDisplayedStrategies = useMemo(
    () => robustnessFilteredStrategies.slice(0, 15),
    [robustnessFilteredStrategies],
  );
  const robustnessPathLeaderCards = useMemo(() => ([
    {
      key: 'all',
      label: 'Best overall',
      strategy: robustnessStrategiesById.get(robustnessReport?.pathSummaries?.all?.bestStrategyId)
        ?? robustnessTopStrategies[0]
        ?? null,
    },
    {
      key: 'oneHome',
      label: 'Best one-home',
      strategy: robustnessStrategiesById.get(robustnessReport?.pathSummaries?.oneHome?.bestStrategyId)
        ?? null,
    },
    {
      key: 'twoHome',
      label: 'Best two-home',
      strategy: robustnessStrategiesById.get(robustnessReport?.pathSummaries?.twoHome?.bestStrategyId)
        ?? null,
    },
  ]), [robustnessReport, robustnessStrategiesById, robustnessTopStrategies]);

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
    `The optimizer now tests a 9-case matrix across income growth and correlated market growth. Each market case couples ISA and property growth together. Other planner assumptions stay frozen, including mortgage real rate ${mortgageRate}% and living-cost growth ${realGrowthCosts}%.`,
    optimizerUsePrivateSchool
      ? 'Private school costs are forced on for this optimizer run.'
      : 'Private school costs are forced off for this optimizer run.',
    `Base living costs, child costs, visa costs, car purchase, gifts, recessions, redundancy years, tax drag, and pension contribution rate all stay exactly as set in the planner tab.`,
    `House move costs include stamp duty plus fixed legal fees of ${formatCurrency(FIRST_HOUSE_LEGAL_FEES)} on the first purchase, ${formatCurrency(SECOND_HOUSE_LEGAL_FEES)} on the second purchase, and first-home sale costs of ${FIRST_HOME_SALE_AGENT_FEE_PCT.toFixed(1)}% estate-agent fee plus ${formatCurrency(FIRST_HOME_SALE_LEGAL_FEES)} sale legal fees. Second-house deposits are funded from surplus savings first and then ISA. No CGT is assumed on selling the main home.`,
    `The optimizer still uses the same model rules shown in the planner assumptions, including stamp duty, legal fees, surplus-and-ISA deposit funding for the second move, and the age-${END_AGE} end point.`,
  ];

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

        <div className="chart-visual-row">
          <div className="chart-main">
            {financialData && financialData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={formatCurrency}
                    domain={['auto', 'auto']}
                    scale="sqrt"
                  />
                  <Tooltip formatter={value => formatCurrency(value)} />
                  <Legend />

                  <ReferenceLine x={firstHousePurchaseYear} stroke="#6366f1" strokeDasharray="2 3" label="🏡" />
                  <ReferenceLine x={2028} stroke="#facc15" strokeDasharray="3 3" label="🚗" />
                  <ReferenceLine x={child1BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶1" />
                  <ReferenceLine x={child2BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶2" />
                  {enableSecondHouse && (
                    <ReferenceLine x={effectiveSecondHouseYear} stroke="#4ade80" strokeDasharray="3 3" label="🏠" />
                  )}
                  <ReferenceLine x={kid1GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁1" />
                  <ReferenceLine x={kid2GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁2" />
                  <ReferenceLine x={recessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉" />
                  <ReferenceLine x={secondRecessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉2" />
                  <ReferenceLine x={thirdRecessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉3" />
                  {enableRedundancy && (
                    <ReferenceLine x={redundancyYear} stroke="#ef4444" strokeDasharray="4 3" label="R1" />
                  )}
                  {enableRedundancy && (
                    <ReferenceLine x={secondRedundancyYear} stroke="#ef4444" strokeDasharray="4 3" label="R2" />
                  )}
                  {mortgageRepayYear && (
                    <ReferenceLine
                      x={mortgageRepayYear}
                      stroke="#22c55e"
                      strokeDasharray="2 2"
                      label="✅"
                    />
                  )}
                  {firstMortgagePaidOffYear && (
                    <ReferenceLine
                      x={firstMortgagePaidOffYear}
                      stroke="#10b981"
                      strokeDasharray="2 2"
                      label="✅1"
                    />
                  )}

                  {showIncomeLine && (
                    <Line
                      type="monotone"
                      dataKey="combinedIncomeGross"
                      name="Combined Income (pre-tax)"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={false}
                    >
                      <LabelList content={renderInlineNameLabel('Combined income', '#14b8a6')} />
                      <LabelList content={renderEndLabel('#14b8a6')} />
                    </Line>
                  )}

                  {showSurplusLine && (
                    <Line
                      type="monotone"
                      dataKey="surplusPot"
                      name="Surplus Savings"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    >
                      <LabelList
                        content={renderInlineNameLabel('Surplus savings', '#0ea5e9')}
                      />
                      <LabelList content={renderEndLabel('#0ea5e9')} />
                    </Line>
                  )}

                  {showIsaLine && (
                    <Line
                      type="monotone"
                      dataKey="isaTotal"
                      name="ISA Total"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const below = payload.isaBelowThreshold;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={below ? 4 : 3}
                            fill={below ? '#dc2626' : '#8b5cf6'}
                            stroke="none"
                          />
                        );
                      }}
                    >
                      <LabelList content={renderInlineNameLabel('ISA', '#8b5cf6')} />
                      <LabelList content={renderEndLabel('#8b5cf6')} />
                    </Line>
                  )}

                  {showMortgageBalanceLine && (
                    <Line
                      type="monotone"
                      dataKey="mortgageBalance"
                      name="Mortgage Value"
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                      connectNulls={false}
                    >
                      <LabelList
                        content={renderInlineNameLabel('Mortgage balance', '#dc2626')}
                      />
                      <LabelList content={renderEndLabel('#dc2626')} />
                    </Line>
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: '20px', color: '#666' }}>Loading chart...</div>
            )}
          </div>

          {showPieChart && (
            <div className="pie-chart-container pie-chart-inline">
              <h3 className="pie-chart-title">Final Financial Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={72}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip formatter={value => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="milestones">
          <span>🏡 {firstHousePurchaseYear} - First house completion</span>
          <span>🚗 2028 - Car purchase ({formatCurrency(carCost)})</span>
          <span>👶1 {child1BirthYear} - Child 1 birth & mat leave</span>
          <span>👶2 {child2BirthYear} - Child 2 birth & mat leave</span>
          {enableSecondHouse && (
            <span>🏠 {effectiveSecondHouseYear} - Second house & extra mortgage</span>
          )}
          <span>
            🎁1 {kid1GiftYear} - Gift to child 1 ({formatCurrency(kid1GiftAmount)})
          </span>
          <span>
            🎁2 {kid2GiftYear} - Gift to child 2 ({formatCurrency(kid2GiftAmount)})
          </span>
          <span>
            📉 {recessionYear} - Recession (-{recessionHitPct}% property, ISA & surplus)
          </span>
          <span>
            📉2 {secondRecessionYear} - Second recession
          </span>
          <span>
            📉3 {thirdRecessionYear} - Third recession
          </span>
          {enableRedundancy && (
            <span>R1 {redundancyYear} - Person 1 redundancy year</span>
          )}
          {enableRedundancy && (
            <span>R2 {secondRedundancyYear} - Person 1 second redundancy year</span>
          )}
          {firstMortgagePaidOffYear && (
            <span>✅1 {firstMortgagePaidOffYear} - First mortgage fully repaid</span>
          )}
          {mortgageRepayYear && (
            <span>✅ {mortgageRepayYear} - All mortgages fully repaid</span>
          )}
        </div>
      </div>
        </>
      ) : activeTab === 'optimizer' ? (
        <div className="chart-card">
          <h2 className="panel-title">Housing Optimizer</h2>
          <div className="advanced-box">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowOptimizerIntro(prev => !prev)}
            >
              {showOptimizerIntro ? 'Hide optimizer intro' : 'Show optimizer intro'}
            </button>

            {showOptimizerIntro && (
              <div className="optimizer-copy-block">
                <p className="helper-text">
                  This tab keeps the planner assumptions fixed, resets starting income to £70k for person 1 and £90k for person 2, and searches housing choices against three real income-growth paths for corporate careers.
                </p>
                <p className="helper-text">
                  You can switch the optimizer between private school off and private school on. That changes only the optimizer assumption set until you apply a selected result back into the planner.
                </p>
                <p className="helper-text">
                  This optimizer now tests a 9-case matrix: income growth 2.0% / 3.5% / 5.0%, crossed with correlated market growth cases where ISA/property move together at 2.5%/0.5%, 4.0%/1.5%, and 5.5%/2.5% in real terms.
                </p>
                <p className="helper-text">
                  The first house is fixed to {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}. Housing inputs searched here are explicit deposit and mortgage ranges. For upgrade paths, house 1 value is deposit plus mortgage and can start from {formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}, or from {formatCurrency(OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE)} if the second move happens by {OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF}. One-home paths are later filtered by the stricter {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} first-house rule. The first-house mortgage cannot exceed {formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)}. In the upgrade path, the extra deposit plus extra mortgage must be between {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} and {formatCurrency(OPTIMIZER_MAX_UPGRADE_VALUE)}.
                </p>
                <p className="helper-text">
                  If the first house total is below {formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the upgrade must happen by {OPTIMIZER_FAST_UPGRADE_YEAR_MAX}. Otherwise the latest upgrade year is {OPTIMIZER_LATE_UPGRADE_YEAR_MAX}. House move costs include stamp duty, purchase legal fees, and first-home sale costs.
                </p>
                <p className="helper-text">
                  {`Results are only kept if liquid cash before the age-${END_AGE} mortgage payoff stays positive, `}
                  one-home plans buy at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}, two-home plans reach at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} on the second purchase value, there is no funding gap, cumulative shortfall, or capitalised interest, and total mortgage outstanding never goes above {formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)}. The optimizer then ranks by end net worth, defined as post-payoff liquid cash plus home equity.
                </p>
                <p className="helper-text">
                  Mode selected: {optimizerModeLabel}. {optimizerModeDescription}
                </p>
                <p className="helper-text">
                  Search type: {displayOptimizerSearchMeta?.isExhaustive ? 'full stepped search across every value in the active ranges' : 'sampled browser preview across the active ranges'}.
                  {displayOptimizerSearchMeta && !displayOptimizerSearchMeta.isExhaustive
                    ? ` The full stepped grid would require ${displayOptimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations, so the browser preview only samples the range to stay responsive.`
                    : displayOptimizerSearchMeta
                      ? ` The current browser run covers ${displayOptimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations exactly.`
                      : ''}
                </p>
                <p className="helper-text">
                  {`"Tested" means the number of housing combinations the optimizer actually ran for that assumption case. "Feasible" means the subset that passed every hard rule: positive liquid cash before the age-${END_AGE} mortgage payoff, `}
                  one-home plans needing at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} on the first house, two-home plans needing at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} on the second purchase value, no funding gap, no cumulative shortfall, no capitalised interest, and mortgage balances within the caps.
                </p>
              </div>
            )}
          </div>

          <div className="optimizer-mode-row">
            <button
              type="button"
              className={`view-tab${optimizerPropertyMode === 'both' ? ' view-tab-active' : ''}`}
              onClick={() => setOptimizerPropertyMode('both')}
            >
              Let optimizer choose
            </button>
            <button
              type="button"
              className={`view-tab${optimizerPropertyMode === 'one' ? ' view-tab-active' : ''}`}
              onClick={() => setOptimizerPropertyMode('one')}
            >
              Keep one home
            </button>
            <button
              type="button"
              className={`view-tab${optimizerPropertyMode === 'two' ? ' view-tab-active' : ''}`}
              onClick={() => setOptimizerPropertyMode('two')}
            >
              Buy then upgrade
            </button>
          </div>

          <div className="optimizer-mode-row">
            <button
              type="button"
              className={`view-tab${!optimizerUsePrivateSchool ? ' view-tab-active' : ''}`}
              onClick={() => setOptimizerUsePrivateSchool(false)}
            >
              Private school off
            </button>
            <button
              type="button"
              className={`view-tab${optimizerUsePrivateSchool ? ' view-tab-active' : ''}`}
              onClick={() => setOptimizerUsePrivateSchool(true)}
            >
              Private school on
            </button>
          </div>

          <div className="assumptions-box">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowOptimizerAssumptions(prev => !prev)}
            >
              {showOptimizerAssumptions ? 'Hide frozen assumptions' : 'Show frozen assumptions'}
            </button>
            {showOptimizerAssumptions && (
              <>
                <h3 className="assumptions-title">Frozen assumptions during search</h3>
                <div className="assumptions-list">
                  {optimizerFrozenAssumptions.map((assumption) => (
                    <div key={assumption} className="assumption-item">
                      {assumption}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="optimizer-range-summary">
            <div className="summary-card summary-accent-blue">
              <div className="summary-label">First House Year</div>
              <div className="summary-value">{OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}</div>
              <div className="summary-sub">
                Fixed requirement for every optimizer result
              </div>
            </div>
            <div className="summary-card summary-accent-blue">
              <div className="summary-label">First House Total Range</div>
              <div className="summary-value">
                {formatCurrency(optimizerFirstHouseTotalMin)} to {formatCurrency(optimizerFirstHouseTotalMax)}
              </div>
              <div className="summary-sub">
                Deposit + mortgage search range; one-home feasibility later needs {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)}
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">Upgrade Year Rule</div>
              <div className="summary-value">{optimizerUpgradeYearRuleText}</div>
              <div className="summary-sub">
                Based on whether the first house total is below or above {formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">Mortgage Caps</div>
              <div className="summary-value">
                {formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)} / {formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)}
              </div>
              <div className="summary-sub">
                First-house mortgage max / peak total mortgage max at any point
              </div>
            </div>
            {showOptimizerSecondHouseControls && (
              <div className="summary-card summary-accent-green">
                <div className="summary-label">Upgrade Total Range</div>
                <div className="summary-value">
                  {formatCurrency(optimizerUpgradeTotalMin)} to {formatCurrency(optimizerUpgradeTotalMax)}
                </div>
                <div className="summary-sub">
                  Extra deposit + extra mortgage, kept between {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} and {formatCurrency(OPTIMIZER_MAX_UPGRADE_VALUE)}
                </div>
              </div>
            )}
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">House Value Rule</div>
              <div className="summary-value">
                {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} / {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}
              </div>
              <div className="summary-sub">
                One-home first house minimum / two-home second purchase minimum
              </div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Fixed Legal Fees</div>
              <div className="summary-value">
                {formatCurrency(FIRST_HOUSE_LEGAL_FEES)} / {formatCurrency(SECOND_HOUSE_LEGAL_FEES)}
              </div>
              <div className="summary-sub">
                First purchase / upgrade purchase, plus sale costs of {FIRST_HOME_SALE_AGENT_FEE_PCT.toFixed(1)}% + {formatCurrency(FIRST_HOME_SALE_LEGAL_FEES)}
              </div>
            </div>
          </div>

          <div className="advanced-grid optimizer-grid">
            <RangeSlider
              label="First Deposit Min"
              value={optimizerFirstHouseDepositMin}
              min={0}
              max={1500000}
              step={50000}
              onChange={setOptimizerFirstHouseDepositMin}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="First Deposit Max"
              value={optimizerFirstHouseDepositMax}
              min={0}
              max={1500000}
              step={50000}
              onChange={setOptimizerFirstHouseDepositMax}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="First Mortgage Min"
              value={optimizerFirstHouseMortgageMin}
              min={0}
              max={OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE}
              step={50000}
              onChange={setOptimizerFirstHouseMortgageMin}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="First Mortgage Max"
              value={optimizerFirstHouseMortgageMax}
              min={0}
              max={OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE}
              step={50000}
              onChange={setOptimizerFirstHouseMortgageMax}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="Mortgage % Early Range Start"
              value={optimizerEarlyMortgagePctMin}
              min={5}
              max={35}
              step={1}
              onChange={setOptimizerEarlyMortgagePctMin}
              formatValue={v => `${v}%`}
            />
            <RangeSlider
              label="Mortgage % Early Range End"
              value={optimizerEarlyMortgagePctMax}
              min={5}
              max={35}
              step={1}
              onChange={setOptimizerEarlyMortgagePctMax}
              formatValue={v => `${v}%`}
            />
            {showOptimizerSecondHouseControls && (
              <>
                <RangeSlider
                  label="Upgrade Deposit Min"
                  value={optimizerSecondHouseDepositMin}
                  min={0}
                  max={1000000}
                  step={50000}
                  onChange={setOptimizerSecondHouseDepositMin}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Upgrade Deposit Max"
                  value={optimizerSecondHouseDepositMax}
                  min={0}
                  max={1000000}
                  step={50000}
                  onChange={setOptimizerSecondHouseDepositMax}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Upgrade Mortgage Min"
                  value={optimizerSecondHouseMortgageMin}
                  min={0}
                  max={OPTIMIZER_MAX_TOTAL_MORTGAGE}
                  step={50000}
                  onChange={setOptimizerSecondHouseMortgageMin}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Upgrade Mortgage Max"
                  value={optimizerSecondHouseMortgageMax}
                  min={0}
                  max={OPTIMIZER_MAX_TOTAL_MORTGAGE}
                  step={50000}
                  onChange={setOptimizerSecondHouseMortgageMax}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Second House Year Min"
                  value={optimizerSecondHouseYearMin}
                  min={startYear + 1}
                  max={OPTIMIZER_LATE_UPGRADE_YEAR_MAX}
                  step={1}
                  onChange={setOptimizerSecondHouseYearMin}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Second House Year Max"
                  value={optimizerSecondHouseYearMax}
                  min={startYear + 1}
                  max={OPTIMIZER_LATE_UPGRADE_YEAR_MAX}
                  step={1}
                  onChange={setOptimizerSecondHouseYearMax}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Mortgage % Later Range Start"
                  value={optimizerLaterMortgagePctMin}
                  min={5}
                  max={50}
                  step={1}
                  onChange={setOptimizerLaterMortgagePctMin}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Mortgage % Later Range End"
                  value={optimizerLaterMortgagePctMax}
                  min={5}
                  max={50}
                  step={1}
                  onChange={setOptimizerLaterMortgagePctMax}
                  formatValue={v => `${v}%`}
                />
              </>
            )}
          </div>

          {selectedOptimizerResult && (
            <div className="optimizer-selected-card">
              <div className="optimizer-result-header">
                <div>
                  <div className="optimizer-result-title">
                    {precomputedStoredResults.length
                      ? 'Selected full-search combination'
                      : 'Selected preview combination'}
                  </div>
                  <div className="optimizer-result-sub">
                    {precomputedStoredResults.length
                      ? 'The buttons below switch between the best combination from each income-growth and market-growth case using the terminal-side full search.'
                      : 'The buttons below switch between the best combinations from the browser-side preview for each income-growth and market-growth case.'}
                  </div>
                </div>
                <div className="optimizer-result-meta">
                  {precomputedStoredResults.length
                    ? `${precomputedStoredResults.length.toLocaleString()} stored examples / ${precomputedOptimizerSearchMeta ? precomputedOptimizerSearchMeta.testedScenarioCount.toLocaleString() : '0'} tested`
                    : `${optimizerRecommendedResults.length.toLocaleString()} preview winners`}
                </div>
              </div>

              <div className="optimizer-choice-row">
                {displayOptimizerRecommendedResults.map((result, index) => {
                  const resultKey = getOptimizerResultKey(result);
                  return (
                    <button
                      key={resultKey}
                      type="button"
                      className={`optimizer-choice-button${resultKey === getOptimizerResultKey(selectedOptimizerResult) ? ' optimizer-choice-active' : ''}`}
                      onClick={() => setSelectedOptimizerResultKey(resultKey)}
                    >
                      #{index + 1} {result.assumptionCase.incomeCase.shortLabel} income / {result.assumptionCase.marketCase.shortLabel} market · {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'}
                    </button>
                  );
                })}
              </div>

              <div className="optimizer-metric-grid">
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">End Net Worth</div>
                  <div className="summary-value">{formatCurrency(getOptimizerNetWorth(selectedOptimizerResult))}</div>
                  <div className="summary-sub">Post-payoff cash plus home equity</div>
                </div>
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">Cash End After Payoff</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.cashEnd)}</div>
                  <div className="summary-sub">{`Liquid cash left after the age-${END_AGE} mortgage payoff`}</div>
                </div>
                <div className="summary-card summary-accent-green">
                  <div className="summary-label">{getOptimizerHousingEndLabel(selectedOptimizerResult)}</div>
                  <div className="summary-value">{formatCurrency(getOptimizerHousingEndValue(selectedOptimizerResult))}</div>
                  <div className="summary-sub">{getOptimizerHousingEndSub(selectedOptimizerResult)}</div>
                </div>
                <div className="summary-card summary-accent-blue">
                  <div className="summary-label">Lifetime Interest</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.lifetimeInterestPaid)}</div>
                  <div className="summary-sub">{selectedOptimizerResult.enableSecondHouse ? 'Upgrade path' : 'One-home path'}</div>
                </div>
              </div>

              <div className="optimizer-detail-list">
                <div>Assumption case: {selectedOptimizerResult.assumptionCase.incomeCase.label} {selectedOptimizerResult.assumptionCase.incomeGrowth}% | {selectedOptimizerResult.assumptionCase.marketCase.label} | ISA {selectedOptimizerResult.assumptionCase.isaGrowth}% | property {selectedOptimizerResult.assumptionCase.propertyGrowth}%</div>
                <div>Starting cash split: deposit {formatCurrency(selectedOptimizerResult.initialDeposit)} | ISA seed {formatCurrency(selectedOptimizerResult.optimizerIsaSeed)}</div>
                <div>First house: {selectedOptimizerResult.firstHousePurchaseYear} | value {formatCurrency(selectedOptimizerResult.firstHouseValue)} | deposit {formatCurrency(selectedOptimizerResult.initialDeposit)} | mortgage {formatCurrency(selectedOptimizerResult.initialMortgage)}</div>
                <div>Mortgage budget: {selectedOptimizerResult.salaryMortgageEarly}% early{selectedOptimizerResult.enableSecondHouse ? `, ${selectedOptimizerResult.salaryMortgageLater}% after the move` : ''}</div>
                {selectedOptimizerResult.enableSecondHouse ? (
                  <div>Upgrade step: {selectedOptimizerResult.secondHouseYear} | extra value {formatCurrency(selectedOptimizerResult.secondUpgradeValue)} | extra deposit {formatCurrency(selectedOptimizerResult.secondHouseDeposit)} | extra mortgage {formatCurrency(selectedOptimizerResult.secondMortgage)}</div>
                ) : (
                  <div>Housing path: one property only with no later move</div>
                )}
                <div>{`Age-${END_AGE} mortgage payoff from savings: `}{formatCurrency(selectedOptimizerResult.terminalMortgagePaydown)} | cash before payoff: {formatCurrency(selectedOptimizerResult.cashBeforeTerminalMortgagePayoff)}</div>
                {selectedOptimizerResult.finalMortgageBalance > 0.01 ? (
                  <div>End property value: {formatCurrency(selectedOptimizerResult.finalPropertyValue)} | remaining mortgage after payoff: {formatCurrency(selectedOptimizerResult.finalMortgageBalance)}</div>
                ) : (
                  <div>End property value after payoff: {formatCurrency(selectedOptimizerResult.finalPropertyValue)} | mortgage fully cleared</div>
                )}
                <div>Lifetime interest paid: {formatCurrency(selectedOptimizerResult.lifetimeInterestPaid)}</div>
              </div>

              <button
                type="button"
                className="preset-button"
                onClick={() => handleApplyOptimizerResult(selectedOptimizerResult)}
              >
                Apply selected combination to planner
              </button>
            </div>
          )}

          {precomputedStoredResults.length > 0 && (
            <div className="optimizer-selected-card">
              <div className="optimizer-result-header">
                <div>
                  <div className="optimizer-result-title">Top combinations from terminal run</div>
                  <div className="optimizer-result-sub">
                    A curated stored set from the last terminal-side full search. This keeps the page light while preserving the best and strongest scenarios across the tested cases.
                  </div>
                </div>
                <div className="optimizer-result-meta">
                  {precomputedStoredResults.length.toLocaleString()} stored / {precomputedOptimizerSearchMeta ? precomputedOptimizerSearchMeta.feasibleScenarioCount.toLocaleString() : '0'} feasible total
                </div>
              </div>

              {precomputedOptimizerGeneratedAt && (
                <div className="optimizer-result-sub">
                  Generated: {new Date(precomputedOptimizerGeneratedAt).toLocaleString()}
                </div>
              )}

              <div className="optimizer-pager-row">
                <button
                  type="button"
                  className="preset-button preset-button-secondary"
                  onClick={() => setShowAllFeasibleResults(prev => !prev)}
                >
                  {showAllFeasibleResults ? 'Hide full list' : 'Show full list'}
                </button>
                {showAllFeasibleResults && (
                  <>
                    <button
                      type="button"
                      className="preset-button preset-button-secondary"
                      onClick={() => setAllFeasiblePage(page => Math.max(1, page - 1))}
                      disabled={allFeasiblePage === 1}
                    >
                      Previous
                    </button>
                    <div className="optimizer-result-meta">
                      Page {allFeasiblePage} of {allFeasiblePageCount}
                    </div>
                    <button
                      type="button"
                      className="preset-button preset-button-secondary"
                      onClick={() => setAllFeasiblePage(page => Math.min(allFeasiblePageCount, page + 1))}
                      disabled={allFeasiblePage === allFeasiblePageCount}
                    >
                      Next
                    </button>
                  </>
                )}
              </div>

              {showAllFeasibleResults && (
                <div className="optimizer-feasible-list">
                  {pagedFeasibleResults.map((result, index) => {
                    const resultKey = getOptimizerResultKey(result);
                    const isSelected = resultKey === getOptimizerResultKey(selectedOptimizerResult);
                    const overallIndex = (allFeasiblePage - 1) * allFeasiblePageSize + index + 1;
                    return (
                      <button
                        key={resultKey}
                        type="button"
                        className={`optimizer-top-item${isSelected ? ' optimizer-choice-active' : ''}`}
                        onClick={() => setSelectedOptimizerResultKey(resultKey)}
                      >
                        {overallIndex}. {result.assumptionCase.incomeCase.shortLabel} income / {result.assumptionCase.marketCase.shortLabel} market | {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | first {formatCurrency(result.firstHouseValue)} ({formatCurrency(result.initialDeposit)} deposit + {formatCurrency(result.initialMortgage)} mortgage){result.enableSecondHouse ? ` | upgrade ${result.secondHouseYear} +${formatCurrency(result.secondUpgradeValue)}` : ''} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | {getOptimizerHousingEndInlineLabel(result)} {formatCurrency(getOptimizerHousingEndValue(result))} | interest {formatCurrency(result.lifetimeInterestPaid)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimizer' && !precomputedStoredResults.length && precomputedOptimizerError && (
            <div className="optimizer-empty">
              Full terminal results could not be loaded: {precomputedOptimizerError}
            </div>
          )}

          {displayOptimizerResultsByIncome.map(({ incomeCase, caseResults }) => (
            <div key={incomeCase.id} className="optimizer-income-section">
              <button
                type="button"
                className={`optimizer-income-header optimizer-income-toggle${expandedOptimizerIncomeId === incomeCase.id ? ' optimizer-income-toggle-open' : ''}`}
                onClick={() => setExpandedOptimizerIncomeId(
                  expandedOptimizerIncomeId === incomeCase.id ? '' : incomeCase.id,
                )}
              >
                <div>
                  <div className="optimizer-result-title">{incomeCase.label}</div>
                  <div className="optimizer-result-sub">
                    Real income growth {incomeCase.growth}% | {incomeCase.description}
                  </div>
                </div>
                <div className="optimizer-income-chevron">
                  {expandedOptimizerIncomeId === incomeCase.id ? 'Hide' : 'Show'}
                </div>
              </button>

              {expandedOptimizerIncomeId === incomeCase.id && (
                <div className="optimizer-results-grid">
                  {caseResults.map(({
                  assumptionCase,
                  scenariosTested,
                  feasibleCount,
                  bestResult,
                  topResults = [],
                  failureSummary = [],
                }) => (
                  <div key={assumptionCase.id} className="optimizer-result-card">
                    <div className="optimizer-result-header">
                      <div>
                        <div className="optimizer-result-title">
                          {assumptionCase.marketCase.label}
                        </div>
                        <div className="optimizer-result-sub">
                          ISA {assumptionCase.isaGrowth}% | property {assumptionCase.propertyGrowth}% | {assumptionCase.description}
                        </div>
                      </div>
                      <div className="optimizer-result-meta">
                        {feasibleCount} feasible / {scenariosTested} tested
                      </div>
                    </div>

                    {bestResult ? (
                      <>
                        <div className="optimizer-metric-grid">
                          <div className="summary-card summary-accent-cyan">
                            <div className="summary-label">End Net Worth</div>
                            <div className="summary-value">{formatCurrency(getOptimizerNetWorth(bestResult))}</div>
                            <div className="summary-sub">Post-payoff cash plus home equity</div>
                          </div>
                          <div className="summary-card summary-accent-cyan">
                            <div className="summary-label">Cash End After Payoff</div>
                            <div className="summary-value">{formatCurrency(bestResult.cashEnd)}</div>
                            <div className="summary-sub">{`Liquid cash left after the age-${END_AGE} mortgage payoff`}</div>
                          </div>
                          <div className="summary-card summary-accent-green">
                            <div className="summary-label">{getOptimizerHousingEndLabel(bestResult)}</div>
                            <div className="summary-value">{formatCurrency(getOptimizerHousingEndValue(bestResult))}</div>
                            <div className="summary-sub">{getOptimizerHousingEndSub(bestResult)}</div>
                          </div>
                          <div className="summary-card summary-accent-blue">
                            <div className="summary-label">Lifetime Interest</div>
                            <div className="summary-value">{formatCurrency(bestResult.lifetimeInterestPaid)}</div>
                            <div className="summary-sub">{bestResult.enableSecondHouse ? 'Two-property path' : 'One-property path'}</div>
                          </div>
                        </div>

                        <div className="optimizer-detail-list">
                          <div>Quick preview options in this case: {topResults.length}</div>
                        </div>

                        <div className="optimizer-top-list">
                          {topResults.map((result, index) => {
                            const resultKey = getOptimizerResultKey(result);
                            const isSelected = resultKey === getOptimizerResultKey(selectedOptimizerResult || bestResult);

                            return (
                              <button
                                key={resultKey}
                                type="button"
                                className={`optimizer-top-item${isSelected ? ' optimizer-choice-active' : ''}`}
                                onClick={() => setSelectedOptimizerResultKey(resultKey)}
                              >
                                Preview {index + 1}: {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | {getOptimizerHousingEndInlineLabel(result)} {formatCurrency(getOptimizerHousingEndValue(result))} | interest {formatCurrency(result.lifetimeInterestPaid)}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => setSelectedOptimizerResultKey(getOptimizerResultKey(bestResult))}
                        >
                          Select this case&apos;s best combination
                        </button>
                      </>
                    ) : (
                      <div className="optimizer-empty">
                        <div>No feasible plan found in the current search ranges.</div>
                        {failureSummary.length > 0 && (
                          <div className="optimizer-failure-list">
                            {failureSummary.map((failure) => (
                              <div key={failure.key}>
                                {failure.label} {failure.count}/{scenariosTested} tested ({failure.share.toFixed(0)}%).
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="chart-card">
          <h2 className="panel-title">Robustness Analysis</h2>
          <p className="helper-text">
            This tab answers a different question from the optimizer: not “what wins in one assumed future?”, but “what still looks sensible across many plausible futures?”
          </p>

          {robustnessError && !robustnessReport && (
            <div className="optimizer-empty">
              Robustness report could not be loaded: {robustnessError}
            </div>
          )}

          {!robustnessReport && !robustnessError && (
            <div className="optimizer-empty">
              Loading robustness report...
            </div>
          )}

          {robustnessReport && (
            <>
              <div className="robustness-explainer-grid">
                <div className="robustness-explainer-card">
                  <div className="optimizer-result-title">What this tab does</div>
                  <div className="optimizer-result-sub">
                    This tab stress-tests housing strategies across many future paths rather than assuming one single future. It is trying to answer: “which starting setup still looks sensible across a wide range of income, market, mortgage-rate, and school-cost outcomes?”
                  </div>
                </div>
                <div className="robustness-explainer-card">
                  <div className="optimizer-result-title">What was sampled</div>
                  <div className="optimizer-result-sub">
                    {robustnessMeta?.scenarioSampling?.description ?? 'Scenario sampling details unavailable.'}
                    {' '}The strategy side is {robustnessMeta?.strategySampling?.description?.toLowerCase() ?? 'not available'}.
                  </div>
                </div>
                <div className="robustness-explainer-card">
                  <div className="optimizer-result-title">What weighted share means</div>
                  <div className="optimizer-result-sub">
                    A “weighted share” is not just raw row-count percentage. Medium futures count more than low/high by design, and private-school futures only count by the private-school probability you set. So 60% feasibility means the plan survives 60% of the model’s total probability mass, not necessarily 60% of raw rows.
                  </div>
                </div>
                <div className="robustness-explainer-card">
                  <div className="optimizer-result-title">Why not every scenario</div>
                  <div className="optimizer-result-sub">
                    {robustnessMeta?.scenarioSampling?.whyNotEveryScenario ?? 'The future-path generator is continuous year by year, so there is no finite master list of all possible scenarios to enumerate.'}
                  </div>
                </div>
              </div>

              <div className="summary-grid robustness-summary-grid">
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">Scenario Sample</div>
                  <div className="summary-value">{robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'}</div>
                  <div className="summary-sub">
                    {robustnessMeta?.sampleMethod ?? 'Weighted stratified Monte Carlo'}
                  </div>
                </div>
                <div className="summary-card summary-accent-blue">
                  <div className="summary-label">Candidate Strategies</div>
                  <div className="summary-value">{robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'}</div>
                  <div className="summary-sub">
                    Housing decision vectors tested across the scenario sample
                  </div>
                </div>
                <div className="summary-card summary-accent-green">
                  <div className="summary-label">Robust Region</div>
                  <div className="summary-value">
                    {robustnessRecommendation
                      ? `${formatCurrency(robustnessRecommendation.plateauRegion.deposit1Min)} / ${formatCurrency(robustnessRecommendation.plateauRegion.mortgage1Min)}`
                      : '—'}
                  </div>
                  <div className="summary-sub">
                    First deposit / first mortgage at the strongest plateau start
                  </div>
                </div>
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">Path Mix</div>
                  <div className="summary-value">
                    {(robustnessMeta?.strategySampling?.pathCounts?.oneHome ?? 0).toLocaleString()}
                    {' / '}
                    {(robustnessMeta?.strategySampling?.pathCounts?.twoHome ?? 0).toLocaleString()}
                  </div>
                  <div className="summary-sub">
                    One-home / two-home strategies in the robustness catalog
                  </div>
                </div>
              </div>

              <div className="robustness-card">
                <div className="optimizer-result-title">Recommended robust starting region</div>
                <div className="optimizer-result-sub">
                  {robustnessRecommendation?.headline}
                </div>
                <div className="optimizer-detail-list">
                  {robustnessRecommendation?.notes?.map((note) => (
                    <div key={note}>{note}</div>
                  ))}
                </div>
                <div className="optimizer-detail-list">
                  <div>
                    House-value rule in this run: one-home paths need a first house of at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}; two-home paths need the second house purchase value to reach at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}.
                  </div>
                  <div>
                    Default weighting: medium cases {formatProbability(robustnessMeta?.defaultMediumWeight ?? 0)}
                    {' '}and private school probability {formatProbability(robustnessMeta?.defaultPrivateSchoolProbability ?? 0)}.
                  </div>
                  <div>
                    Starting incomes baked into this robustness run: {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person1 ?? 0)}
                    {' '}and {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person2 ?? 0)}.
                  </div>
                  <div>
                    Apply-to-planner default view: {robustnessMeta?.defaultApplyScenario?.incomeLabel ?? 'Medium income'} / {robustnessMeta?.defaultApplyScenario?.marketLabel ?? 'Medium market'}
                    {' '}with income growth {robustnessMeta?.defaultApplyScenario?.incomeGrowth ?? 0}%,
                    {' '}ISA growth {robustnessMeta?.defaultApplyScenario?.isaGrowth ?? 0}%,
                    {' '}property growth {robustnessMeta?.defaultApplyScenario?.propertyGrowth ?? 0}%.
                  </div>
                </div>
                <div className="robustness-links">
                  {robustnessCharts?.markdown && (
                    <a
                      className="preset-button preset-button-secondary"
                      href={`${import.meta.env.BASE_URL}${robustnessCharts.markdown}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open markdown report
                    </a>
                  )}
                </div>
              </div>

              <div className="robustness-card">
                <div className="optimizer-result-title">How the sample was built</div>
                <div className="robustness-explainer-grid">
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">Scenario buckets</div>
                    <div className="optimizer-result-sub">
                      Income uses the low / medium / high real growth buckets from the planner. Market uses the linked ISA/property low / medium / high buckets. Private school is treated as uncertain rather than fixed, so every run includes both school-on and school-off futures.
                    </div>
                    <div className="optimizer-detail-list">
                      <div>Income cases: {OPTIMIZER_INCOME_CASES.map((item) => `${item.shortLabel} ${item.growth}%`).join(', ')}</div>
                      <div>
                        Market cases: {OPTIMIZER_MARKET_CASES.map((item) => `${item.shortLabel} ISA ${item.isaGrowth}% / Property ${item.propertyGrowth}%`).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">Strategy buckets</div>
                    <div className="optimizer-result-sub">
                      The robustness run does not invent brand-new housing levers from scratch. It starts from the strongest optimizer strategies, then adds a broader one-home grid so you can compare keep-one-home and upgrade paths instead of only seeing upgrade winners.
                    </div>
                    <div className="optimizer-detail-list">
                      <div>
                        Origins: {Object.entries(robustnessMeta?.strategySampling?.originCounts ?? {}).map(([origin, count]) => `${origin === 'supplemental-one-home' ? 'supplemental one-home grid' : origin.replaceAll('-', ' ')} ${count}`).join(', ') || '—'}
                      </div>
                      <div>
                        Heatmap range: deposit {robustnessMeta?.strategySampling?.firstDepositPoints?.length
                          ? `${formatCurrency(robustnessMeta.strategySampling.firstDepositPoints[0])} to ${formatCurrency(robustnessMeta.strategySampling.firstDepositPoints[robustnessMeta.strategySampling.firstDepositPoints.length - 1])}`
                          : '—'}
                        {' '}and mortgage {robustnessMeta?.strategySampling?.firstMortgagePoints?.length
                          ? `${formatCurrency(robustnessMeta.strategySampling.firstMortgagePoints[0])} to ${formatCurrency(robustnessMeta.strategySampling.firstMortgagePoints[robustnessMeta.strategySampling.firstMortgagePoints.length - 1])}`
                          : '—'}.
                      </div>
                    </div>
                  </div>
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">How to read percentages</div>
                    <div className="optimizer-result-sub">
                      Feasibility and private-school percentages are weighted shares of probability, not plain row counts. If medium futures are weighted more heavily, a strategy can have a high weighted feasibility even if its raw success count is lower in some lighter-weight buckets.
                    </div>
                    <div className="optimizer-detail-list">
                      <div>{robustnessMeta?.weightingExplanation ?? 'Weighting explanation unavailable.'}</div>
                      <div>
                        Private school % only asks: inside the private-school slice of futures, what share still works and keeps those fees affordable?
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="robustness-card">
                <div className="optimizer-result-title">Best strategy by path type</div>
                <div className="optimizer-result-sub">
                  These three cards let you compare the best overall strategy with the strongest one-home and two-home strategies separately, so you can see how much you are giving up or gaining by forcing a path choice.
                </div>
                <div className="robustness-explainer-grid">
                  {robustnessPathLeaderCards.map(({ key, label, strategy }) => (
                    <div key={key} className="robustness-explainer-card">
                      <div className="optimizer-result-title">{label}</div>
                      {strategy ? (
                        <>
                          <div className="optimizer-result-sub">
                            {strategy.strategyId} · {strategy.pathType}
                          </div>
                          <div className="optimizer-detail-list">
                            <div>
                              Start: {formatCurrency(strategy.decisionVector.deposit1)} deposit / {formatCurrency(strategy.decisionVector.mortgage1)} mortgage
                            </div>
                            <div>
                              End net worth: {formatCurrency(strategy.metrics.expectedEndNetWorth)}
                            </div>
                            <div>
                              Regret CVaR 10%: {formatCurrency(strategy.metrics.regretCvar10)}
                            </div>
                            <div>
                              Feasibility: {formatProbability(strategy.metrics.feasibilityProbability)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="preset-button preset-button-secondary"
                            onClick={() => handleApplyRobustnessStrategy(strategy)}
                          >
                            Apply
                          </button>
                        </>
                      ) : (
                        <div className="optimizer-result-sub">
                          No strategy available for this path bucket.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="robustness-card">
                <div className="optimizer-result-title">Robust strategy range</div>
                <div className="optimizer-result-sub">
                  Use the path toggle to switch between all strategies, one-home only, and two-home only. This is the easiest way to see how different the strongest strategies really are instead of only looking at the overall winner.
                </div>
                <div className="view-tabs robustness-path-tabs">
                  {[
                    { id: 'all', label: 'All paths' },
                    { id: 'oneHome', label: 'One-home only' },
                    { id: 'twoHome', label: 'Two-home only' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`view-tab${robustnessPathView === option.id ? ' view-tab-active' : ''}`}
                      onClick={() => setRobustnessPathView(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="optimizer-result-sub">
                  Showing the top {Math.min(15, robustnessFilteredStrategies.length)} of {robustnessFilteredStrategies.length} strategies in the selected path view.
                </div>
                <div className="robustness-explainer-grid">
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">Regret CVaR 10%</div>
                    <div className="optimizer-result-sub">
                      This is a downside measure. For each future, the model asks how far this strategy falls behind the best strategy in that same future. It then looks at the worst 10% of those gaps and averages them. Lower is better.
                    </div>
                  </div>
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">Feasibility %</div>
                    <div className="optimizer-result-sub">
                      This is the weighted share of the model’s full future probability where the plan stays valid overall: cash does not break, mortgage rules hold, the post-2032 liquid-savings floor is preserved, and the one-home or two-home house-value rule is met. Higher is better.
                    </div>
                  </div>
                  <div className="robustness-explainer-card">
                    <div className="optimizer-result-title">Private School %</div>
                    <div className="optimizer-result-sub">
                      This only looks at the private-school slice of futures. It asks: after re-weighting just that slice to 100%, what share still remains feasible and can still afford school fees? Higher is better.
                    </div>
                  </div>
                </div>
                <div className="robustness-table-wrap">
                  <table className="robustness-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Strategy</th>
                        <th>Path</th>
                        <th>Origin</th>
                        <th>Deposit 1</th>
                        <th>Mortgage 1</th>
                        <th>Deposit 2</th>
                        <th>Mortgage 2</th>
                        <th>Expected Net Worth</th>
                        <th>Regret CVaR 10%</th>
                        <th>Feasibility</th>
                        <th>Private School</th>
                        <th>Apply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {robustnessDisplayedStrategies.map((result, index) => (
                        <tr key={result.strategyId}>
                          <td>{index + 1}</td>
                          <td>{result.strategyId}</td>
                          <td>{result.pathType}</td>
                          <td>{result.strategyOrigin === 'supplemental-one-home' ? 'Supplemental one-home grid' : 'Optimizer-ranked'}</td>
                          <td>{formatCurrency(result.decisionVector.deposit1)}</td>
                          <td>{formatCurrency(result.decisionVector.mortgage1)}</td>
                          <td>{result.decisionVector.buyYear2 ? formatCurrency(result.decisionVector.deposit2) : '—'}</td>
                          <td>{result.decisionVector.buyYear2 ? formatCurrency(result.decisionVector.mortgage2) : '—'}</td>
                          <td>{formatCurrency(result.metrics.expectedEndNetWorth)}</td>
                          <td>{formatCurrency(result.metrics.regretCvar10)}</td>
                          <td>{formatProbability(result.metrics.feasibilityProbability)}</td>
                          <td>{formatProbability(result.metrics.privateSchoolFeasibilityProbability)}</td>
                          <td>
                            <button
                              type="button"
                              className="preset-button preset-button-secondary"
                              onClick={() => handleApplyRobustnessStrategy(result)}
                            >
                              Apply
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="robustness-chart-grid">
                <div className="robustness-chart-card">
                  <div className="optimizer-result-title">Expected Net Worth vs Regret</div>
                  <div className="optimizer-result-sub">
                    This chart changes with the path toggle above. Each dot is one sampled strategy in that path view. The horizontal axis is weighted expected end net worth, so further right is better. The vertical axis is regret CVaR 10%, so lower is better. The line is the Pareto frontier: strategies on that line are not clearly beaten on both expected wealth and downside regret at the same time.
                  </div>
                  {robustnessSelectedScatter && (
                    <img
                      className="robustness-chart-image"
                      src={`${import.meta.env.BASE_URL}${robustnessSelectedScatter}`}
                      alt="Scatter plot of expected net worth vs regret CVaR"
                    />
                  )}
                </div>
                <div className="robustness-chart-card">
                  <div className="optimizer-result-title">CDF of Top Strategies</div>
                  <div className="optimizer-result-sub">
                    This chart also follows the selected path view. Each line is one of the strongest strategies in that bucket. Moving right means higher end net worth. If one line stays to the right of another for most of the plot, it usually means that strategy is producing better end-wealth outcomes across a broad chunk of the distribution, not just in the average case.
                  </div>
                  {robustnessSelectedCdf && (
                    <img
                      className="robustness-chart-image"
                      src={`${import.meta.env.BASE_URL}${robustnessSelectedCdf}`}
                      alt="CDF of top robust strategies"
                    />
                  )}
                </div>
                <div className="robustness-chart-card">
                  <div className="optimizer-result-title">Deposit vs Mortgage Plateau</div>
                  <div className="optimizer-result-sub">
                    This heatmap only changes the two starting levers on the axes: first deposit and first mortgage. Darker cells are stronger robust scores. The bold plateau is the “good neighborhood” where nearby starting combinations perform similarly well, so you are not relying on one fragile exact point. If the axis stops early, that is because the fixed starting cash pool in this run caps what first deposit can be funded.
                  </div>
                  <div className="optimizer-detail-list">
                    <div>
                      First-deposit points shown: {robustnessMeta?.strategySampling?.firstDepositPoints?.map((value) => formatCurrency(value)).join(', ') || '—'}
                    </div>
                    <div>
                      First-mortgage points shown: {robustnessMeta?.strategySampling?.firstMortgagePoints?.map((value) => formatCurrency(value)).join(', ') || '—'}
                    </div>
                    <div>
                      Grey cells mean that deposit/mortgage pair is in the overall plotted range, but no robustness candidate strategy was included there.
                    </div>
                  </div>
                  {robustnessCharts?.heatmap && (
                    <img
                      className="robustness-chart-image"
                      src={`${import.meta.env.BASE_URL}${robustnessCharts.heatmap}`}
                      alt="Heatmap of robust score by first deposit and first mortgage"
                    />
                  )}
                </div>
                <div className="robustness-chart-card">
                  <div className="optimizer-result-title">Sensitivity</div>
                  <div className="optimizer-result-sub">
                    This does not resimulate the housing grid from scratch. Instead, it changes two judgment calls on the same scenario set: how much weight to give medium-case futures, and how likely private school is. Each box shows which strategy wins under that weighting choice, so you can see whether the recommendation is stable or flips easily.
                  </div>
                  {robustnessCharts?.sensitivity && (
                    <img
                      className="robustness-chart-image"
                      src={`${import.meta.env.BASE_URL}${robustnessCharts.sensitivity}`}
                      alt="Sensitivity of the top robust strategy to medium-weight and private-school probability"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
