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
const OPTIMIZER_MIN_UPGRADE_VALUE = 200000;
const OPTIMIZER_MIN_END_PROPERTY_VALUE = 1000000;
const OPTIMIZER_FIXED_FIRST_HOUSE_YEAR = 2027;
const OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD = 750000;
const OPTIMIZER_FAST_UPGRADE_YEAR_MAX = 2036;
const OPTIMIZER_LATE_UPGRADE_YEAR_MAX = 2045;
const OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE = 700000;
const OPTIMIZER_MAX_TOTAL_MORTGAGE = 700000;
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
  let minIsaBalance = isaSeed || 0;
  let negativeAmortizationYears = 0;
  let capitalizedInterestTotal = 0;
  let peakMortgageBalance = 0;
  let finalSnapshot = null;

  for (let year = startYear; year <= maxYear; year++) {
    if (!hasFirstHouse && year === firstHousePurchaseYear) {
      hasFirstHouse = true;
      propertyValue = initialPropertyValue;
      firstMortgageBalance = initialMortgage;
    }

    if (hasFirstHouse) {
      propertyValue *= 1 + realGrowthProperty / 100;
    }

    const yearsFromStart = year - startYear;
    const age = startAge + yearsFromStart;

    let income1 = calculateCareerIncome(
      income1Start,
      incomeGrowth,
      startAge,
      age,
    );
    let income2 = calculateCareerIncome(
      income2Start,
      incomeGrowth,
      startAge,
      age,
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
      const withdrawn = Math.min(secondHouseDeposit, isaTotal);
      isaTotal -= withdrawn;
      const depositGap = Math.max(0, secondHouseDeposit - withdrawn);
      if (depositGap > 0) {
        secondHouseFundingGapLocal += depositGap;
        cumulativeShortfall += depositGap;
      }
      secondMortgageBalance = secondMortgage;
      propertyValue = plannedSecondHouseValue;
      secondHouseValueAtMoveLocal = propertyValue;
      secondHousePurchasePriceLocal = propertyValue;
      purchaseLumpSum += plannedSecondHouseStampDuty + SECOND_HOUSE_LEGAL_FEES;
    }

    let visaCost = 0;
    if (year <= 2036) {
      visaCost = visaCostPreSecondHouse;
    } else if (enableSecondHouse && year === secondHouseYear) {
      visaCost = visaCostAtSecondHouse;
    }

    const yearlyRate = mortgageRate / 100;
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
    }

    const isaContribution = Math.min(Math.max(0, totalLeft), isaContributionCap);
    isaTotal = isaTotal * (1 + isaGrowth / 100) + isaContribution;

    const surplusContribution = Math.max(0, totalLeft - isaContribution);
    const growthRate = isaGrowth / 100;
    const grossGrowth = surplusPot * growthRate;
    const afterTaxGrowth = grossGrowth * (1 - cgtRate);
    surplusPot = surplusPot + afterTaxGrowth + surplusContribution;

    const isaBelowThreshold = isaTotal < 60000;
    minIsaBalance = Math.min(minIsaBalance, isaTotal);

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

  const finalLiquidNet = finalSnapshot
    ? finalSnapshot.isaTotal +
      finalSnapshot.surplusPot -
      finalSnapshot.mortgageBalance -
      finalSnapshot.cumulativeShortfall
    : 0;
  const cashEnd = finalSnapshot
    ? finalSnapshot.isaTotal + finalSnapshot.surplusPot
    : 0;
  const equityEnd = finalSnapshot
    ? finalSnapshot.propertyValue - finalSnapshot.mortgageBalance
    : 0;
  const netWorthEnd = cashEnd + equityEnd;

  return {
    financialData: returnFullData && data ? data : [],
    mortgageRepayYear: mortgageRepayYearLocal,
    secondHouseValueAtMove: secondHouseValueAtMoveLocal,
    secondHousePurchasePrice: secondHousePurchasePriceLocal,
    secondHouseFundingGap: secondHouseFundingGapLocal,
    firstMortgagePaidOffYear: firstMortgagePaidOffYearLocal,
    minIsaBalance,
    finalLiquidNet,
    cashEnd,
    equityEnd,
    netWorthEnd,
    finalPropertyValue: finalSnapshot?.propertyValue ?? 0,
    totalMortgagePayments: finalSnapshot?.totalMortgagePayments ?? 0,
    lifetimeInterestPaid: finalSnapshot?.totalInterestPaid ?? 0,
    cumulativeShortfall: finalSnapshot?.cumulativeShortfall ?? 0,
    negativeAmortizationYears,
    capitalizedInterestTotal,
    peakMortgageBalance: finalSnapshot?.peakMortgageBalance ?? 0,
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

    for (const currentPropertyMode of propertyModes) {
      for (const initialDeposit of firstHouseDeposits) {
        for (const initialMortgage of firstHouseMortgages) {
          for (const firstHousePurchaseYear of firstHouseYears) {
            for (const salaryMortgageEarly of earlyMortgagePcts) {
              const firstHouseValue = initialDeposit + initialMortgage;
              const optimizerIsaSeed = Math.max(0, startingCashPool - initialDeposit);

              if (
                initialDeposit > startingCashPool ||
                firstHouseValue < OPTIMIZER_MIN_FIRST_PROPERTY_VALUE ||
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

                const feasible =
                  simulation.cashEnd > 0 &&
                  simulation.finalPropertyValue >= OPTIMIZER_MIN_END_PROPERTY_VALUE &&
                  simulation.cumulativeShortfall <= 0.01 &&
                  simulation.secondHouseFundingGap <= 0.01 &&
                  simulation.negativeAmortizationYears === 0 &&
                  simulation.peakMortgageBalance <= OPTIMIZER_MAX_TOTAL_MORTGAGE;

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

                    if (secondUpgradeValue < OPTIMIZER_MIN_UPGRADE_VALUE) {
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

                      const feasible =
                        simulation.cashEnd > 0 &&
                        simulation.finalPropertyValue >= OPTIMIZER_MIN_END_PROPERTY_VALUE &&
                        simulation.cumulativeShortfall <= 0.01 &&
                        simulation.secondHouseFundingGap <= 0.01 &&
                        simulation.negativeAmortizationYears === 0 &&
                        simulation.peakMortgageBalance <= OPTIMIZER_MAX_TOTAL_MORTGAGE;

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

  const [mortgageRate, setMortgageRate] = useState(initialScenario?.mortgageRate ?? 6);
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
    firstMortgagePaidOffYear,
    minIsaBalance,
    finalLiquidNet: simulatedFinalLiquidNet,
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
    ? secondHouseStampDuty + SECOND_HOUSE_LEGAL_FEES
    : 0;

  const finalYear = financialData[financialData.length - 1] || {};
  const totalMortgagePayments = finalYear.totalMortgagePayments || 0;
  const finalPropertyValue = finalYear.propertyValue || 0;
  const finalIsaTotal = finalYear.isaTotal || 0;
  const finalSurplusPot = finalYear.surplusPot || 0;
  const finalMortgageBalance = finalYear.mortgageBalance || 0;
  const finalShortfall = finalYear.cumulativeShortfall || 0;
  const finalLiquidNet = financialData.length
    ? finalIsaTotal + finalSurplusPot - finalMortgageBalance - finalShortfall
    : simulatedFinalLiquidNet;

  const { caseResults: optimizerResults, searchMeta: optimizerSearchMeta } = useMemo(() => {
    if (activeTab !== 'optimizer') {
      return {
        caseResults: [],
        searchMeta: null,
      };
    }

    return runHousingOptimizer({
      baseParams: buildSimulationParams(),
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

  const precomputedOptimizerResults = useMemo(
    () => precomputedOptimizerPayload?.caseResults ?? [],
    [precomputedOptimizerPayload],
  );
  const precomputedOptimizerSearchMeta = precomputedOptimizerPayload?.searchMeta ?? null;
  const precomputedOptimizerGeneratedAt = precomputedOptimizerPayload?.generatedAt ?? '';
  const precomputedRecommendedResults = useMemo(() => (
    precomputedOptimizerResults
      .map(({ bestResult }) => bestResult)
      .filter(Boolean)
      .sort(compareOptimizerResults)
  ), [precomputedOptimizerResults]);
  const precomputedAllFeasibleResults = useMemo(() => (
    precomputedOptimizerResults
      .flatMap(({ feasibleResults = [] }) => feasibleResults)
      .sort(compareOptimizerResults)
  ), [precomputedOptimizerResults]);
  const allFeasiblePageSize = 50;
  const allFeasiblePageCount = Math.max(
    1,
    Math.ceil(precomputedAllFeasibleResults.length / allFeasiblePageSize),
  );
  const pagedFeasibleResults = useMemo(() => {
    const start = (allFeasiblePage - 1) * allFeasiblePageSize;
    return precomputedAllFeasibleResults.slice(start, start + allFeasiblePageSize);
  }, [allFeasiblePage, precomputedAllFeasibleResults]);
  useEffect(() => {
    if (allFeasiblePage > allFeasiblePageCount) {
      setAllFeasiblePage(allFeasiblePageCount);
    }
  }, [allFeasiblePage, allFeasiblePageCount]);

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

  const displayOptimizerResults = precomputedAllFeasibleResults.length
    ? precomputedAllFeasibleResults
    : optimizerRecommendedResults;
  const displayOptimizerRecommendedResults = precomputedAllFeasibleResults.length
    ? precomputedRecommendedResults
    : optimizerRecommendedResults;

  const selectedOptimizerResult = useMemo(() => {
    if (!displayOptimizerResults.length) return null;

    return displayOptimizerResults.find(
      result => getOptimizerResultKey(result) === selectedOptimizerResultKey,
    ) || displayOptimizerResults[0];
  }, [displayOptimizerResults, selectedOptimizerResultKey]);

  const handleApplyOptimizerResult = (result) => {
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

  const pieData = [
    { name: 'Mortgage Paid', value: totalMortgagePayments, color: '#f97316' },
    { name: 'Total Cash', value: Math.max(0, finalLiquidNet), color: '#8b5cf6' },
    { name: 'Property Value', value: Math.max(0, finalPropertyValue), color: '#22c55e' },
  ];

  const secondHouseValue = enableSecondHouse
    ? secondHouseValueAtMove || (initialPropertyValue + moveIncrementValue)
    : null;

  const minIsaSafe = minIsaBalance >= 60000;

  const formatCurrency = (value) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

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
    `Stamp duty and fixed legal fees (${formatCurrency(FIRST_HOUSE_LEGAL_FEES)} on the first purchase and ${formatCurrency(SECOND_HOUSE_LEGAL_FEES)} on the move) are charged as cash outflows in the relevant house-purchase year.`,
    usePrivateSchool
      ? 'Private school fees are applied in real terms between ages 11 and 18.'
      : 'Private school fees are excluded unless the toggle is turned on.',
    `Shortfalls are met from surplus savings first, then ISA, with any remaining gap tracked as a cumulative shortfall.`,
    `Surplus savings grow at the ISA real growth rate less ${cgtRatePct}% CGT on gains.`,
    `A car purchase is assumed in 2028, and gifts are assumed at age 27 (currently ${formatCurrency(kid1GiftAmount)} and ${formatCurrency(kid2GiftAmount)}).`,
    enableSecondHouse
      ? `The second house uses ISA for the deposit, adds a second mortgage in ${effectiveSecondHouseYear}, and assumes the first property is sold for stamp duty treatment.${secondHouseFundingGap > 0 ? ` The current plan is short by ${formatCurrency(secondHouseFundingGap)} on the move deposit.` : ''}`
      : 'Second house purchase is currently disabled.',
    `If the first property is below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the latest second-house year is ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}; otherwise it is ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}.`,
    `Recession years (${recessionYear}, ${secondRecessionYear}, ${thirdRecessionYear}) reduce ISA, surplus savings, and property value by ${recessionHitPct}%.`,
    enableRedundancy
      ? `Redundancy years (${redundancyYear} and ${secondRedundancyYear}) set person 1 income to zero for the full year.`
      : 'Redundancy shocks are excluded unless the toggle is turned on.',
    negativeAmortizationYears > 0
      ? `In ${negativeAmortizationYears} year(s), the mortgage budget does not cover all interest, so ${formatCurrency(capitalizedInterestTotal)} is added back onto the loan balance.`
      : 'Mortgage repayments always cover interest under the current assumptions.',
    'Mortgage repayments are budget-driven from salary percentages rather than a lender-style amortisation schedule.',
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
  const optimizerUpgradeTotalMax = optimizerSecondHouseDepositMax + optimizerSecondHouseMortgageMax;
  const optimizerUpgradeYearRuleText =
    optimizerFirstHouseTotalMax < OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD
      ? `Latest upgrade year ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}`
      : optimizerFirstHouseTotalMin >= OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD
        ? `Latest upgrade year ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}`
        : `Latest upgrade year ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX} below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, otherwise ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}`;
  const optimizerFrozenAssumptions = [
    `Starting incomes are fixed at ${formatCurrency(OPTIMIZER_STARTING_INCOME_1)} and ${formatCurrency(OPTIMIZER_STARTING_INCOME_2)}.`,
    `The first house purchase year is fixed at ${OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}.`,
    `The first-house deposit and starting ISA seed share one fixed starting cash pool of ${formatCurrency(optimizerSearchMeta?.startingCashPool ?? (initialDeposit + isaSeed))}.`,
    `The first property must be at least ${formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}, and any upgrade step must add at least ${formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} of extra property value from deposit plus mortgage.`,
    `The first-house mortgage cannot exceed ${formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)}, and total mortgage outstanding can never exceed ${formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)} at any point in the path.`,
    `If the first house total is below ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the latest upgrade year is ${OPTIMIZER_FAST_UPGRADE_YEAR_MAX}. If it is ${formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)} or above, the latest upgrade year is ${OPTIMIZER_LATE_UPGRADE_YEAR_MAX}.`,
    `Every feasible result must end with property value above ${formatCurrency(OPTIMIZER_MIN_END_PROPERTY_VALUE)} in today's money after applying the chosen real property-growth case.`,
    'The optimizer ranks plans by end net worth, defined as liquid cash plus home equity. Final property value is still used as a feasibility floor, and lifetime interest is shown separately.',
    `The optimizer now tests a 9-case matrix across income growth and correlated market growth. Each market case couples ISA and property growth together. Other planner assumptions stay frozen, including mortgage real rate ${mortgageRate}% and living-cost growth ${realGrowthCosts}%.`,
    `Base living costs, child costs, visa costs, car purchase, gifts, private school setting, recessions, redundancy years, tax drag, and pension contribution rate all stay exactly as set in the planner tab.`,
    `House purchase costs include stamp duty plus fixed legal fees of ${formatCurrency(FIRST_HOUSE_LEGAL_FEES)} on the first purchase and ${formatCurrency(SECOND_HOUSE_LEGAL_FEES)} on the move.`,
    `The optimizer still uses the same model rules shown in the planner assumptions, including stamp duty, legal fees, ISA deposit funding for the second move, and the age-${END_AGE} end point.`,
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
      </div>

      {activeTab === 'planner' ? (
        <>
      <div className="summary-grid">
        <div className="summary-card summary-accent-cyan">
          <div className="summary-label">Final Total Cash</div>
          <div className="summary-value">
            {formatCurrency(finalLiquidNet)}
          </div>
          <div className="summary-sub">
            ISA + surplus pot − outstanding mortgage
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
              <div className="chart-summary-label">Total Cash</div>
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
          <h3 className="stamp-duty-title">House Purchase Costs (England)</h3>
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
                  Property value: {formatCurrency(secondHousePurchasePrice || (initialPropertyValue + moveIncrementValue))} | Stamp duty {formatCurrency(secondHouseStampDuty)} | Legal fees {formatCurrency(SECOND_HOUSE_LEGAL_FEES)}
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
      ) : (
        <div className="chart-card">
          <h2 className="panel-title">Housing Optimizer</h2>
          <p className="helper-text">
            This tab keeps the planner assumptions fixed, resets starting income to £70k for person 1 and £90k for person 2, and searches housing choices against three real income-growth paths for corporate careers.
          </p>
          <p className="helper-text">
            This optimizer now tests a 9-case matrix: income growth 2.0% / 3.5% / 5.0%, crossed with correlated market growth cases where ISA/property move together at 2.5%/0.5%, 4.0%/1.5%, and 5.5%/2.5% in real terms.
          </p>
          <p className="helper-text">
            The first house is fixed to {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}. Housing inputs searched here are explicit deposit and mortgage ranges. House 1 value is deposit plus mortgage and must be at least {formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}. The first-house mortgage cannot exceed {formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)}. In the upgrade path, the extra deposit plus extra mortgage must be at least {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)}.
          </p>
          <p className="helper-text">
            If the first house total is below {formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the upgrade must happen by {OPTIMIZER_FAST_UPGRADE_YEAR_MAX}. Otherwise the latest upgrade year is {OPTIMIZER_LATE_UPGRADE_YEAR_MAX}. House purchase costs include stamp duty plus fixed legal fees.
          </p>
          <p className="helper-text">
            Results are only kept if liquid cash at the end stays positive, end property value stays above {formatCurrency(OPTIMIZER_MIN_END_PROPERTY_VALUE)}, there is no funding gap, cumulative shortfall, or capitalised interest, and total mortgage outstanding never goes above {formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)}. The optimizer then ranks by end net worth, defined as liquid cash plus home equity.
          </p>
          <p className="helper-text">
            Mode selected: {optimizerModeLabel}. {optimizerModeDescription}
          </p>
          <p className="helper-text">
            Search type: {optimizerSearchMeta?.isExhaustive ? 'full stepped search across every value in the active ranges' : 'sampled browser preview across the active ranges'}.
            {optimizerSearchMeta && !optimizerSearchMeta.isExhaustive
              ? ` The full stepped grid would require ${optimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations, so the browser preview only samples the range to stay responsive.`
              : optimizerSearchMeta
                ? ` The current browser run covers ${optimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations exactly.`
                : ''}
          </p>
          <p className="helper-text">
            "Tested" means the number of housing combinations the optimizer actually ran for that assumption case. "Feasible" means the subset that passed every hard rule: positive liquid cash at the end, property floor above {formatCurrency(OPTIMIZER_MIN_END_PROPERTY_VALUE)}, no funding gap, no cumulative shortfall, no capitalised interest, and mortgage balances within the caps.
          </p>

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

          <div className="assumptions-box">
            <h3 className="assumptions-title">Frozen assumptions during search</h3>
            <div className="assumptions-list">
              {optimizerFrozenAssumptions.map((assumption) => (
                <div key={assumption} className="assumption-item">
                  {assumption}
                </div>
              ))}
            </div>
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
                Deposit + mortgage, minimum required {formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}
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
                  Extra deposit + extra mortgage, minimum required {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)}
                </div>
              </div>
            )}
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">End Property Floor</div>
              <div className="summary-value">{formatCurrency(OPTIMIZER_MIN_END_PROPERTY_VALUE)}</div>
              <div className="summary-sub">
                Final property value in today&apos;s money after real property growth
              </div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Fixed Legal Fees</div>
              <div className="summary-value">
                {formatCurrency(FIRST_HOUSE_LEGAL_FEES)} / {formatCurrency(SECOND_HOUSE_LEGAL_FEES)}
              </div>
              <div className="summary-sub">
                First purchase / upgrade move, on top of stamp duty
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
                    {precomputedAllFeasibleResults.length
                      ? 'Selected full-search combination'
                      : 'Selected preview combination'}
                  </div>
                  <div className="optimizer-result-sub">
                    {precomputedAllFeasibleResults.length
                      ? 'The buttons below switch between the best combination from each income-growth and market-growth case using the terminal-side full search.'
                      : 'The buttons below switch between the best combinations from the browser-side preview for each income-growth and market-growth case.'}
                  </div>
                </div>
                <div className="optimizer-result-meta">
                  {precomputedAllFeasibleResults.length
                    ? `${precomputedAllFeasibleResults.length.toLocaleString()} feasible / ${precomputedOptimizerSearchMeta ? precomputedOptimizerSearchMeta.testedScenarioCount.toLocaleString() : '0'} tested`
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
                  <div className="summary-sub">Liquid cash plus home equity</div>
                </div>
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">Cash End</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.cashEnd)}</div>
                  <div className="summary-sub">ISA plus surplus savings</div>
                </div>
                <div className="summary-card summary-accent-green">
                  <div className="summary-label">Equity End</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.equityEnd)}</div>
                  <div className="summary-sub">Property value minus mortgage balance</div>
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
                <div>End property value: {formatCurrency(selectedOptimizerResult.finalPropertyValue)} | end mortgage balance: {formatCurrency(selectedOptimizerResult.finalPropertyValue - selectedOptimizerResult.equityEnd)}</div>
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

          {precomputedAllFeasibleResults.length > 0 && (
            <div className="optimizer-selected-card">
              <div className="optimizer-result-header">
                <div>
                  <div className="optimizer-result-title">All feasible combinations from terminal run</div>
                  <div className="optimizer-result-sub">
                    Every scenario that passed the optimizer rules across the active ranges and all income/market cases in the last terminal-side full search. These results stay fixed until the terminal precompute is run again.
                  </div>
                </div>
                <div className="optimizer-result-meta">
                  {precomputedAllFeasibleResults.length.toLocaleString()} feasible total
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
                        {overallIndex}. {result.assumptionCase.incomeCase.shortLabel} income / {result.assumptionCase.marketCase.shortLabel} market | {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | first {formatCurrency(result.firstHouseValue)} ({formatCurrency(result.initialDeposit)} deposit + {formatCurrency(result.initialMortgage)} mortgage){result.enableSecondHouse ? ` | upgrade ${result.secondHouseYear} +${formatCurrency(result.secondUpgradeValue)}` : ''} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | equity {formatCurrency(result.equityEnd)} | interest {formatCurrency(result.lifetimeInterestPaid)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimizer' && !precomputedAllFeasibleResults.length && precomputedOptimizerError && (
            <div className="optimizer-empty">
              Full terminal results could not be loaded: {precomputedOptimizerError}
            </div>
          )}

          {optimizerResultsByIncome.map(({ incomeCase, caseResults }) => (
            <div key={incomeCase.id} className="optimizer-income-section">
              <div className="optimizer-income-header">
                <div className="optimizer-result-title">{incomeCase.label}</div>
                <div className="optimizer-result-sub">
                  Real income growth {incomeCase.growth}% | {incomeCase.description}
                </div>
              </div>

              <div className="optimizer-results-grid">
                {caseResults.map(({ assumptionCase, scenariosTested, feasibleCount, bestResult, topResults }) => (
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
                            <div className="summary-sub">Liquid cash plus home equity</div>
                          </div>
                          <div className="summary-card summary-accent-cyan">
                            <div className="summary-label">Cash End</div>
                            <div className="summary-value">{formatCurrency(bestResult.cashEnd)}</div>
                            <div className="summary-sub">ISA plus surplus savings</div>
                          </div>
                          <div className="summary-card summary-accent-green">
                            <div className="summary-label">Equity End</div>
                            <div className="summary-value">{formatCurrency(bestResult.equityEnd)}</div>
                            <div className="summary-sub">Property value minus mortgage balance</div>
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
                                Preview {index + 1}: {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | equity {formatCurrency(result.equityEnd)} | interest {formatCurrency(result.lifetimeInterestPaid)}
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
                        No feasible plan found in the current search ranges.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
