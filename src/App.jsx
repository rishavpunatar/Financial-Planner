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
const OPTIMIZER_INCOME_PROFILES = [
  {
    id: 'steady',
    label: 'Steady corporate path',
    growth: 0.5,
    description: 'Limited promotions and mainly inflation-beating progression.',
  },
  {
    id: 'progressing',
    label: 'Typical corporate path',
    growth: 1.5,
    description: 'Normal promotion cadence for experienced corporate professionals.',
  },
  {
    id: 'fast_track',
    label: 'Strong corporate path',
    growth: 2.5,
    description: 'A strong promotion path without assuming extreme career jumps.',
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

const countSecondHouseYearOptions = (
  firstHouseYears,
  secondHouseYearMin,
  secondHouseYearMax,
) =>
  firstHouseYears.reduce((count, firstHousePurchaseYear) => {
    const earliestSecondYear = Math.max(secondHouseYearMin, firstHousePurchaseYear + 1);
    if (earliestSecondYear > secondHouseYearMax) return count;

    return count + (secondHouseYearMax - earliestSecondYear + 1);
  }, 0);

const buildOptimizerSearchPlan = (searchConfig) => {
  const exactFirstHouseValues = buildSteppedPoints(
    searchConfig.firstHouseValueMin,
    searchConfig.firstHouseValueMax,
    50000,
  );
  const exactFirstHouseDepositPcts = buildSteppedPoints(
    searchConfig.firstHouseDepositPctMin,
    searchConfig.firstHouseDepositPctMax,
    5,
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
  const exactSecondUpgradeValues = buildSteppedPoints(
    searchConfig.secondUpgradeValueMin,
    searchConfig.secondUpgradeValueMax,
    50000,
  );
  const exactSecondHouseDepositPcts = buildSteppedPoints(
    searchConfig.secondHouseDepositPctMin,
    searchConfig.secondHouseDepositPctMax,
    5,
  );
  const exactSecondHouseYears = buildSteppedPoints(
    searchConfig.secondHouseYearMin,
    searchConfig.secondHouseYearMax,
    1,
  );
  const exactLaterMortgagePcts = buildSteppedPoints(
    searchConfig.laterMortgagePctMin,
    searchConfig.laterMortgagePctMax,
    1,
  );

  const exactOnePropertyCount =
    exactFirstHouseValues.length *
    exactFirstHouseDepositPcts.length *
    exactFirstHouseYears.length *
    exactEarlyMortgagePcts.length;
  const exactTwoPropertyCount =
    exactFirstHouseValues.length *
    exactFirstHouseDepositPcts.length *
    exactEarlyMortgagePcts.length *
    exactSecondUpgradeValues.length *
    exactSecondHouseDepositPcts.length *
    exactLaterMortgagePcts.length *
    countSecondHouseYearOptions(
      exactFirstHouseYears,
      searchConfig.secondHouseYearMin,
      searchConfig.secondHouseYearMax,
    );

  const propertyModes = searchConfig.propertyMode === 'both'
    ? ['one', 'two']
    : [searchConfig.propertyMode];

  const exactScenarioCount = propertyModes.reduce((count, propertyMode) => (
    count + (propertyMode === 'one' ? exactOnePropertyCount : exactTwoPropertyCount)
  ), 0);
  const isExhaustive = exactScenarioCount <= OPTIMIZER_FULL_SEARCH_LIMIT;

  return {
    propertyModes,
    isExhaustive,
    exactScenarioCount,
    firstHouseValues: isExhaustive
      ? exactFirstHouseValues
      : buildSamplePoints(searchConfig.firstHouseValueMin, searchConfig.firstHouseValueMax, 50000),
    firstHouseDepositPcts: isExhaustive
      ? exactFirstHouseDepositPcts
      : buildSamplePoints(searchConfig.firstHouseDepositPctMin, searchConfig.firstHouseDepositPctMax, 5),
    firstHouseYears: isExhaustive
      ? exactFirstHouseYears
      : buildSamplePoints(searchConfig.firstHouseYearMin, searchConfig.firstHouseYearMax, 1),
    earlyMortgagePcts: isExhaustive
      ? exactEarlyMortgagePcts
      : buildSamplePoints(searchConfig.earlyMortgagePctMin, searchConfig.earlyMortgagePctMax, 1),
    secondUpgradeValues: isExhaustive
      ? exactSecondUpgradeValues
      : buildSamplePoints(searchConfig.secondUpgradeValueMin, searchConfig.secondUpgradeValueMax, 50000),
    secondHouseDepositPcts: isExhaustive
      ? exactSecondHouseDepositPcts
      : buildSamplePoints(searchConfig.secondHouseDepositPctMin, searchConfig.secondHouseDepositPctMax, 5),
    secondHouseYears: isExhaustive
      ? exactSecondHouseYears
      : buildSamplePoints(searchConfig.secondHouseYearMin, searchConfig.secondHouseYearMax, 1),
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
      purchaseLumpSum += calculateStampDuty(initialPropertyValue, false);
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
      purchaseLumpSum += plannedSecondHouseStampDuty;
    }

    let visaCost = 0;
    if (year <= 2036) {
      visaCost = visaCostPreSecondHouse;
    } else if (enableSecondHouse && year === secondHouseYear) {
      visaCost = visaCostAtSecondHouse;
    }

    const yearlyRate = mortgageRate / 100;
    const openingMortgageBalance = firstMortgageBalance + secondMortgageBalance;
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
    };
  }

  const finalLiquidNet = finalSnapshot
    ? finalSnapshot.isaTotal +
      finalSnapshot.surplusPot -
      finalSnapshot.mortgageBalance -
      finalSnapshot.cumulativeShortfall
    : 0;

  return {
    financialData: returnFullData && data ? data : [],
    mortgageRepayYear: mortgageRepayYearLocal,
    secondHouseValueAtMove: secondHouseValueAtMoveLocal,
    secondHousePurchasePrice: secondHousePurchasePriceLocal,
    secondHouseFundingGap: secondHouseFundingGapLocal,
    firstMortgagePaidOffYear: firstMortgagePaidOffYearLocal,
    minIsaBalance,
    finalLiquidNet,
    finalPropertyValue: finalSnapshot?.propertyValue ?? 0,
    totalMortgagePayments: finalSnapshot?.totalMortgagePayments ?? 0,
    cumulativeShortfall: finalSnapshot?.cumulativeShortfall ?? 0,
    negativeAmortizationYears,
    capitalizedInterestTotal,
  };
};

const runHousingOptimizer = ({ baseParams, searchConfig }) => {
  const {
    propertyModes,
    isExhaustive,
    exactScenarioCount,
    firstHouseValues,
    firstHouseDepositPcts,
    firstHouseYears,
    earlyMortgagePcts,
    secondUpgradeValues,
    secondHouseDepositPcts,
    secondHouseYears,
    laterMortgagePcts,
  } = buildOptimizerSearchPlan(searchConfig);
  const startingCashPool = baseParams.initialDeposit + baseParams.isaSeed;

  const profileResults = OPTIMIZER_INCOME_PROFILES.map((profile) => {
    const results = [];
    let scenariosTested = 0;

    for (const currentPropertyMode of propertyModes) {
      for (const firstHouseValue of firstHouseValues) {
        for (const firstHouseDepositPct of firstHouseDepositPcts) {
          for (const firstHousePurchaseYear of firstHouseYears) {
            for (const salaryMortgageEarly of earlyMortgagePcts) {
              const initialDeposit = roundToStep(
                firstHouseValue * (firstHouseDepositPct / 100),
                10000,
              );
              const initialMortgage = Math.max(0, firstHouseValue - initialDeposit);
              const optimizerIsaSeed = Math.max(0, startingCashPool - initialDeposit);

              if (initialDeposit > startingCashPool) {
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
                  incomeGrowth: profile.growth,
                });

                const feasible =
                  simulation.finalLiquidNet > 0 &&
                  simulation.finalPropertyValue > 0 &&
                  simulation.cumulativeShortfall <= 0.01 &&
                  simulation.secondHouseFundingGap <= 0.01 &&
                  simulation.negativeAmortizationYears === 0;

                if (!feasible) continue;

                results.push({
                  incomeProfile: profile,
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
                  score:
                    simulation.finalLiquidNet +
                    simulation.finalPropertyValue -
                    simulation.totalMortgagePayments,
                  ...simulation,
                });

                continue;
              }

              for (const secondUpgradeValue of secondUpgradeValues) {
                for (const secondHouseDepositPct of secondHouseDepositPcts) {
                  for (const salaryMortgageLater of laterMortgagePcts) {
                    const secondHouseDeposit = roundToStep(
                      secondUpgradeValue * (secondHouseDepositPct / 100),
                      10000,
                    );
                    const secondMortgage = Math.max(0, secondUpgradeValue - secondHouseDeposit);
                    const validSecondHouseYears = secondHouseYears.filter(
                      secondHouseYear => secondHouseYear > firstHousePurchaseYear,
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
                        incomeGrowth: profile.growth,
                      });

                      const feasible =
                        simulation.finalLiquidNet > 0 &&
                        simulation.finalPropertyValue > 0 &&
                        simulation.cumulativeShortfall <= 0.01 &&
                        simulation.secondHouseFundingGap <= 0.01 &&
                        simulation.negativeAmortizationYears === 0;

                      if (!feasible) continue;

                      results.push({
                        incomeProfile: profile,
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
                        score:
                          simulation.finalLiquidNet +
                          simulation.finalPropertyValue -
                          simulation.totalMortgagePayments,
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

    const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, 3);

    return {
      profile,
      scenariosTested,
      feasibleCount: results.length,
      bestResult: sortedResults[0] ?? null,
      topResults: sortedResults,
    };
  });

  return {
    profileResults,
    searchMeta: {
      isExhaustive,
      exactScenarioCount,
      testedScenarioCount: profileResults.reduce(
        (count, profileResult) => count + profileResult.scenariosTested,
        0,
      ),
      startingCashPool,
    },
  };
};

const getOptimizerResultKey = (result) => [
  result.incomeProfile.id,
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

  const [optimizerPropertyMode, setOptimizerPropertyMode] = useState(
    initialScenario?.optimizerPropertyMode ?? 'both',
  );
  const [optimizerFirstHouseValueMin, setOptimizerFirstHouseValueMin] = useState(
    initialScenario?.optimizerFirstHouseValueMin
      ?? Math.max(250000, roundToStep(initialPropertyValue * 0.8, 50000)),
  );
  const [optimizerFirstHouseValueMax, setOptimizerFirstHouseValueMax] = useState(
    initialScenario?.optimizerFirstHouseValueMax
      ?? Math.max(
        Math.max(250000, roundToStep(initialPropertyValue * 0.8, 50000)),
        roundToStep(initialPropertyValue * 1.2, 50000),
      ),
  );
  const currentFirstDepositPct = Math.round((initialDeposit / Math.max(1, initialPropertyValue)) * 100);
  const [optimizerFirstHouseDepositPctMin, setOptimizerFirstHouseDepositPctMin] = useState(
    initialScenario?.optimizerFirstHouseDepositPctMin
      ?? clampValue(currentFirstDepositPct - 15, 10, 80),
  );
  const [optimizerFirstHouseDepositPctMax, setOptimizerFirstHouseDepositPctMax] = useState(
    initialScenario?.optimizerFirstHouseDepositPctMax
      ?? clampValue(currentFirstDepositPct + 15, 10, 90),
  );
  const [optimizerFirstHouseYearMin, setOptimizerFirstHouseYearMin] = useState(
    initialScenario?.optimizerFirstHouseYearMin ?? startYear,
  );
  const [optimizerFirstHouseYearMax, setOptimizerFirstHouseYearMax] = useState(
    initialScenario?.optimizerFirstHouseYearMax ?? Math.min(startYear + 10, BASE_BIRTH_YEAR + END_AGE),
  );
  const [optimizerSecondUpgradeValueMin, setOptimizerSecondUpgradeValueMin] = useState(
    initialScenario?.optimizerSecondUpgradeValueMin
      ?? Math.max(100000, roundToStep(Math.max(moveIncrementValue, 100000) * 0.75, 50000)),
  );
  const [optimizerSecondUpgradeValueMax, setOptimizerSecondUpgradeValueMax] = useState(
    initialScenario?.optimizerSecondUpgradeValueMax
      ?? Math.max(
        Math.max(100000, roundToStep(Math.max(moveIncrementValue, 100000) * 0.75, 50000)),
        roundToStep(Math.max(moveIncrementValue, 100000) * 1.25, 50000),
      ),
  );
  const currentSecondDepositPct = moveIncrementValue > 0
    ? Math.round((secondHouseDeposit / moveIncrementValue) * 100)
    : 40;
  const [optimizerSecondHouseDepositPctMin, setOptimizerSecondHouseDepositPctMin] = useState(
    initialScenario?.optimizerSecondHouseDepositPctMin
      ?? clampValue(currentSecondDepositPct - 15, 10, 80),
  );
  const [optimizerSecondHouseDepositPctMax, setOptimizerSecondHouseDepositPctMax] = useState(
    initialScenario?.optimizerSecondHouseDepositPctMax
      ?? clampValue(currentSecondDepositPct + 15, 10, 90),
  );
  const [optimizerSecondHouseYearMin, setOptimizerSecondHouseYearMin] = useState(
    initialScenario?.optimizerSecondHouseYearMin ?? Math.max(secondHouseYear - 3, startYear + 1),
  );
  const [optimizerSecondHouseYearMax, setOptimizerSecondHouseYearMax] = useState(
    initialScenario?.optimizerSecondHouseYearMax ?? Math.min(secondHouseYear + 3, BASE_BIRTH_YEAR + END_AGE),
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
    secondHouseYear,
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
    optimizerFirstHouseValueMin,
    optimizerFirstHouseValueMax,
    optimizerFirstHouseDepositPctMin,
    optimizerFirstHouseDepositPctMax,
    optimizerFirstHouseYearMin,
    optimizerFirstHouseYearMax,
    optimizerSecondUpgradeValueMin,
    optimizerSecondUpgradeValueMax,
    optimizerSecondHouseDepositPctMin,
    optimizerSecondHouseDepositPctMax,
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
    secondHouseYear,
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
    optimizerFirstHouseValueMin,
    optimizerFirstHouseValueMax,
    optimizerFirstHouseDepositPctMin,
    optimizerFirstHouseDepositPctMax,
    optimizerFirstHouseYearMin,
    optimizerFirstHouseYearMax,
    optimizerSecondUpgradeValueMin,
    optimizerSecondUpgradeValueMax,
    optimizerSecondHouseDepositPctMin,
    optimizerSecondHouseDepositPctMax,
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

  const handleSecondHouseYearChange = (value) => {
    const adjusted = Math.max(value, firstHousePurchaseYear + 1);
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

  const { profileResults: optimizerResults, searchMeta: optimizerSearchMeta } = useMemo(() => {
    if (activeTab !== 'optimizer') {
      return {
        profileResults: [],
        searchMeta: null,
      };
    }

    return runHousingOptimizer({
      baseParams: buildSimulationParams(),
      searchConfig: {
        propertyMode: optimizerPropertyMode,
        firstHouseValueMin: optimizerFirstHouseValueMin,
        firstHouseValueMax: optimizerFirstHouseValueMax,
        firstHouseDepositPctMin: optimizerFirstHouseDepositPctMin,
        firstHouseDepositPctMax: optimizerFirstHouseDepositPctMax,
        firstHouseYearMin: optimizerFirstHouseYearMin,
        firstHouseYearMax: optimizerFirstHouseYearMax,
        secondUpgradeValueMin: optimizerSecondUpgradeValueMin,
        secondUpgradeValueMax: optimizerSecondUpgradeValueMax,
        secondHouseDepositPctMin: optimizerSecondHouseDepositPctMin,
        secondHouseDepositPctMax: optimizerSecondHouseDepositPctMax,
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
    optimizerFirstHouseValueMin,
    optimizerFirstHouseValueMax,
    optimizerFirstHouseDepositPctMin,
    optimizerFirstHouseDepositPctMax,
    optimizerFirstHouseYearMin,
    optimizerFirstHouseYearMax,
    optimizerSecondUpgradeValueMin,
    optimizerSecondUpgradeValueMax,
    optimizerSecondHouseDepositPctMin,
    optimizerSecondHouseDepositPctMax,
    optimizerSecondHouseYearMin,
    optimizerSecondHouseYearMax,
    optimizerEarlyMortgagePctMin,
    optimizerEarlyMortgagePctMax,
    optimizerLaterMortgagePctMin,
    optimizerLaterMortgagePctMax,
  ]);

  const optimizerRecommendedResults = useMemo(() => {
    const seenResults = new Set();

    return optimizerResults
      .flatMap(({ topResults }) => topResults)
      .sort((left, right) => right.score - left.score)
      .filter((result) => {
        const resultKey = getOptimizerResultKey(result);
        if (seenResults.has(resultKey)) return false;
        seenResults.add(resultKey);
        return true;
      })
      .slice(0, 6);
  }, [optimizerResults]);

  const selectedOptimizerResult = useMemo(() => {
    if (!optimizerRecommendedResults.length) return null;

    return optimizerRecommendedResults.find(
      result => getOptimizerResultKey(result) === selectedOptimizerResultKey,
    ) || optimizerRecommendedResults[0];
  }, [optimizerRecommendedResults, selectedOptimizerResultKey]);

  const handleApplyOptimizerResult = (result) => {
    setIncome1Start(OPTIMIZER_STARTING_INCOME_1);
    setIncome2Start(OPTIMIZER_STARTING_INCOME_2);
    setIncomeGrowth(result.incomeProfile.growth);
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

    setPresetName(`${result.incomeProfile.label} plan`);
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

  const totalStampDuty = enableSecondHouse
    ? firstHouseStampDuty + secondHouseStampDuty
    : firstHouseStampDuty;

  const bakedInAssumptions = [
    `All values are modelled in today's money, and the mortgage rate input is treated as a real annual borrowing rate.`,
    `Net pay uses England/Wales/Northern Ireland income tax plus employee National Insurance thresholds for ${TAX_YEAR_LABEL}.`,
    `Tax and NI thresholds are assumed to shrink by ${TAX_THRESHOLD_DRAG_PCT}% a year in real terms as a smoothed fiscal-drag assumption.`,
    `Income rises by a fixed real cash increment until age ${CAREER_GROWTH_PEAK_AGE}, then that increment linearly tapers to zero by age ${CAREER_GROWTH_END_AGE}.`,
    `The model stops at age ${END_AGE}.`,
    `Pension contributions are assumed to reduce taxable pay by ${pensionContributionRate}% before tax and NI, but no pension pot or future pension income is modelled.`,
    `Partner 2 income falls by 50% in each birth year (${child1BirthYear} and ${child2BirthYear}).`,
    'Child costs start one year after birth and continue until age 21.',
    'Stamp duty is charged as a cash outflow in the relevant house-purchase year.',
    usePrivateSchool
      ? 'Private school fees are applied in real terms between ages 11 and 18.'
      : 'Private school fees are excluded unless the toggle is turned on.',
    `Shortfalls are met from surplus savings first, then ISA, with any remaining gap tracked as a cumulative shortfall.`,
    `Surplus savings grow at the ISA real growth rate less ${cgtRatePct}% CGT on gains.`,
    `A car purchase is assumed in 2028, and gifts are assumed at age 27 (currently ${formatCurrency(kid1GiftAmount)} and ${formatCurrency(kid2GiftAmount)}).`,
    enableSecondHouse
      ? `The second house uses ISA for the deposit, adds a second mortgage in ${secondHouseYear}, and assumes the first property is sold for stamp duty treatment.${secondHouseFundingGap > 0 ? ` The current plan is short by ${formatCurrency(secondHouseFundingGap)} on the move deposit.` : ''}`
      : 'Second house purchase is currently disabled.',
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
    ? 'Tests both a one-home path and a later move to a second home, then keeps whichever scores best.'
    : optimizerPropertyMode === 'one'
      ? 'Only tests scenarios where you buy one property and never move again.'
      : 'Only tests scenarios where you buy a first property and later move to a second home.';
  const showOptimizerSecondHouseControls = optimizerPropertyMode !== 'one';
  const optimizerFrozenAssumptions = [
    `Starting incomes are fixed at ${formatCurrency(OPTIMIZER_STARTING_INCOME_1)} and ${formatCurrency(OPTIMIZER_STARTING_INCOME_2)}.`,
    `The first-house deposit and starting ISA seed share one fixed starting cash pool of ${formatCurrency(optimizerSearchMeta?.startingCashPool ?? (initialDeposit + isaSeed))}.`,
    `Outside housing choices and income growth, the planner assumptions stay frozen: mortgage real rate ${mortgageRate}%, property growth ${realGrowthProperty}%, ISA growth ${isaGrowth}%, and living-cost growth ${realGrowthCosts}%.`,
    `Base living costs, child costs, visa costs, car purchase, gifts, private school setting, recessions, redundancy years, tax drag, and pension contribution rate all stay exactly as set in the planner tab.`,
    `The optimizer still uses the same model rules shown in the planner assumptions, including stamp duty, ISA deposit funding for the second move, and the age-${END_AGE} end point.`,
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
                  max={enableSecondHouse ? secondHouseYear - 1 : BASE_BIRTH_YEAR + END_AGE}
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
                  value={secondHouseYear}
                  min={firstHousePurchaseYear + 1}
                  max={BASE_BIRTH_YEAR + END_AGE}
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
          <h3 className="stamp-duty-title">Stamp Duty Land Tax (England)</h3>
          <div className="stamp-duty-row">
            <div className="stamp-duty-item">
              <div className="stamp-duty-label">First House</div>
              <div className="stamp-duty-value">{formatCurrency(firstHouseStampDuty)}</div>
              <div className="stamp-duty-details">
                Property value: {formatCurrency(initialPropertyValue)}
              </div>
            </div>
            {enableSecondHouse ? (
              <div className="stamp-duty-item">
                <div className="stamp-duty-label">Second House (assumes first sold)</div>
                <div className="stamp-duty-value">{formatCurrency(secondHouseStampDuty)}</div>
                <div className="stamp-duty-details">
                  Property value: {formatCurrency(secondHousePurchasePrice || (initialPropertyValue + moveIncrementValue))}
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
              <div className="stamp-duty-label">Total Stamp Duty</div>
              <div className="stamp-duty-value stamp-duty-total">
                {formatCurrency(totalStampDuty)}
              </div>
              <div className="stamp-duty-details">
                All purchases combined
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
          Total Stamp Duty:{' '}
          <span className="derived-highlight">
            {formatCurrency(totalStampDuty)}
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
                    <ReferenceLine x={secondHouseYear} stroke="#4ade80" strokeDasharray="3 3" label="🏠" />
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
            <span>🏠 {secondHouseYear} - Second house & extra mortgage</span>
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
            Score = final cash + final property value - lifetime mortgage paid. Results are only kept if final cash and property stay positive, with no funding gap, no cumulative shortfall, and no capitalised interest.
          </p>
          <p className="helper-text">
            Mode selected: {optimizerModeLabel}. {optimizerModeDescription}
          </p>
          <p className="helper-text">
            Search type: {optimizerSearchMeta?.isExhaustive ? 'full stepped search across every value in the active ranges' : 'sampled search across the active ranges'}.
            {!optimizerSearchMeta?.isExhaustive && optimizerSearchMeta
              ? ` The full stepped grid would require ${optimizerSearchMeta.exactScenarioCount.toLocaleString()} scenarios, so the optimizer is using a faster sampled search. Narrow the ranges if you want a true full-grid answer.`
              : ''}
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

          <div className="advanced-grid optimizer-grid">
            <RangeSlider
              label="First House Value Min"
              value={optimizerFirstHouseValueMin}
              min={200000}
              max={1500000}
              step={50000}
              onChange={setOptimizerFirstHouseValueMin}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="First House Value Max"
              value={optimizerFirstHouseValueMax}
              min={200000}
              max={1500000}
              step={50000}
              onChange={setOptimizerFirstHouseValueMax}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="First House Deposit % Range Start"
              value={optimizerFirstHouseDepositPctMin}
              min={10}
              max={90}
              step={5}
              onChange={setOptimizerFirstHouseDepositPctMin}
              formatValue={v => `${v}%`}
            />
            <RangeSlider
              label="First House Deposit % Range End"
              value={optimizerFirstHouseDepositPctMax}
              min={10}
              max={90}
              step={5}
              onChange={setOptimizerFirstHouseDepositPctMax}
              formatValue={v => `${v}%`}
            />
            <RangeSlider
              label="First House Year Min"
              value={optimizerFirstHouseYearMin}
              min={startYear}
              max={BASE_BIRTH_YEAR + END_AGE}
              step={1}
              onChange={setOptimizerFirstHouseYearMin}
              formatValue={v => v}
            />
            <RangeSlider
              label="First House Year Max"
              value={optimizerFirstHouseYearMax}
              min={startYear}
              max={BASE_BIRTH_YEAR + END_AGE}
              step={1}
              onChange={setOptimizerFirstHouseYearMax}
              formatValue={v => v}
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
                  label="Second House Upgrade Min"
                  value={optimizerSecondUpgradeValueMin}
                  min={50000}
                  max={1000000}
                  step={50000}
                  onChange={setOptimizerSecondUpgradeValueMin}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Second House Upgrade Max"
                  value={optimizerSecondUpgradeValueMax}
                  min={50000}
                  max={1000000}
                  step={50000}
                  onChange={setOptimizerSecondUpgradeValueMax}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Second House Deposit % Range Start"
                  value={optimizerSecondHouseDepositPctMin}
                  min={10}
                  max={90}
                  step={5}
                  onChange={setOptimizerSecondHouseDepositPctMin}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Second House Deposit % Range End"
                  value={optimizerSecondHouseDepositPctMax}
                  min={10}
                  max={90}
                  step={5}
                  onChange={setOptimizerSecondHouseDepositPctMax}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Second House Year Min"
                  value={optimizerSecondHouseYearMin}
                  min={startYear + 1}
                  max={BASE_BIRTH_YEAR + END_AGE}
                  step={1}
                  onChange={setOptimizerSecondHouseYearMin}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Second House Year Max"
                  value={optimizerSecondHouseYearMax}
                  min={startYear + 1}
                  max={BASE_BIRTH_YEAR + END_AGE}
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
                  <div className="optimizer-result-title">Best combinations found</div>
                  <div className="optimizer-result-sub">
                    Toggle between the strongest scenarios the optimizer found in the active search ranges.
                  </div>
                </div>
                <div className="optimizer-result-meta">
                  {optimizerSearchMeta ? optimizerSearchMeta.testedScenarioCount.toLocaleString() : '0'} tested
                </div>
              </div>

              <div className="optimizer-choice-row">
                {optimizerRecommendedResults.map((result, index) => {
                  const resultKey = getOptimizerResultKey(result);
                  return (
                    <button
                      key={resultKey}
                      type="button"
                      className={`optimizer-choice-button${resultKey === getOptimizerResultKey(selectedOptimizerResult) ? ' optimizer-choice-active' : ''}`}
                      onClick={() => setSelectedOptimizerResultKey(resultKey)}
                    >
                      #{index + 1} {result.incomeProfile.label} · {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'}
                    </button>
                  );
                })}
              </div>

              <div className="optimizer-metric-grid">
                <div className="summary-card summary-accent-cyan">
                  <div className="summary-label">Score</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.score)}</div>
                  <div className="summary-sub">Cash + property - mortgage paid</div>
                </div>
                <div className="summary-card summary-accent-green">
                  <div className="summary-label">Final Cash</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.finalLiquidNet)}</div>
                  <div className="summary-sub">Liquid net of mortgage</div>
                </div>
                <div className="summary-card summary-accent-blue">
                  <div className="summary-label">Final Property</div>
                  <div className="summary-value">{formatCurrency(selectedOptimizerResult.finalPropertyValue)}</div>
                  <div className="summary-sub">{selectedOptimizerResult.enableSecondHouse ? 'Upgrade path' : 'One-home path'}</div>
                </div>
              </div>

              <div className="optimizer-detail-list">
                <div>Income path: {selectedOptimizerResult.incomeProfile.label} | real growth {selectedOptimizerResult.incomeProfile.growth}%</div>
                <div>Starting cash split: deposit {formatCurrency(selectedOptimizerResult.initialDeposit)} | ISA seed {formatCurrency(selectedOptimizerResult.optimizerIsaSeed)}</div>
                <div>First house: {selectedOptimizerResult.firstHousePurchaseYear} | value {formatCurrency(selectedOptimizerResult.firstHouseValue)} | mortgage {formatCurrency(selectedOptimizerResult.initialMortgage)}</div>
                <div>Mortgage budget: {selectedOptimizerResult.salaryMortgageEarly}% early{selectedOptimizerResult.enableSecondHouse ? `, ${selectedOptimizerResult.salaryMortgageLater}% after the move` : ''}</div>
                {selectedOptimizerResult.enableSecondHouse ? (
                  <div>Second house: {selectedOptimizerResult.secondHouseYear} | upgrade {formatCurrency(selectedOptimizerResult.secondUpgradeValue)} | deposit {formatCurrency(selectedOptimizerResult.secondHouseDeposit)} | mortgage {formatCurrency(selectedOptimizerResult.secondMortgage)}</div>
                ) : (
                  <div>Housing path: one property only with no later move</div>
                )}
                <div>Lifetime mortgage paid: {formatCurrency(selectedOptimizerResult.totalMortgagePayments)}</div>
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

          <div className="optimizer-results-grid">
            {optimizerResults.map(({ profile, scenariosTested, feasibleCount, bestResult, topResults }) => (
              <div key={profile.id} className="optimizer-result-card">
                <div className="optimizer-result-header">
                  <div>
                    <div className="optimizer-result-title">{profile.label}</div>
                    <div className="optimizer-result-sub">
                      Real income growth {profile.growth}% | {profile.description}
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
                        <div className="summary-label">Best Score</div>
                        <div className="summary-value">{formatCurrency(bestResult.score)}</div>
                        <div className="summary-sub">Cash + property - mortgage paid</div>
                      </div>
                      <div className="summary-card summary-accent-green">
                        <div className="summary-label">Final Cash</div>
                        <div className="summary-value">{formatCurrency(bestResult.finalLiquidNet)}</div>
                        <div className="summary-sub">Liquid net of mortgage</div>
                      </div>
                      <div className="summary-card summary-accent-blue">
                        <div className="summary-label">Final Property</div>
                        <div className="summary-value">{formatCurrency(bestResult.finalPropertyValue)}</div>
                        <div className="summary-sub">{bestResult.enableSecondHouse ? 'Two-property path' : 'One-property path'}</div>
                      </div>
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
                            Option {index + 1}: {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | cash {formatCurrency(result.finalLiquidNet)} | property {formatCurrency(result.finalPropertyValue)} | mortgage {formatCurrency(result.totalMortgagePayments)}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="preset-button preset-button-secondary"
                      onClick={() => setSelectedOptimizerResultKey(getOptimizerResultKey(bestResult))}
                    >
                      View this profile's best combination
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
      )}
    </div>
  );
};

export default App;
