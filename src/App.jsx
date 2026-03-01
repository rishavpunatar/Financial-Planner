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

const loadSavedPresets = () => {
  if (typeof window === 'undefined') return [];
  const storedPresets = localStorage.getItem('savedPresets');
  return storedPresets ? JSON.parse(storedPresets) : [];
};

const loadStoredScenario = () => {
  if (typeof window === 'undefined') return null;
  return loadFiltersFromURL()
    || JSON.parse(localStorage.getItem('currentScenario') || 'null');
};

const BASE_BIRTH_YEAR = 1998;
const END_AGE = 70;
const CAREER_GROWTH_PEAK_AGE = 40;
const CAREER_GROWTH_END_AGE = 55;
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

const calculateRealTermsTakeHomePay = (income, yearsFromStart) => {
  const incomeTax = calculateIncomeTax(income, {
    personalAllowance: getDraggedThreshold(PERSONAL_ALLOWANCE, yearsFromStart),
    basicRateLimit: getDraggedThreshold(BASIC_RATE_LIMIT, yearsFromStart),
    additionalRateLimit: getDraggedThreshold(ADDITIONAL_RATE_LIMIT, yearsFromStart),
    allowanceTaperStart: getDraggedThreshold(100000, yearsFromStart),
  });
  const nationalInsurance = calculateEmployeeNationalInsurance(income, {
    primaryThreshold: getDraggedThreshold(
      EMPLOYEE_NI_PRIMARY_THRESHOLD,
      yearsFromStart,
    ),
    upperEarningsLimit: getDraggedThreshold(
      EMPLOYEE_NI_UPPER_EARNINGS_LIMIT,
      yearsFromStart,
    ),
  });

  return income - incomeTax - nationalInsurance;
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

    if (year === child1BirthYear || year === child2BirthYear) {
      income2 *= 0.5;
    }

    const grossIncome = income1 + income2;
    const takeHome1 = calculateTakeHomePayFn(income1, yearsFromStart);
    const takeHome2 = calculateTakeHomePayFn(income2, yearsFromStart);
    const netBeforePension = takeHome1 + takeHome2;
    const pensionContribution = grossIncome * (pensionContributionRate / 100);
    const netIncome = Math.max(0, netBeforePension - pensionContribution);
    const totalPostTax = netIncome;

    const isRecessionYearFlag = [recessionYear, secondRecessionYear, thirdRecessionYear]
      .filter(Boolean)
      .includes(year);

    if (isRecessionYearFlag) {
      if (hasFirstHouse) {
        propertyValue *= recessionFactor;
      }
      isaTotal *= recessionFactor;
    }

    if (enableSecondHouse && year === secondHouseYear) {
      const withdrawn = Math.min(secondHouseDeposit, isaTotal);
      isaTotal -= withdrawn;
      secondMortgageBalance = secondMortgage;
      propertyValue = propertyValue + moveIncrementValue;
      secondHouseValueAtMoveLocal = propertyValue;
      secondHousePurchasePriceLocal = propertyValue;
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
    firstMortgagePaidOffYear: firstMortgagePaidOffYearLocal,
    minIsaBalance,
    finalLiquidNet,
    negativeAmortizationYears,
    capitalizedInterestTotal,
  };
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
  const [savedPresets, setSavedPresets] = useState(loadSavedPresets);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [linkCopyStatus, setLinkCopyStatus] = useState('');

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
  ]);

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;

    const preset = {
      name,
      ...currentScenario,
    };

    setSavedPresets(prev => {
      const others = prev.filter(p => p.name !== name);
      return [...others, preset];
    });
    setSelectedPreset(name);
  };

  const applyPreset = (p) => {
    const nextStartYear = p.startYear ?? 2027;
    const nextFirstHouseYear = Math.max(
      nextStartYear,
      p.firstHousePurchaseYear ?? p.startYear ?? 2027,
    );
    const nextSecondHouseYear = Math.max(
      nextFirstHouseYear + 1,
      p.secondHouseYear ?? 2037,
    );

    setMortgageRate(p.mortgageRate);
    setSalaryMortgageEarly(p.salaryMortgageEarly);
    setSalaryMortgageLater(p.salaryMortgageLater);
    setRealGrowthCosts(p.realGrowthCosts);
    setRealGrowthProperty(p.realGrowthProperty);
    setIsaGrowth(p.isaGrowth);

    setInitialMortgage(p.initialMortgage);
    setSecondMortgage(p.secondMortgage);
    setInitialDeposit(p.initialDeposit);
    setIsaSeed(p.isaSeed);
    const initialCashVal =
      p.initialCash != null ? p.initialCash : p.initialDeposit + p.isaSeed;
    setInitialCash(initialCashVal);

    setSecondHouseYear(nextSecondHouseYear);
    setSecondHouseDeposit(p.secondHouseDeposit);

    setIncome1Start(p.income1Start);
    setIncome2Start(p.income2Start);
    setIncomeGrowth(p.incomeGrowth);

    setChild1BirthYear(p.child1BirthYear);
    setChild2BirthYear(p.child2BirthYear);

    setRecessionYear(p.recessionYear);
    setSecondRecessionYear(p.secondRecessionYear);
    setThirdRecessionYear(p.thirdRecessionYear ?? thirdRecessionYear);

    setBaseLivingCost(p.baseLivingCost);
    setChild1AnnualCost(p.child1AnnualCost);
    setChild2AnnualCost(p.child2AnnualCost);
    setEmergencyFundAnnual(p.emergencyFundAnnual);
    setPensionContributionRate(p.pensionContributionRate ?? 5);

    setVisaCostPreSecondHouse(p.visaCostPreSecondHouse);
    setVisaCostAtSecondHouse(p.visaCostAtSecondHouse);

    setCarCost(p.carCost);
    setKid1GiftAmount(p.kid1GiftAmount);
    setKid2GiftAmount(p.kid2GiftAmount);
    setCombinedGiftAmount((p.kid1GiftAmount ?? 0) + (p.kid2GiftAmount ?? 0));

    setIsaContributionCap(p.isaContributionCap);
    setRecessionHitPct(p.recessionHitPct);
    setCgtRatePct(p.cgtRatePct);

    setUsePrivateSchool(!!p.usePrivateSchool);

    const depositPoolVal = p.initialDeposit + p.secondHouseDeposit;
    const mortgagePoolVal = p.initialMortgage + p.secondMortgage;
    setDepositPool(depositPoolVal);
    setMortgagePool(mortgagePoolVal);
    setLockHouseLink(!!p.lockHouseLink);

    setShowIncomeLine(p.showIncomeLine ?? true);
    setShowSurplusLine(p.showSurplusLine ?? true);
    setShowIsaLine(p.showIsaLine ?? true);
    setShowMortgageBalanceLine(p.showMortgageBalanceLine ?? true);
    setShowPieChart(p.showPieChart ?? false);
    setShowAssumptions(p.showAssumptions ?? false);
    setShowAdvanced(p.showAdvanced ?? false);

    setStartYear(nextStartYear);
    setFirstHousePurchaseYear(nextFirstHouseYear);
    setEnableSecondHouse(p.enableSecondHouse ?? true);
    setPresetName(p.presetName ?? p.name ?? '');
  };

  const handleLoadPreset = () => {
    if (!selectedPreset) return;
    const preset = savedPresets.find(p => p.name === selectedPreset);
    if (!preset) return;
    applyPreset(preset);
  };

  const handleCopyScenarioLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopyStatus('Link copied');
    } catch {
      setLinkCopyStatus('Copy failed');
    }
  };

  const handleEditPreset = (presetNameParam) => {
    const preset = savedPresets.find(p => p.name === presetNameParam);
    if (preset) {
      applyPreset(preset);
      setPresetName(preset.name);
    }
  };

  useEffect(() => {
    localStorage.setItem('savedPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  useEffect(() => {
    if (!linkCopyStatus) return undefined;

    const timeoutId = window.setTimeout(() => {
      setLinkCopyStatus('');
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [linkCopyStatus]);

  useEffect(() => {
    localStorage.setItem('currentScenario', JSON.stringify(currentScenario));
    saveFiltersToURL(currentScenario);
  }, [currentScenario]);

  const handleDeletePreset = (presetNameParam) => {
    setSavedPresets(prev => {
      const updatedPresets = prev.filter(p => p.name !== presetNameParam);
      localStorage.setItem('savedPresets', JSON.stringify(updatedPresets));
      return updatedPresets;
    });
    if (selectedPreset === presetNameParam) {
      setSelectedPreset('');
    }
  };

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
    ? formatCurrency(secondHouseValue)
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
    `Pension contributions are deducted from take-home cash at ${pensionContributionRate}%, but no pension pot or future pension income is modelled.`,
    `Partner 2 income falls by 50% in each birth year (${child1BirthYear} and ${child2BirthYear}).`,
    'Child costs start one year after birth and continue until age 21.',
    usePrivateSchool
      ? 'Private school fees are applied in real terms between ages 11 and 18.'
      : 'Private school fees are excluded unless the toggle is turned on.',
    `Shortfalls are met from surplus savings first, then ISA, with any remaining gap tracked as a cumulative shortfall.`,
    `Surplus savings grow at the ISA real growth rate less ${cgtRatePct}% CGT on gains.`,
    `A car purchase is assumed in 2028, and gifts are assumed at age 27 (currently ${formatCurrency(kid1GiftAmount)} and ${formatCurrency(kid2GiftAmount)}).`,
    enableSecondHouse
      ? `The second house uses ISA for the deposit, adds a second mortgage in ${secondHouseYear}, and assumes the first property is sold for stamp duty treatment.`
      : 'Second house purchase is currently disabled.',
    `Recession years (${recessionYear}, ${secondRecessionYear}, ${thirdRecessionYear}) reduce ISA and property value by ${recessionHitPct}%.`,
    negativeAmortizationYears > 0
      ? `In ${negativeAmortizationYears} year(s), the mortgage budget does not cover all interest, so ${formatCurrency(capitalizedInterestTotal)} is added back onto the loan balance.`
      : 'Mortgage repayments always cover interest under the current assumptions.',
    'Mortgage repayments are budget-driven from salary percentages rather than a lender-style amortisation schedule.',
  ];

  return (
    <div className="app-root">
      <h1 className="app-title">Financial Life Planner</h1>
      <p className="app-subtitle">
        Combined pre-tax income line; all figures are shown in real terms, mortgage uses a real rate, tax bands drift tighter over time, and the model ends at age {END_AGE}.
      </p>

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
            placeholder="Preset name"
          />
          <button
            type="button"
            className="preset-button"
            onClick={handleSavePreset}
          >
            Save preset
          </button>
          <select
            className="preset-select"
            value={selectedPreset}
            onChange={e => setSelectedPreset(e.target.value)}
          >
            <option value="">Load preset…</option>
            {savedPresets.map(p => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="preset-button"
            onClick={handleLoadPreset}
            disabled={!selectedPreset}
          >
            Load
          </button>
          <button
            type="button"
            className="preset-button"
            onClick={() => handleEditPreset(selectedPreset)}
            disabled={!selectedPreset}
          >
            Edit
          </button>
          <button
            type="button"
            className="preset-button"
            onClick={() => handleDeletePreset(selectedPreset)}
            disabled={!selectedPreset}
          >
            Delete
          </button>
          <button
            type="button"
            className="preset-button preset-button-secondary"
            onClick={handleCopyScenarioLink}
          >
            Copy current link
          </button>
          {linkCopyStatus && (
            <span className="helper-text helper-text-inline">{linkCopyStatus}</span>
          )}
        </div>

        <p className="helper-text">
          Save preset stores a named version only in this browser. The page URL stores the live scenario itself, so bookmarking or copying the current link will reopen the same setup on any browser, even without loading a local preset.
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
                label="Recession Hit (%) on Property & ISA"
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
            📉 {recessionYear} - Recession (-{recessionHitPct}% property & ISA)
          </span>
          <span>
            📉2 {secondRecessionYear} - Second recession
          </span>
          <span>
            📉3 {thirdRecessionYear} - Third recession
          </span>
          {firstMortgagePaidOffYear && (
            <span>✅1 {firstMortgagePaidOffYear} - First mortgage fully repaid</span>
          )}
          {mortgageRepayYear && (
            <span>✅ {mortgageRepayYear} - All mortgages fully repaid</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
