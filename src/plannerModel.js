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
    description: 'Largest possible first house value, with stronger overall outcomes used as tie-breakers.',
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
const OPTIMIZER_COMBINED_STARTING_INCOME = OPTIMIZER_STARTING_INCOME_1 + OPTIMIZER_STARTING_INCOME_2;

const getDraggedThreshold = (
  threshold,
  yearsFromStart,
  taxThresholdDragPct = TAX_THRESHOLD_DRAG_PCT,
) => threshold * Math.pow(1 - taxThresholdDragPct / 100, yearsFromStart);

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const roundToStep = (value, step) => Math.round(value / step) * step;

const getInterestOnlyMortgageBudgetPct = ({
  mortgageBalance,
  mortgageRate,
  annualIncome = OPTIMIZER_COMBINED_STARTING_INCOME,
}) => {
  if (mortgageBalance <= 0 || mortgageRate <= 0 || annualIncome <= 0) {
    return 5;
  }

  const annualInterestCost = mortgageBalance * (mortgageRate / 100);
  return clampValue(Math.ceil((annualInterestCost / annualIncome) * 100), 5, 50);
};

const getDefaultOptimizerMortgagePctBounds = ({
  mortgageRate,
  firstHouseMortgageMax = OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
  laterMortgageReferenceBalance = OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
  earlyAnnualIncome = OPTIMIZER_COMBINED_STARTING_INCOME,
  laterAnnualIncome = OPTIMIZER_COMBINED_STARTING_INCOME,
}) => {
  const earlyMortgagePctMin = getInterestOnlyMortgageBudgetPct({
    mortgageBalance: firstHouseMortgageMax,
    mortgageRate,
    annualIncome: earlyAnnualIncome,
  });
  const laterMortgagePctMin = getInterestOnlyMortgageBudgetPct({
    mortgageBalance: laterMortgageReferenceBalance,
    mortgageRate,
    annualIncome: laterAnnualIncome,
  });

  return {
    earlyMortgagePctMin,
    earlyMortgagePctMax: clampValue(Math.max(23, earlyMortgagePctMin + 10), earlyMortgagePctMin, 35),
    laterMortgagePctMin,
    laterMortgagePctMax: clampValue(Math.max(20, laterMortgagePctMin + 5), laterMortgagePctMin, 50),
  };
};

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
  taxThresholdDragPct = TAX_THRESHOLD_DRAG_PCT,
) => {
  const taxableIncome = income * (1 - pensionContributionRate / 100);
  const incomeTax = calculateIncomeTax(taxableIncome, {
    personalAllowance: getDraggedThreshold(PERSONAL_ALLOWANCE, yearsFromStart, taxThresholdDragPct),
    basicRateLimit: getDraggedThreshold(BASIC_RATE_LIMIT, yearsFromStart, taxThresholdDragPct),
    additionalRateLimit: getDraggedThreshold(ADDITIONAL_RATE_LIMIT, yearsFromStart, taxThresholdDragPct),
    allowanceTaperStart: getDraggedThreshold(100000, yearsFromStart, taxThresholdDragPct),
  });
  const nationalInsurance = calculateEmployeeNationalInsurance(taxableIncome, {
    primaryThreshold: getDraggedThreshold(
      EMPLOYEE_NI_PRIMARY_THRESHOLD,
      yearsFromStart,
      taxThresholdDragPct,
    ),
    upperEarningsLimit: getDraggedThreshold(
      EMPLOYEE_NI_UPPER_EARNINGS_LIMIT,
      yearsFromStart,
      taxThresholdDragPct,
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
    taxThresholdDragPct = TAX_THRESHOLD_DRAG_PCT,
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
      taxThresholdDragPct,
    );
    const takeHome2 = calculateTakeHomePayFn(
      income2,
      yearsFromStart,
      pensionContributionRate,
      taxThresholdDragPct,
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

export {
  calculateStampDuty,
  BASE_BIRTH_YEAR,
  END_AGE,
  CAREER_GROWTH_PEAK_AGE,
  CAREER_GROWTH_END_AGE,
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
  OPTIMIZER_SAMPLE_COUNT,
  OPTIMIZER_FULL_SEARCH_LIMIT,
  OPTIMIZER_MIN_FIRST_PROPERTY_VALUE,
  OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE,
  OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF,
  OPTIMIZER_MIN_UPGRADE_VALUE,
  OPTIMIZER_MAX_UPGRADE_VALUE,
  OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
  OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
  OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
  OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD,
  OPTIMIZER_FAST_UPGRADE_YEAR_MAX,
  OPTIMIZER_LATE_UPGRADE_YEAR_MAX,
  OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  OPTIMIZER_MAX_TOTAL_MORTGAGE,
  POST_2032_SAVINGS_FLOOR_START_YEAR,
  POST_2032_MIN_TOTAL_SAVINGS,
  OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
  FIRST_HOME_SALE_AGENT_FEE_PCT,
  FIRST_HOME_SALE_LEGAL_FEES,
  OPTIMIZER_FAILURE_REASON_DEFINITIONS,
  FIRST_HOUSE_LEGAL_FEES,
  SECOND_HOUSE_LEGAL_FEES,
  OPTIMIZER_INCOME_CASES,
  OPTIMIZER_MARKET_CASES,
  OPTIMIZER_ASSUMPTION_CASES,
  OPTIMIZER_OBJECTIVE_DEFINITIONS,
  STRATEGY_APPLY_MODE_DEFINITIONS,
  TAX_YEAR_LABEL,
  TAX_THRESHOLD_DRAG_PCT,
  OPTIMIZER_COMBINED_STARTING_INCOME,
  PERSONAL_ALLOWANCE,
  BASIC_RATE_LIMIT,
  ADDITIONAL_RATE_LIMIT,
  EMPLOYEE_NI_PRIMARY_THRESHOLD,
  EMPLOYEE_NI_UPPER_EARNINGS_LIMIT,
  getDraggedThreshold,
  clampValue,
  roundToStep,
  getInterestOnlyMortgageBudgetPct,
  getDefaultOptimizerMortgagePctBounds,
  getYearPathValue,
  passesOptimizerHouseValueRule,
  buildSamplePoints,
  buildSteppedPoints,
  getMinimumFirstHouseValue,
  applyTerminalMortgagePayoff,
  createOptimizerFailureCounts,
  getOptimizerFailureKeys,
  recordOptimizerFailures,
  summarizeOptimizerFailureCounts,
  getOptimizerUpgradeYearMax,
  buildOptimizerSearchPlan,
  calculateRealTermsTakeHomePay,
  calculateIncomeTax,
  calculateEmployeeNationalInsurance,
  getCareerGrowthFactor,
  calculateCareerIncome,
  simulateFinancialPlan,
  runHousingOptimizer,
  getOptimizerResultKey,
  getOptimizerNetWorth,
  getOptimizerObjectiveDefinition,
  hasRemainingMortgageAfterPayoff,
  getOptimizerHousingEndLabel,
  getOptimizerHousingEndValue,
  getOptimizerHousingEndSub,
  getOptimizerHousingEndInlineLabel,
  compareOptimizerResultsByNetWorth,
  compareOptimizerResultsForObjective,
  compareOptimizerResults,
  compareRobustnessStrategiesForObjective,
  buildOptimizerObjectiveResults,
};
