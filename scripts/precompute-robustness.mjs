import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appPath = path.join(repoRoot, 'src', 'App.jsx');
const optimizerPayloadPath = path.join(repoRoot, 'public', 'precomputed-optimizer-results.json');
const robustnessDir = path.join(repoRoot, 'public', 'robustness-analysis');
const tempDir = path.join(repoRoot, '.tmp');
const tempModulePath = path.join(tempDir, 'robustness-core.mjs');
const reportJsonPath = path.join(robustnessDir, 'report.json');
const reportMarkdownPath = path.join(robustnessDir, 'report.md');
const scatterOverallChartPath = path.join(robustnessDir, 'scatter-net-worth-vs-regret-overall.svg');
const scatterOneHomeChartPath = path.join(robustnessDir, 'scatter-net-worth-vs-regret-one-home.svg');
const scatterTwoHomeChartPath = path.join(robustnessDir, 'scatter-net-worth-vs-regret-two-home.svg');
const cdfOverallChartPath = path.join(robustnessDir, 'cdf-top-robust-strategies-overall.svg');
const cdfOneHomeChartPath = path.join(robustnessDir, 'cdf-top-robust-strategies-one-home.svg');
const cdfTwoHomeChartPath = path.join(robustnessDir, 'cdf-top-robust-strategies-two-home.svg');
const heatmapChartPath = path.join(robustnessDir, 'heatmap-deposit-vs-mortgage.svg');
const sensitivityChartPath = path.join(robustnessDir, 'sensitivity-medium-weight-vs-private-school.svg');

const SCENARIO_DRAWS_PER_BUCKET = 3000;
const DEFAULT_MEDIUM_WEIGHT = 0.6;
const DEFAULT_PRIVATE_SCHOOL_PROBABILITY = 0.3;
const MEDIUM_WEIGHT_GRID = [0.4, 0.5, 0.6, 0.7, 0.8];
const PRIVATE_SCHOOL_PROBABILITY_GRID = [0.1, 0.2, 0.3, 0.4, 0.5];
const TOP_STRATEGY_COUNT = 10;
const TOP_CDF_STRATEGY_COUNT = 5;
const HEATMAP_PLATEAU_THRESHOLD = 0.97;
const HEATMAP_FEASIBILITY_SLACK = 0.02;
const STRATEGY_STEP = 50000;
const DEFAULT_FIRST_HOUSE_MORTGAGE_MAX = 600000;
const DEFAULT_ROBUSTNESS_FIRST_DEPOSIT = 300000;
const DEFAULT_ROBUSTNESS_FIRST_MORTGAGE = 300000;
const DEFAULT_ROBUSTNESS_EARLY_MORTGAGE_PCT = 18;

const ROBUST_SCORE_WEIGHTS = {
  overallFeasibility: 0.6,
  privateSchoolFeasibility: 0.15,
  inverseRegretCvar: 0.15,
  meanNetWorth: 0.1,
};

const MARKET_MORTGAGE_RATE_SHIFT = {
  'market-low': 0.45,
  'market-medium': 0,
  'market-high': -0.2,
};

const appSource = await readFile(appPath, 'utf8');
const startToken = 'const calculateStampDuty';
const endToken = 'const App = () => {';
const startIndex = appSource.indexOf(startToken);
const endIndex = appSource.indexOf(endToken);

if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  throw new Error('Could not extract robustness core from src/App.jsx');
}

const moduleSource = `${appSource.slice(startIndex, endIndex)}

export {
  BASE_BIRTH_YEAR,
  END_AGE,
  OPTIMIZER_INCOME_CASES,
  OPTIMIZER_MARKET_CASES,
  OPTIMIZER_ASSUMPTION_CASES,
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
  OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
  OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
  OPTIMIZER_MAX_TOTAL_MORTGAGE,
  passesOptimizerHouseValueRule,
  calculateCareerIncome,
  calculateRealTermsTakeHomePay,
  compareOptimizerResults,
  simulateFinancialPlan,
};
`;

await mkdir(tempDir, { recursive: true });
await writeFile(tempModulePath, moduleSource);

const core = await import(`${pathToFileURL(tempModulePath).href}?ts=${Date.now()}`);

const {
  BASE_BIRTH_YEAR,
  END_AGE,
  OPTIMIZER_INCOME_CASES,
  OPTIMIZER_MARKET_CASES,
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
  OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
  OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
  OPTIMIZER_MAX_TOTAL_MORTGAGE,
  passesOptimizerHouseValueRule,
  calculateCareerIncome,
  calculateRealTermsTakeHomePay,
  compareOptimizerResults,
  simulateFinancialPlan,
} = core;

const optimizerPayload = JSON.parse(await readFile(optimizerPayloadPath, 'utf8'));
const standardOptimizerVariant = optimizerPayload.variants?.standard ?? optimizerPayload;
const privateSchoolOptimizerVariant = optimizerPayload.variants?.privateSchool ?? null;
const defaultApplyIncomeCase = OPTIMIZER_INCOME_CASES.find((caseItem) => caseItem.id === 'income-medium')
  ?? OPTIMIZER_INCOME_CASES[1]
  ?? OPTIMIZER_INCOME_CASES[0];
const defaultApplyMarketCase = OPTIMIZER_MARKET_CASES.find((caseItem) => caseItem.id === 'market-medium')
  ?? OPTIMIZER_MARKET_CASES[1]
  ?? OPTIMIZER_MARKET_CASES[0];

const startYear = standardOptimizerVariant.baseParams.startYear;
const maxYear = BASE_BIRTH_YEAR + END_AGE;
const baseStartAge = standardOptimizerVariant.baseParams.startAge ?? (startYear - BASE_BIRTH_YEAR);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const roundToStep = (value, step) => Math.round(value / step) * step;
const buildSteppedPoints = (min, max, step) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const points = [];

  for (let value = lower; value <= upper + (step / 2); value += step) {
    points.push(clamp(roundToStep(value, step), lower, upper));
  }

  return Array.from(new Set(points)).sort((left, right) => left - right);
};
const formatCurrency = (value) => {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `GBP ${(value / 1000000).toFixed(2)}m`;
  if (abs >= 1000) return `GBP ${(value / 1000).toFixed(0)}k`;
  return `GBP ${value.toFixed(0)}`;
};
const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const createRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const randomNormal = (rng) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const hashText = (value) => Array.from(value).reduce(
  (hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0,
  2166136261,
);

const getDecisionVectorKey = (result) => [
  result.enableSecondHouse ? 'two' : 'one',
  result.firstHousePurchaseYear,
  result.initialDeposit,
  result.initialMortgage,
  result.salaryMortgageEarly,
  result.salaryMortgageLater,
  result.secondHouseYear ?? 'none',
  result.secondHouseDeposit ?? 0,
  result.secondMortgage ?? 0,
].join('|');

const buildSupplementalOneHomeCandidates = () => {
  const baseParams = standardOptimizerVariant.baseParams;
  const baseInitialDeposit = Number.isFinite(baseParams.initialDeposit)
    ? baseParams.initialDeposit
    : DEFAULT_ROBUSTNESS_FIRST_DEPOSIT;
  const baseInitialMortgage = Number.isFinite(baseParams.initialMortgage)
    ? baseParams.initialMortgage
    : DEFAULT_ROBUSTNESS_FIRST_MORTGAGE;
  const baseIsaSeed = Number.isFinite(baseParams.isaSeed) ? baseParams.isaSeed : 0;
  const baseSalaryMortgageEarly = Number.isFinite(baseParams.salaryMortgageEarly)
    ? baseParams.salaryMortgageEarly
    : DEFAULT_ROBUSTNESS_EARLY_MORTGAGE_PCT;
  const startingCashPool = standardOptimizerVariant.searchMeta?.startingCashPool
    ?? (baseInitialDeposit + baseIsaSeed);
  const firstHouseDepositMin = Math.max(
    0,
    roundToStep(Math.max(baseInitialDeposit, STRATEGY_STEP) * 0.75, STRATEGY_STEP),
  );
  const firstHouseDepositMax = Math.max(
    firstHouseDepositMin,
    roundToStep(Math.max(baseInitialDeposit, STRATEGY_STEP) * 1.25, STRATEGY_STEP),
  );
  const firstHouseMortgageMin = Math.max(
    0,
    roundToStep(Math.max(baseInitialMortgage, 100000) * 0.75, STRATEGY_STEP),
  );
  const firstHouseMortgageMax = Math.max(
    firstHouseMortgageMin,
    DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
    roundToStep(Math.max(baseInitialMortgage, 100000) * 1.25, STRATEGY_STEP),
  );
  const earlyMortgagePctMin = clamp(baseSalaryMortgageEarly - 5, 5, 35);
  const earlyMortgagePctMax = clamp(baseSalaryMortgageEarly + 5, 5, 35);

  const depositPoints = buildSteppedPoints(firstHouseDepositMin, firstHouseDepositMax, STRATEGY_STEP)
    .filter((deposit) => deposit <= startingCashPool);
  const mortgagePoints = buildSteppedPoints(firstHouseMortgageMin, firstHouseMortgageMax, STRATEGY_STEP);
  const allPctPoints = buildSteppedPoints(earlyMortgagePctMin, earlyMortgagePctMax, 1);
  const pctPoints = Array.from(new Set([
    allPctPoints[0],
    allPctPoints[Math.floor(allPctPoints.length / 2)],
    allPctPoints[allPctPoints.length - 1],
  ].filter((value) => typeof value === 'number'))).sort((left, right) => left - right);

  const candidates = [];
  depositPoints.forEach((deposit1) => {
    mortgagePoints.forEach((mortgage1) => {
      pctPoints.forEach((salaryMortgageEarly) => {
        candidates.push({
          enableSecondHouse: false,
          firstHousePurchaseYear: baseParams.firstHousePurchaseYear,
          deposit1,
          mortgage1,
          buyYear1: baseParams.firstHousePurchaseYear,
          salaryMortgageEarly,
          salaryMortgageLater: salaryMortgageEarly,
          deposit2: 0,
          mortgage2: 0,
          buyYear2: null,
          optimizerIsaSeed: Math.max(0, startingCashPool - deposit1),
          firstHouseValue: deposit1 + mortgage1,
          secondUpgradeValue: 0,
          strategyOrigin: 'supplemental-one-home',
        });
      });
    });
  });

  return {
    candidates,
    grid: {
      depositPoints,
      mortgagePoints,
      salaryMortgageEarlyPoints: pctPoints,
      startingCashPool,
    },
  };
};

const collectStrategyCandidates = () => {
  const rawResults = [
    ...(standardOptimizerVariant.caseResults ?? []),
    ...((privateSchoolOptimizerVariant?.caseResults) ?? []),
  ].flatMap((caseResult) => [
    caseResult.bestResult,
    ...(caseResult.topResults ?? []),
  ].filter(Boolean));

  const strategyMap = new Map();

  rawResults.forEach((result) => {
    const key = getDecisionVectorKey(result);
    const existing = strategyMap.get(key);
    if (!existing || compareOptimizerResults(result, existing.sourceResult) < 0) {
      strategyMap.set(key, {
        sourceResult: result,
        key,
      });
    }
  });

  const supplementalOneHome = buildSupplementalOneHomeCandidates();
  supplementalOneHome.candidates.forEach((candidate) => {
    const key = getDecisionVectorKey({
      enableSecondHouse: candidate.enableSecondHouse,
      firstHousePurchaseYear: candidate.buyYear1,
      initialDeposit: candidate.deposit1,
      initialMortgage: candidate.mortgage1,
      salaryMortgageEarly: candidate.salaryMortgageEarly,
      salaryMortgageLater: candidate.salaryMortgageLater,
      secondHouseYear: candidate.buyYear2,
      secondHouseDeposit: candidate.deposit2,
      secondMortgage: candidate.mortgage2,
    });

    if (!strategyMap.has(key)) {
      strategyMap.set(key, {
        key,
        sourceResult: null,
        supplementalCandidate: candidate,
      });
    }
  });

  const strategies = Array.from(strategyMap.values())
    .map(({ sourceResult, supplementalCandidate, key }, index) => {
      if (sourceResult) {
        return {
          strategyId: `S${String(index + 1).padStart(3, '0')}`,
          key,
          enableSecondHouse: sourceResult.enableSecondHouse,
          firstHousePurchaseYear: sourceResult.firstHousePurchaseYear,
          deposit1: sourceResult.initialDeposit,
          mortgage1: sourceResult.initialMortgage,
          buyYear1: sourceResult.firstHousePurchaseYear,
          salaryMortgageEarly: sourceResult.salaryMortgageEarly,
          salaryMortgageLater: sourceResult.salaryMortgageLater,
          deposit2: sourceResult.secondHouseDeposit ?? 0,
          mortgage2: sourceResult.secondMortgage ?? 0,
          buyYear2: sourceResult.secondHouseYear ?? null,
          optimizerIsaSeed: sourceResult.optimizerIsaSeed,
          firstHouseValue: sourceResult.firstHouseValue,
          secondUpgradeValue: sourceResult.secondUpgradeValue ?? 0,
          strategyOrigin: 'optimizer-ranked',
          sourceResult,
        };
      }

      return {
        strategyId: `S${String(index + 1).padStart(3, '0')}`,
        key,
        ...supplementalCandidate,
        sourceResult: null,
      };
    })
    .sort((left, right) => {
      if (left.enableSecondHouse !== right.enableSecondHouse) {
        return Number(left.enableSecondHouse) - Number(right.enableSecondHouse);
      }
      if (left.deposit1 !== right.deposit1) return left.deposit1 - right.deposit1;
      if (left.mortgage1 !== right.mortgage1) return left.mortgage1 - right.mortgage1;
      if (left.deposit2 !== right.deposit2) return left.deposit2 - right.deposit2;
      if (left.mortgage2 !== right.mortgage2) return left.mortgage2 - right.mortgage2;
      return left.strategyId.localeCompare(right.strategyId);
    });

  return {
    strategies,
    grid: supplementalOneHome.grid,
  };
};

const buildCaseWeights = (mediumWeight) => ({
  low: (1 - mediumWeight) / 2,
  medium: mediumWeight,
  high: (1 - mediumWeight) / 2,
});

const getIncomeBucket = (incomeCaseId) => {
  if (incomeCaseId === 'income-low') return 'low';
  if (incomeCaseId === 'income-high') return 'high';
  return 'medium';
};

const getMarketBucket = (marketCaseId) => {
  if (marketCaseId === 'market-low') return 'low';
  if (marketCaseId === 'market-high') return 'high';
  return 'medium';
};

const getScenarioWeight = (scenario, mediumWeight, privateSchoolProbability) => {
  const caseWeights = buildCaseWeights(mediumWeight);
  const incomeWeight = caseWeights[getIncomeBucket(scenario.incomeCase.id)];
  const marketWeight = caseWeights[getMarketBucket(scenario.marketCase.id)];
  const schoolWeight = scenario.privateSchool
    ? privateSchoolProbability
    : (1 - privateSchoolProbability);

  return (incomeWeight * marketWeight * schoolWeight) / SCENARIO_DRAWS_PER_BUCKET;
};

const buildScenarioPaths = ({ incomeCase, marketCase, privateSchool, drawIndex }) => {
  const rng = createRng(hashText(`${incomeCase.id}|${marketCase.id}|${privateSchool}|${drawIndex}`));
  const mortgageRatePath = {};
  const isaGrowthPath = {};
  const propertyGrowthPath = {};
  const income1Path = {};
  const income2Path = {};

  let globalShock = 0;
  let isaShock = 0;
  let propertyShock = 0;
  let mortgageShock = 0;
  let incomeShock = 0;
  const discreteIncomeShockYear = rng() < 0.14
    ? Math.floor(startYear + 2 + (maxYear - startYear - 10) * rng())
    : null;
  const discreteIncomeShockSize = 0.12 + (rng() * 0.2);

  for (let year = startYear; year <= maxYear; year += 1) {
    globalShock = (0.52 * globalShock) + (randomNormal(rng) * 0.9);
    isaShock = (0.48 * isaShock) + (0.72 * globalShock) + (randomNormal(rng) * 0.7);
    propertyShock = (0.62 * propertyShock) + (0.4 * globalShock) + (randomNormal(rng) * 0.45);
    mortgageShock = (0.55 * mortgageShock) - (0.08 * globalShock) + (randomNormal(rng) * 0.35);
    incomeShock = (0.7 * incomeShock) + (0.01 * globalShock) + (randomNormal(rng) * 0.02);

    const age = baseStartAge + (year - startYear);
    const baseIncome1 = calculateCareerIncome(
      OPTIMIZER_STARTING_INCOME_1,
      incomeCase.growth,
      baseStartAge,
      age,
    );
    const baseIncome2 = calculateCareerIncome(
      OPTIMIZER_STARTING_INCOME_2,
      incomeCase.growth,
      baseStartAge,
      age,
    );

    let incomeMultiplier = clamp(1 + incomeShock, 0.78, 1.32);
    if (year === discreteIncomeShockYear) {
      incomeMultiplier *= (1 - discreteIncomeShockSize);
    }

    const income1Multiplier = clamp(incomeMultiplier + (randomNormal(rng) * 0.012), 0.65, 1.35);
    const income2Multiplier = clamp(incomeMultiplier + (randomNormal(rng) * 0.01), 0.68, 1.35);

    income1Path[year] = Math.max(0, baseIncome1 * income1Multiplier);
    income2Path[year] = Math.max(0, baseIncome2 * income2Multiplier);
    isaGrowthPath[year] = clamp(marketCase.isaGrowth + isaShock, -10, 14);
    propertyGrowthPath[year] = clamp(marketCase.propertyGrowth + (propertyShock * 0.65), -7, 8);
    mortgageRatePath[year] = clamp(
      standardOptimizerVariant.baseParams.mortgageRate
        + (MARKET_MORTGAGE_RATE_SHIFT[marketCase.id] ?? 0)
        + mortgageShock,
      0.5,
      7.5,
    );
  }

  return {
    mortgageRatePath,
    isaGrowthPath,
    propertyGrowthPath,
    income1Path,
    income2Path,
  };
};

const buildScenarioSample = () => {
  const scenarios = [];

  OPTIMIZER_INCOME_CASES.forEach((incomeCase) => {
    OPTIMIZER_MARKET_CASES.forEach((marketCase) => {
      [false, true].forEach((privateSchool) => {
        for (let drawIndex = 0; drawIndex < SCENARIO_DRAWS_PER_BUCKET; drawIndex += 1) {
          const paths = buildScenarioPaths({
            incomeCase,
            marketCase,
            privateSchool,
            drawIndex,
          });

          scenarios.push({
            scenarioId: `${incomeCase.id}__${marketCase.id}__${privateSchool ? 'school' : 'no-school'}__${drawIndex + 1}`,
            incomeCase,
            marketCase,
            privateSchool,
            drawIndex,
            ...paths,
          });
        }
      });
    });
  });

  return scenarios;
};

const normalizeMetric = (value, min, max) => {
  if (max <= min) return 1;
  return clamp((value - min) / (max - min), 0, 1);
};

const getOverallFeasible = (evaluation) => (
  evaluation.cashBufferOk
  && evaluation.canBuyHouse2IfChosen
  && evaluation.privateSchoolAffordable
  && passesOptimizerHouseValueRule(evaluation)
  && evaluation.negativeAmortizationYears === 0
  && evaluation.peakMortgageBalance <= OPTIMIZER_MAX_TOTAL_MORTGAGE
);

const simulateStrategyScenario = (strategy, scenario) => {
  const simulation = simulateFinancialPlan({
    ...standardOptimizerVariant.baseParams,
    startAge: baseStartAge,
    maxYear,
    returnFullData: false,
    enableSecondHouse: strategy.enableSecondHouse,
    firstHousePurchaseYear: strategy.buyYear1,
    secondHouseYear: strategy.enableSecondHouse ? strategy.buyYear2 : null,
    initialDeposit: strategy.deposit1,
    initialMortgage: strategy.mortgage1,
    secondHouseDeposit: strategy.enableSecondHouse ? strategy.deposit2 : 0,
    secondMortgage: strategy.enableSecondHouse ? strategy.mortgage2 : 0,
    isaSeed: strategy.optimizerIsaSeed,
    salaryMortgageEarly: strategy.salaryMortgageEarly,
    salaryMortgageLater: strategy.enableSecondHouse
      ? strategy.salaryMortgageLater
      : strategy.salaryMortgageEarly,
    income1Start: OPTIMIZER_STARTING_INCOME_1,
    income2Start: OPTIMIZER_STARTING_INCOME_2,
    incomeGrowth: scenario.incomeCase.growth,
    isaGrowth: scenario.marketCase.isaGrowth,
    realGrowthProperty: scenario.marketCase.propertyGrowth,
    mortgageRate: standardOptimizerVariant.baseParams.mortgageRate,
    usePrivateSchool: scenario.privateSchool,
    mortgageRatePath: scenario.mortgageRatePath,
    isaGrowthPath: scenario.isaGrowthPath,
    propertyGrowthPath: scenario.propertyGrowthPath,
    income1Path: scenario.income1Path,
    income2Path: scenario.income2Path,
    calculateTakeHomePayFn: calculateRealTermsTakeHomePay,
  });

  const evaluation = {
    enableSecondHouse: strategy.enableSecondHouse,
    firstHouseValue: strategy.firstHouseValue,
    secondHousePurchasePrice: simulation.secondHousePurchasePrice ?? 0,
    cashBufferOk: simulation.cashBufferOk,
    canBuyHouse2IfChosen: simulation.canBuyHouse2IfChosen,
    privateSchoolAffordable: scenario.privateSchool
      ? simulation.privateSchoolAffordable
      : true,
    negativeAmortizationYears: simulation.negativeAmortizationYears,
    peakMortgageBalance: simulation.peakMortgageBalance,
  };

  return {
    endNetWorth: simulation.netWorthEnd,
    lifetimeInterestPaid: simulation.lifetimeInterestPaid,
    cashBufferOk: simulation.cashBufferOk ? 1 : 0,
    canBuyHouse2IfChosen: simulation.canBuyHouse2IfChosen ? 1 : 0,
    privateSchoolAffordable: evaluation.privateSchoolAffordable ? 1 : 0,
    overallFeasible: getOverallFeasible(evaluation) ? 1 : 0,
  };
};

const evaluateStrategies = ({ strategies, scenarios }) => {
  const scenarioBestNetWorth = Array.from(
    { length: scenarios.length },
    () => Number.NEGATIVE_INFINITY,
  );

  const strategyOutcomes = strategies.map((strategy) => {
    const endNetWorth = new Float64Array(scenarios.length);
    const lifetimeInterestPaid = new Float64Array(scenarios.length);
    const overallFeasible = new Uint8Array(scenarios.length);
    const cashBufferOk = new Uint8Array(scenarios.length);
    const canBuyHouse2IfChosen = new Uint8Array(scenarios.length);
    const privateSchoolAffordable = new Uint8Array(scenarios.length);

    scenarios.forEach((scenario, scenarioIndex) => {
      const outcome = simulateStrategyScenario(strategy, scenario);
      endNetWorth[scenarioIndex] = outcome.endNetWorth;
      lifetimeInterestPaid[scenarioIndex] = outcome.lifetimeInterestPaid;
      overallFeasible[scenarioIndex] = outcome.overallFeasible;
      cashBufferOk[scenarioIndex] = outcome.cashBufferOk;
      canBuyHouse2IfChosen[scenarioIndex] = outcome.canBuyHouse2IfChosen;
      privateSchoolAffordable[scenarioIndex] = outcome.privateSchoolAffordable;

      if (outcome.endNetWorth > scenarioBestNetWorth[scenarioIndex]) {
        scenarioBestNetWorth[scenarioIndex] = outcome.endNetWorth;
      }
    });

    return {
      strategy,
      endNetWorth,
      lifetimeInterestPaid,
      overallFeasible,
      cashBufferOk,
      canBuyHouse2IfChosen,
      privateSchoolAffordable,
    };
  });

  return {
    strategyOutcomes,
    scenarioBestNetWorth,
  };
};

const buildScenarioWeightVector = (scenarios, mediumWeight, privateSchoolProbability) => (
  scenarios.map((scenario) => getScenarioWeight(scenario, mediumWeight, privateSchoolProbability))
);

const weightedMeanFromValues = (values, weights) => {
  let totalWeight = 0;
  let totalValue = 0;

  for (let index = 0; index < values.length; index += 1) {
    totalWeight += weights[index];
    totalValue += values[index] * weights[index];
  }

  return totalWeight > 0 ? (totalValue / totalWeight) : 0;
};

const weightedTailMeanFromValues = (values, weights, alpha, direction) => {
  let totalWeight = 0;
  for (let index = 0; index < weights.length; index += 1) {
    totalWeight += weights[index];
  }

  if (totalWeight <= 0 || alpha <= 0) return 0;

  const targetWeight = totalWeight * alpha;
  const indices = Array.from({ length: values.length }, (_, index) => index).sort((left, right) => (
    direction === 'upper'
      ? values[right] - values[left]
      : values[left] - values[right]
  ));

  let consumedWeight = 0;
  let weightedValue = 0;

  for (const index of indices) {
    if (consumedWeight >= targetWeight) break;
    const remainingWeight = targetWeight - consumedWeight;
    const usedWeight = Math.min(weights[index], remainingWeight);
    weightedValue += values[index] * usedWeight;
    consumedWeight += usedWeight;
  }

  return consumedWeight > 0 ? (weightedValue / consumedWeight) : 0;
};

const computeStrategyMetrics = ({
  strategyOutcome,
  scenarios,
  scenarioWeights,
  scenarioBestNetWorth,
}) => {
  const {
    strategy,
    endNetWorth,
    lifetimeInterestPaid,
    overallFeasible,
    cashBufferOk,
    canBuyHouse2IfChosen,
    privateSchoolAffordable,
  } = strategyOutcome;
  const regretValues = new Float64Array(endNetWorth.length);
  let overallFeasibleWeight = 0;
  let privateSchoolFeasibleWeight = 0;
  let privateSchoolWeight = 0;
  let cashBufferWeight = 0;
  let house2Weight = 0;

  for (let index = 0; index < endNetWorth.length; index += 1) {
    const weight = scenarioWeights[index];
    const scenario = scenarios[index];
    regretValues[index] = Math.max(0, scenarioBestNetWorth[index] - endNetWorth[index]);

    if (overallFeasible[index]) {
      overallFeasibleWeight += weight;
    }
    if (cashBufferOk[index]) {
      cashBufferWeight += weight;
    }
    if (canBuyHouse2IfChosen[index]) {
      house2Weight += weight;
    }

    if (scenario.privateSchool) {
      privateSchoolWeight += weight;
      if (privateSchoolAffordable[index] && overallFeasible[index]) {
        privateSchoolFeasibleWeight += weight;
      }
    }
  }

  return {
    strategyId: strategy.strategyId,
    strategy,
    weightedMeanNetWorth: weightedMeanFromValues(endNetWorth, scenarioWeights),
    weightedNetWorthCvar10: weightedTailMeanFromValues(endNetWorth, scenarioWeights, 0.1, 'lower'),
    weightedMeanLifetimeInterestPaid: weightedMeanFromValues(lifetimeInterestPaid, scenarioWeights),
    weightedMeanRegret: weightedMeanFromValues(regretValues, scenarioWeights),
    weightedRegretCvar10: weightedTailMeanFromValues(regretValues, scenarioWeights, 0.1, 'upper'),
    weightedFeasibilityProbability: overallFeasibleWeight,
    weightedCashBufferProbability: cashBufferWeight,
    weightedSecondHouseFundingProbability: house2Weight,
    weightedPrivateSchoolFeasibilityProbability: privateSchoolWeight > 0
      ? (privateSchoolFeasibleWeight / privateSchoolWeight)
      : 1,
  };
};

const computeMetricSet = ({
  strategyOutcomes,
  scenarios,
  scenarioBestNetWorth,
  mediumWeight,
  privateSchoolProbability,
}) => {
  const scenarioWeights = buildScenarioWeightVector(
    scenarios,
    mediumWeight,
    privateSchoolProbability,
  );

  const metrics = strategyOutcomes.map((strategyOutcome) => (
    computeStrategyMetrics({
      strategyOutcome,
      scenarios,
      scenarioWeights,
      scenarioBestNetWorth,
    })
  ));

  const meanMin = Math.min(...metrics.map((metric) => metric.weightedMeanNetWorth));
  const meanMax = Math.max(...metrics.map((metric) => metric.weightedMeanNetWorth));
  const regretMin = Math.min(...metrics.map((metric) => metric.weightedRegretCvar10));
  const regretMax = Math.max(...metrics.map((metric) => metric.weightedRegretCvar10));

  metrics.forEach((metric) => {
    const meanScore = normalizeMetric(metric.weightedMeanNetWorth, meanMin, meanMax);
    const inverseRegretScore = 1 - normalizeMetric(
      metric.weightedRegretCvar10,
      regretMin,
      regretMax,
    );

    metric.compositeRobustScore = (
      (metric.weightedFeasibilityProbability * ROBUST_SCORE_WEIGHTS.overallFeasibility)
      + (metric.weightedPrivateSchoolFeasibilityProbability * ROBUST_SCORE_WEIGHTS.privateSchoolFeasibility)
      + (inverseRegretScore * ROBUST_SCORE_WEIGHTS.inverseRegretCvar)
      + (meanScore * ROBUST_SCORE_WEIGHTS.meanNetWorth)
    ) * 100;
  });

  metrics.sort((left, right) => {
    if (right.compositeRobustScore !== left.compositeRobustScore) {
      return right.compositeRobustScore - left.compositeRobustScore;
    }
    if (right.weightedFeasibilityProbability !== left.weightedFeasibilityProbability) {
      return right.weightedFeasibilityProbability - left.weightedFeasibilityProbability;
    }
    if (left.weightedRegretCvar10 !== right.weightedRegretCvar10) {
      return left.weightedRegretCvar10 - right.weightedRegretCvar10;
    }
    return right.weightedMeanNetWorth - left.weightedMeanNetWorth;
  });

  return metrics;
};

const buildParetoFrontier = (metrics) => (
  metrics
    .filter((candidate) => !metrics.some((other) => (
      other.strategyId !== candidate.strategyId
      && other.weightedMeanNetWorth >= candidate.weightedMeanNetWorth
      && other.weightedRegretCvar10 <= candidate.weightedRegretCvar10
      && (
        other.weightedMeanNetWorth > candidate.weightedMeanNetWorth
        || other.weightedRegretCvar10 < candidate.weightedRegretCvar10
      )
    )))
    .sort((left, right) => left.weightedMeanNetWorth - right.weightedMeanNetWorth)
);

const buildHeatmapCells = ({ metrics, depositGrid, mortgageGrid }) => {
  const cellMap = new Map();

  metrics.forEach((metric) => {
    const cellKey = `${metric.strategy.deposit1}|${metric.strategy.mortgage1}`;
    const existing = cellMap.get(cellKey);
    if (!existing || metric.compositeRobustScore > existing.compositeRobustScore) {
      cellMap.set(cellKey, {
        deposit1: metric.strategy.deposit1,
        mortgage1: metric.strategy.mortgage1,
        strategyId: metric.strategyId,
        compositeRobustScore: metric.compositeRobustScore,
        weightedFeasibilityProbability: metric.weightedFeasibilityProbability,
        weightedMeanNetWorth: metric.weightedMeanNetWorth,
        weightedRegretCvar10: metric.weightedRegretCvar10,
      });
    }
  });

  const populatedCells = Array.from(cellMap.values());
  const bestScore = Math.max(...populatedCells.map((cell) => cell.compositeRobustScore));
  const bestFeasibility = Math.max(...populatedCells.map((cell) => cell.weightedFeasibilityProbability));

  populatedCells.forEach((cell) => {
    cell.isPlateau = (
      cell.compositeRobustScore >= bestScore * HEATMAP_PLATEAU_THRESHOLD
      && cell.weightedFeasibilityProbability >= bestFeasibility - HEATMAP_FEASIBILITY_SLACK
    );
  });

  const cells = [];
  depositGrid.forEach((deposit1) => {
    mortgageGrid.forEach((mortgage1) => {
      const cellKey = `${deposit1}|${mortgage1}`;
      const populatedCell = cellMap.get(cellKey);
      if (populatedCell) {
        cells.push(populatedCell);
      } else {
        cells.push({
          deposit1,
          mortgage1,
          strategyId: null,
          compositeRobustScore: null,
          weightedFeasibilityProbability: null,
          weightedMeanNetWorth: null,
          weightedRegretCvar10: null,
          isPlateau: false,
        });
      }
    });
  });

  return cells.sort((left, right) => {
    if (left.deposit1 !== right.deposit1) return left.deposit1 - right.deposit1;
    return left.mortgage1 - right.mortgage1;
  });
};

const summarizePlateauRegion = (cells, metricsById) => {
  const populatedCells = cells.filter((cell) => cell.strategyId);
  if (!populatedCells.length) {
    return {
      plateauCellCount: 0,
      deposit1Min: 0,
      deposit1Max: 0,
      mortgage1Min: 0,
      mortgage1Max: 0,
      twoHomeShare: 0,
    };
  }
  const plateauCells = populatedCells.filter((cell) => cell.isPlateau);
  const cellsToUse = plateauCells.length > 0 ? plateauCells : [populatedCells[0]];
  const depositValues = cellsToUse.map((cell) => cell.deposit1);
  const mortgageValues = cellsToUse.map((cell) => cell.mortgage1);
  const strategies = cellsToUse
    .map((cell) => metricsById.get(cell.strategyId))
    .filter(Boolean);
  const twoHomeShare = strategies.length
    ? strategies.filter((metric) => metric.strategy.enableSecondHouse).length / strategies.length
    : 0;

  return {
    plateauCellCount: cellsToUse.length,
    deposit1Min: Math.min(...depositValues),
    deposit1Max: Math.max(...depositValues),
    mortgage1Min: Math.min(...mortgageValues),
    mortgage1Max: Math.max(...mortgageValues),
    twoHomeShare,
  };
};

const buildSensitivityGrid = ({
  strategyOutcomes,
  scenarios,
  scenarioBestNetWorth,
}) => {
  const cells = [];

  MEDIUM_WEIGHT_GRID.forEach((mediumWeight) => {
    PRIVATE_SCHOOL_PROBABILITY_GRID.forEach((privateSchoolProbability) => {
      const metrics = computeMetricSet({
        strategyOutcomes,
        scenarios,
        scenarioBestNetWorth,
        mediumWeight,
        privateSchoolProbability,
      });

      const winner = metrics[0];
      cells.push({
        mediumWeight,
        privateSchoolProbability,
        strategyId: winner.strategyId,
        compositeRobustScore: winner.compositeRobustScore,
        weightedFeasibilityProbability: winner.weightedFeasibilityProbability,
        weightedMeanNetWorth: winner.weightedMeanNetWorth,
      });
    });
  });

  return cells;
};

const colorScale = (value, min, max, lightColor, darkColor) => {
  const t = clamp(normalizeMetric(value, min, max), 0, 1);
  const parseHex = (hex) => hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16));
  const [r1, g1, b1] = parseHex(lightColor);
  const [r2, g2, b2] = parseHex(darkColor);
  const r = Math.round(r1 + ((r2 - r1) * t));
  const g = Math.round(g1 + ((g2 - g1) * t));
  const b = Math.round(b1 + ((b2 - b1) * t));
  return `rgb(${r}, ${g}, ${b})`;
};

const buildEmptyChartSvg = ({ title, subtitle, message }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
  <rect width="960" height="560" fill="#ffffff"/>
  <text x="72" y="32" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="72" y="52" font-size="12" font-family="Arial, sans-serif" fill="#475569">${escapeXml(subtitle)}</text>
  <rect x="72" y="92" width="816" height="392" rx="18" fill="#f8fafc" stroke="#dbe4ee"/>
  <text x="480" y="298" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#334155">${escapeXml(message)}</text>
</svg>`;

const buildScatterSvg = ({
  metrics,
  frontier,
  topStrategies,
  title,
  subtitle,
}) => {
  if (!metrics.length) {
    return buildEmptyChartSvg({
      title,
      subtitle,
      message: 'No strategies were available for this path view.',
    });
  }

  const width = 960;
  const height = 560;
  const padding = { top: 40, right: 40, bottom: 70, left: 90 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const netWorthValues = metrics.map((metric) => metric.weightedMeanNetWorth);
  const regretValues = metrics.map((metric) => metric.weightedRegretCvar10);
  const minNetWorth = Math.min(...netWorthValues);
  const maxNetWorth = Math.max(...netWorthValues);
  const minRegret = Math.min(...regretValues);
  const maxRegret = Math.max(...regretValues);

  const scaleX = (value) => padding.left + ((value - minNetWorth) / Math.max(1, maxNetWorth - minNetWorth)) * plotWidth;
  const scaleY = (value) => padding.top + plotHeight - ((value - minRegret) / Math.max(1, maxRegret - minRegret)) * plotHeight;

  const topIds = new Set(topStrategies.map((metric) => metric.strategyId));
  const frontierPath = frontier.map((metric) => `${scaleX(metric.weightedMeanNetWorth)},${scaleY(metric.weightedRegretCvar10)}`).join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${padding.left}" y="24" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="${padding.left}" y="44" font-size="12" font-family="Arial, sans-serif" fill="#475569">${escapeXml(subtitle)}</text>
  <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight}" stroke="#94a3b8"/>
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotHeight}" stroke="#94a3b8"/>
  ${[0, 0.25, 0.5, 0.75, 1].map((tick) => {
    const xValue = minNetWorth + ((maxNetWorth - minNetWorth) * tick);
    const x = scaleX(xValue);
    const yValue = minRegret + ((maxRegret - minRegret) * tick);
    const y = scaleY(yValue);
    return `
      <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotHeight}" stroke="#e2e8f0" stroke-dasharray="4 4"/>
      <line x1="${padding.left}" y1="${y}" x2="${padding.left + plotWidth}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="4 4"/>
      <text x="${x}" y="${padding.top + plotHeight + 22}" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" fill="#64748b">${escapeXml(formatCurrency(xValue))}</text>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-family="Arial, sans-serif" fill="#64748b">${escapeXml(formatCurrency(yValue))}</text>
    `;
  }).join('')}
  <polyline points="${frontierPath}" fill="none" stroke="#0f766e" stroke-width="2.5"/>
  ${metrics.map((metric) => {
    const x = scaleX(metric.weightedMeanNetWorth);
    const y = scaleY(metric.weightedRegretCvar10);
    const color = metric.strategy.enableSecondHouse ? '#2563eb' : '#0f766e';
    const radius = topIds.has(metric.strategyId) ? 5 : 3;
    const label = topIds.has(metric.strategyId)
      ? `<text x="${x + 8}" y="${y - 8}" font-size="11" font-family="Arial, sans-serif" fill="#0f172a">${metric.strategyId}</text>`
      : '';
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${topIds.has(metric.strategyId) ? 0.95 : 0.55}"/>${label}`;
  }).join('')}
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">Weighted mean end net worth</text>
  <text x="18" y="${height / 2}" transform="rotate(-90 18 ${height / 2})" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">Weighted 10% CVaR regret</text>
  <rect x="${width - 220}" y="${padding.top}" width="180" height="56" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
  <circle cx="${width - 200}" cy="${padding.top + 20}" r="5" fill="#0f766e"/>
  <text x="${width - 188}" y="${padding.top + 24}" font-size="11" font-family="Arial, sans-serif" fill="#334155">One-home path</text>
  <circle cx="${width - 200}" cy="${padding.top + 40}" r="5" fill="#2563eb"/>
  <text x="${width - 188}" y="${padding.top + 44}" font-size="11" font-family="Arial, sans-serif" fill="#334155">Two-home path</text>
</svg>`;
};

const buildCdfSvg = ({
  topStrategies,
  outcomesByStrategyId,
  defaultWeights,
  title,
  subtitle,
}) => {
  if (!topStrategies.length) {
    return buildEmptyChartSvg({
      title,
      subtitle,
      message: 'No strategies were available for this path view.',
    });
  }

  const width = 960;
  const height = 560;
  const padding = { top: 40, right: 40, bottom: 70, left: 90 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const distributions = topStrategies.map((metric, index) => {
    const outcomes = outcomesByStrategyId.get(metric.strategyId);
    const pairs = Array.from({ length: outcomes.endNetWorth.length }, (_, scenarioIndex) => ({
      value: outcomes.endNetWorth[scenarioIndex],
      weight: defaultWeights[scenarioIndex],
    })).sort((left, right) => left.value - right.value);

    let cumulative = 0;
    return {
      strategyId: metric.strategyId,
      color: ['#0f766e', '#2563eb', '#f97316', '#9333ea', '#dc2626'][index],
      points: pairs.map((pair) => {
        cumulative += pair.weight;
        return {
          x: pair.value,
          y: cumulative,
        };
      }),
    };
  });

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  distributions.forEach((distribution) => {
    distribution.points.forEach((point) => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
    });
  });
  const scaleX = (value) => padding.left + ((value - minX) / Math.max(1, maxX - minX)) * plotWidth;
  const scaleY = (value) => padding.top + plotHeight - (value * plotHeight);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${padding.left}" y="24" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="${padding.left}" y="44" font-size="12" font-family="Arial, sans-serif" fill="#475569">${escapeXml(subtitle)}</text>
  <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight}" stroke="#94a3b8"/>
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotHeight}" stroke="#94a3b8"/>
  ${[0, 0.25, 0.5, 0.75, 1].map((tick) => {
    const xValue = minX + ((maxX - minX) * tick);
    const x = scaleX(xValue);
    const y = scaleY(tick);
    return `
      <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotHeight}" stroke="#e2e8f0" stroke-dasharray="4 4"/>
      <line x1="${padding.left}" y1="${y}" x2="${padding.left + plotWidth}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="4 4"/>
      <text x="${x}" y="${padding.top + plotHeight + 22}" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" fill="#64748b">${escapeXml(formatCurrency(xValue))}</text>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-family="Arial, sans-serif" fill="#64748b">${escapeXml(formatPercent(tick, 0))}</text>
    `;
  }).join('')}
  ${distributions.map((distribution) => {
    const points = distribution.points.map((point) => `${scaleX(point.x)},${scaleY(point.y)}`).join(' ');
    return `<polyline points="${points}" fill="none" stroke="${distribution.color}" stroke-width="2.5"/>`;
  }).join('')}
  ${distributions.map((distribution, index) => `
    <line x1="${width - 210}" y1="${padding.top + (index * 22)}" x2="${width - 190}" y2="${padding.top + (index * 22)}" stroke="${distribution.color}" stroke-width="3"/>
    <text x="${width - 184}" y="${padding.top + 4 + (index * 22)}" font-size="11" font-family="Arial, sans-serif" fill="#334155">${distribution.strategyId}</text>
  `).join('')}
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">End net worth</text>
  <text x="18" y="${height / 2}" transform="rotate(-90 18 ${height / 2})" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">Weighted cumulative probability</text>
</svg>`;
};

const buildHeatmapSvg = ({ cells }) => {
  const width = 960;
  const height = 620;
  const padding = { top: 70, right: 40, bottom: 90, left: 120 };
  const deposits = Array.from(new Set(cells.map((cell) => cell.deposit1))).sort((a, b) => a - b);
  const mortgages = Array.from(new Set(cells.map((cell) => cell.mortgage1))).sort((a, b) => b - a);
  const cellWidth = Math.max(60, (width - padding.left - padding.right) / Math.max(1, deposits.length));
  const cellHeight = Math.max(38, (height - padding.top - padding.bottom) / Math.max(1, mortgages.length));
  const populatedCells = cells.filter((cell) => typeof cell.compositeRobustScore === 'number');
  if (!populatedCells.length) {
    return buildEmptyChartSvg({
      title: 'Robust Score Plateau by First Deposit vs First Mortgage',
      subtitle: 'No populated heatmap cells were available for the current robustness candidate set.',
      message: 'No sampled strategies landed inside the plotted first-deposit / first-mortgage grid.',
    });
  }
  const minScore = Math.min(...populatedCells.map((cell) => cell.compositeRobustScore));
  const maxScore = Math.max(...populatedCells.map((cell) => cell.compositeRobustScore));

  const getX = (deposit) => padding.left + (deposits.indexOf(deposit) * cellWidth);
  const getY = (mortgage) => padding.top + (mortgages.indexOf(mortgage) * cellHeight);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${padding.left}" y="28" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">Robust Score Plateau by First Deposit vs First Mortgage</text>
  <text x="${padding.left}" y="48" font-size="12" font-family="Arial, sans-serif" fill="#475569">Each cell shows the best strategy available for that starting deposit and mortgage pair. Grey cells mean that pair was in the overall search range but not included in the robustness candidate set. Bold outline marks the plateau region.</text>
  ${cells.map((cell) => {
    const x = getX(cell.deposit1);
    const y = getY(cell.mortgage1);
    const fill = typeof cell.compositeRobustScore === 'number'
      ? colorScale(cell.compositeRobustScore, minScore, maxScore, 'e0f2fe', '0f766e')
      : '#e5e7eb';
    return `
      <rect x="${x}" y="${y}" width="${cellWidth - 4}" height="${cellHeight - 4}" rx="8" fill="${fill}" stroke="${cell.isPlateau ? '#0f172a' : '#ffffff'}" stroke-width="${cell.isPlateau ? 2.5 : 1}"/>
      <text x="${x + 8}" y="${y + 18}" font-size="11" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${cell.strategyId ?? '—'}</text>
      <text x="${x + 8}" y="${y + 33}" font-size="10" font-family="Arial, sans-serif" fill="#0f172a">${typeof cell.compositeRobustScore === 'number' ? cell.compositeRobustScore.toFixed(1) : 'Not sampled'}</text>
    `;
  }).join('')}
  ${deposits.map((deposit) => `
    <text x="${getX(deposit) + (cellWidth / 2)}" y="${height - 46}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#334155">${escapeXml(formatCurrency(deposit))}</text>
  `).join('')}
  ${mortgages.map((mortgage) => `
    <text x="${padding.left - 12}" y="${getY(mortgage) + (cellHeight / 2) + 4}" text-anchor="end" font-size="10" font-family="Arial, sans-serif" fill="#334155">${escapeXml(formatCurrency(mortgage))}</text>
  `).join('')}
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">First deposit</text>
  <text x="22" y="${height / 2}" transform="rotate(-90 22 ${height / 2})" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">First mortgage</text>
</svg>`;
};

const buildSensitivitySvg = ({ cells }) => {
  const width = 940;
  const height = 520;
  const padding = { top: 70, right: 40, bottom: 90, left: 120 };
  const cellWidth = (width - padding.left - padding.right) / PRIVATE_SCHOOL_PROBABILITY_GRID.length;
  const cellHeight = (height - padding.top - padding.bottom) / MEDIUM_WEIGHT_GRID.length;
  const uniqueWinners = Array.from(new Set(cells.map((cell) => cell.strategyId)));
  const palette = ['#0f766e', '#2563eb', '#f97316', '#9333ea', '#dc2626', '#0891b2', '#65a30d', '#be123c'];
  const colorByStrategy = Object.fromEntries(
    uniqueWinners.map((strategyId, index) => [strategyId, palette[index % palette.length]]),
  );

  const getX = (schoolProb) => padding.left + (PRIVATE_SCHOOL_PROBABILITY_GRID.indexOf(schoolProb) * cellWidth);
  const getY = (mediumWeight) => padding.top + (MEDIUM_WEIGHT_GRID.indexOf(mediumWeight) * cellHeight);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${padding.left}" y="28" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">Sensitivity of the Top Robust Strategy</text>
  <text x="${padding.left}" y="48" font-size="12" font-family="Arial, sans-serif" fill="#475569">This shows which strategy wins as the medium-case weight and private-school probability change.</text>
  ${cells.map((cell) => {
    const x = getX(cell.privateSchoolProbability);
    const y = getY(cell.mediumWeight);
    const fill = colorByStrategy[cell.strategyId];
    return `
      <rect x="${x}" y="${y}" width="${cellWidth - 4}" height="${cellHeight - 4}" rx="8" fill="${fill}" opacity="0.88"/>
      <text x="${x + 10}" y="${y + 22}" font-size="12" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${cell.strategyId}</text>
      <text x="${x + 10}" y="${y + 39}" font-size="10" font-family="Arial, sans-serif" fill="#ffffff">${cell.compositeRobustScore.toFixed(1)}</text>
    `;
  }).join('')}
  ${PRIVATE_SCHOOL_PROBABILITY_GRID.map((probability) => `
    <text x="${getX(probability) + (cellWidth / 2)}" y="${height - 44}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#334155">${escapeXml(formatPercent(probability, 0))}</text>
  `).join('')}
  ${MEDIUM_WEIGHT_GRID.map((mediumWeight) => `
    <text x="${padding.left - 12}" y="${getY(mediumWeight) + (cellHeight / 2) + 4}" text-anchor="end" font-size="10" font-family="Arial, sans-serif" fill="#334155">${escapeXml(formatPercent(mediumWeight, 0))}</text>
  `).join('')}
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">Private-school probability</text>
  <text x="24" y="${height / 2}" transform="rotate(-90 24 ${height / 2})" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#334155">Medium-case weight</text>
</svg>`;
};

const buildMarkdownTable = ({ headers, rows }) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.join(' | ')} |`),
].join('\n');

const serializeStrategyMetric = (metric, rank = null) => ({
  ...(typeof rank === 'number' ? { rank } : {}),
  strategyId: metric.strategyId,
  pathType: metric.strategy.enableSecondHouse ? 'Two-home path' : 'One-home path',
  strategyOrigin: metric.strategy.strategyOrigin,
  decisionVector: {
    deposit1: metric.strategy.deposit1,
    mortgage1: metric.strategy.mortgage1,
    buyYear1: metric.strategy.buyYear1,
    deposit2: metric.strategy.deposit2,
    mortgage2: metric.strategy.mortgage2,
    buyYear2: metric.strategy.buyYear2,
    salaryMortgageEarly: metric.strategy.salaryMortgageEarly,
    salaryMortgageLater: metric.strategy.salaryMortgageLater,
    optimizerIsaSeed: metric.strategy.optimizerIsaSeed,
  },
  metrics: {
    compositeRobustScore: metric.compositeRobustScore,
    expectedEndNetWorth: metric.weightedMeanNetWorth,
    endNetWorthCvar10: metric.weightedNetWorthCvar10,
    expectedLifetimeInterest: metric.weightedMeanLifetimeInterestPaid,
    expectedRegret: metric.weightedMeanRegret,
    regretCvar10: metric.weightedRegretCvar10,
    feasibilityProbability: metric.weightedFeasibilityProbability,
    privateSchoolFeasibilityProbability: metric.weightedPrivateSchoolFeasibilityProbability,
    cashBufferProbability: metric.weightedCashBufferProbability,
    secondHouseFundingProbability: metric.weightedSecondHouseFundingProbability,
    firstHouseValue: metric.strategy.firstHouseValue,
    secondHousePurchaseValueRule: metric.strategy.enableSecondHouse
      ? OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE
      : OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
  },
});

const { strategies, grid: strategyGrid } = collectStrategyCandidates();
const scenarios = buildScenarioSample();
const { strategyOutcomes, scenarioBestNetWorth } = evaluateStrategies({
  strategies,
  scenarios,
});

const defaultScenarioWeights = buildScenarioWeightVector(
  scenarios,
  DEFAULT_MEDIUM_WEIGHT,
  DEFAULT_PRIVATE_SCHOOL_PROBABILITY,
);

const metrics = computeMetricSet({
  strategyOutcomes,
  scenarios,
  scenarioBestNetWorth,
  mediumWeight: DEFAULT_MEDIUM_WEIGHT,
  privateSchoolProbability: DEFAULT_PRIVATE_SCHOOL_PROBABILITY,
});

const metricsById = new Map(metrics.map((metric) => [metric.strategyId, metric]));
const outcomesByStrategyId = new Map(
  strategyOutcomes.map((strategyOutcome) => [strategyOutcome.strategy.strategyId, strategyOutcome]),
);
const paretoFrontier = buildParetoFrontier(metrics);
const topStrategies = metrics.slice(0, TOP_STRATEGY_COUNT);
const topCdfStrategies = topStrategies.slice(0, TOP_CDF_STRATEGY_COUNT);
const oneHomeMetrics = metrics.filter((metric) => !metric.strategy.enableSecondHouse);
const twoHomeMetrics = metrics.filter((metric) => metric.strategy.enableSecondHouse);
const topOneHomeStrategies = oneHomeMetrics.slice(0, TOP_CDF_STRATEGY_COUNT);
const topTwoHomeStrategies = twoHomeMetrics.slice(0, TOP_CDF_STRATEGY_COUNT);
const oneHomeFrontier = buildParetoFrontier(oneHomeMetrics);
const twoHomeFrontier = buildParetoFrontier(twoHomeMetrics);
const heatmapCells = buildHeatmapCells({
  metrics,
  depositGrid: strategyGrid.depositPoints,
  mortgageGrid: strategyGrid.mortgagePoints,
});
const plateauRegion = summarizePlateauRegion(heatmapCells, metricsById);
const sensitivityGrid = buildSensitivityGrid({
  strategyOutcomes,
  scenarios,
  scenarioBestNetWorth,
});

const scatterOverallSvg = buildScatterSvg({
  metrics,
  frontier: paretoFrontier,
  topStrategies,
  title: 'Expected End Net Worth vs 10% CVaR Regret',
  subtitle: 'All sampled strategies. Further right is better expected wealth; lower is better downside regret.',
});
const cdfOverallSvg = buildCdfSvg({
  topStrategies: topCdfStrategies,
  outcomesByStrategyId,
  defaultWeights: defaultScenarioWeights,
  title: 'CDF of End Net Worth for Top Robust Strategies',
  subtitle: 'All sampled strategies. Further right means higher end net worth across the distribution.',
});
const scatterOneHomeSvg = buildScatterSvg({
  metrics: oneHomeMetrics,
  frontier: oneHomeFrontier,
  topStrategies: topOneHomeStrategies,
  title: 'Expected End Net Worth vs 10% CVaR Regret',
  subtitle: 'One-home paths only. This isolates keep-one-home strategies from the upgrade paths.',
});
const cdfOneHomeSvg = buildCdfSvg({
  topStrategies: topOneHomeStrategies,
  outcomesByStrategyId,
  defaultWeights: defaultScenarioWeights,
  title: 'CDF of End Net Worth for Top One-home Strategies',
  subtitle: 'One-home paths only. Each line is one of the strongest keep-one-home strategies.',
});
const scatterTwoHomeSvg = buildScatterSvg({
  metrics: twoHomeMetrics,
  frontier: twoHomeFrontier,
  topStrategies: topTwoHomeStrategies,
  title: 'Expected End Net Worth vs 10% CVaR Regret',
  subtitle: 'Two-home paths only. This isolates buy-then-upgrade strategies from the one-home set.',
});
const cdfTwoHomeSvg = buildCdfSvg({
  topStrategies: topTwoHomeStrategies,
  outcomesByStrategyId,
  defaultWeights: defaultScenarioWeights,
  title: 'CDF of End Net Worth for Top Two-home Strategies',
  subtitle: 'Two-home paths only. Each line is one of the strongest upgrade-path strategies.',
});
const heatmapSvg = buildHeatmapSvg({ cells: heatmapCells });
const sensitivitySvg = buildSensitivitySvg({ cells: sensitivityGrid });

const strategyPathCounts = strategies.reduce((counts, strategy) => {
  const key = strategy.enableSecondHouse ? 'twoHome' : 'oneHome';
  counts[key] += 1;
  return counts;
}, { oneHome: 0, twoHome: 0 });

const strategyOriginCounts = strategies.reduce((counts, strategy) => {
  const key = strategy.strategyOrigin ?? 'unknown';
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});

const recommendation = {
  headline: `A robust starting region is first deposit ${formatCurrency(plateauRegion.deposit1Min)} to ${formatCurrency(plateauRegion.deposit1Max)} and first mortgage ${formatCurrency(plateauRegion.mortgage1Min)} to ${formatCurrency(plateauRegion.mortgage1Max)}.`,
  plateauRegion,
  notes: [
    `The plateau contains ${plateauRegion.plateauCellCount} first-house starting cells that are within ${(HEATMAP_PLATEAU_THRESHOLD * 100).toFixed(0)}% of the best robust score and within ${(HEATMAP_FEASIBILITY_SLACK * 100).toFixed(0)} percentage points of the best feasibility rate.`,
    `${formatPercent(plateauRegion.twoHomeShare, 0)} of the plateau cells resolve to a two-home path rather than a one-home path.`,
    `One-home strategies must buy at least ${formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in ${standardOptimizerVariant.baseParams.firstHousePurchaseYear}. Two-home strategies must reach at least ${formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} on the second house purchase value.`,
    `Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.`,
  ],
};

const reportJson = {
  generatedAt: new Date().toISOString(),
  meta: {
    sampleMethod: 'Weighted stratified Monte Carlo',
    scenarioCount: scenarios.length,
    scenarioDrawsPerBucket: SCENARIO_DRAWS_PER_BUCKET,
    candidateStrategyCount: strategies.length,
    defaultMediumWeight: DEFAULT_MEDIUM_WEIGHT,
    defaultPrivateSchoolProbability: DEFAULT_PRIVATE_SCHOOL_PROBABILITY,
    robustScoreWeights: ROBUST_SCORE_WEIGHTS,
    optimizerStartingIncomes: {
      person1: OPTIMIZER_STARTING_INCOME_1,
      person2: OPTIMIZER_STARTING_INCOME_2,
    },
    defaultApplyScenario: {
      incomeLabel: defaultApplyIncomeCase.label,
      marketLabel: defaultApplyMarketCase.label,
      incomeGrowth: defaultApplyIncomeCase.growth,
      isaGrowth: defaultApplyMarketCase.isaGrowth,
      propertyGrowth: defaultApplyMarketCase.propertyGrowth,
      usePrivateSchool: false,
    },
    houseValueRules: {
      oneHomeFirstHouseMin: OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
      twoHomeSecondHouseMin: OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
    },
    scenarioSampling: {
      incomeCases: OPTIMIZER_INCOME_CASES.length,
      marketCases: OPTIMIZER_MARKET_CASES.length,
      privateSchoolStates: 2,
      drawsPerBucket: SCENARIO_DRAWS_PER_BUCKET,
      description: `Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x ${SCENARIO_DRAWS_PER_BUCKET.toLocaleString()} random path draws per bucket.`,
      whyNotEveryScenario: 'The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, and mortgage-rate shocks are random, there is no finite master list of all possible futures to enumerate.',
    },
    strategySampling: {
      description: 'Candidate strategies come from the optimizer-ranked housing plans plus a supplemental one-home grid across the full first deposit and first mortgage search range.',
      firstDepositPoints: strategyGrid.depositPoints,
      firstMortgagePoints: strategyGrid.mortgagePoints,
      salaryMortgageEarlyPoints: strategyGrid.salaryMortgageEarlyPoints,
      startingCashPool: strategyGrid.startingCashPool,
      pathCounts: strategyPathCounts,
      originCounts: strategyOriginCounts,
    },
    weightingExplanation: 'Each simulated future belongs to one income bucket, one market bucket, and one private-school state. Those buckets do not all count equally: medium cases carry more weight by design, and private-school futures only get the chosen private-school probability. A weighted share is therefore the share of total probability mass, not just the raw share of rows.',
  },
  baseParams: standardOptimizerVariant.baseParams,
  recommendation,
  frontier: paretoFrontier.map((metric) => ({
    strategyId: metric.strategyId,
    expectedEndNetWorth: metric.weightedMeanNetWorth,
    regretCvar10: metric.weightedRegretCvar10,
    feasibilityProbability: metric.weightedFeasibilityProbability,
    compositeRobustScore: metric.compositeRobustScore,
  })),
  topStrategies: topStrategies.map((metric, index) => serializeStrategyMetric(metric, index + 1)),
  pathSummaries: {
    all: {
      candidateCount: metrics.length,
      bestStrategyId: topStrategies[0]?.strategyId ?? null,
      topStrategies: topStrategies.slice(0, TOP_CDF_STRATEGY_COUNT).map((metric) => metric.strategyId),
    },
    oneHome: {
      candidateCount: oneHomeMetrics.length,
      bestStrategyId: oneHomeMetrics[0]?.strategyId ?? null,
      topStrategies: topOneHomeStrategies.map((metric) => metric.strategyId),
    },
    twoHome: {
      candidateCount: twoHomeMetrics.length,
      bestStrategyId: twoHomeMetrics[0]?.strategyId ?? null,
      topStrategies: topTwoHomeStrategies.map((metric) => metric.strategyId),
    },
  },
  strategyCatalog: metrics.map((metric) => serializeStrategyMetric(metric)),
  heatmap: {
    cells: heatmapCells,
    plateauRegion,
  },
  sensitivity: {
    mediumWeightGrid: MEDIUM_WEIGHT_GRID,
    privateSchoolProbabilityGrid: PRIVATE_SCHOOL_PROBABILITY_GRID,
    cells: sensitivityGrid,
  },
  charts: {
    scatter: {
      all: 'robustness-analysis/scatter-net-worth-vs-regret-overall.svg',
      oneHome: 'robustness-analysis/scatter-net-worth-vs-regret-one-home.svg',
      twoHome: 'robustness-analysis/scatter-net-worth-vs-regret-two-home.svg',
    },
    cdf: {
      all: 'robustness-analysis/cdf-top-robust-strategies-overall.svg',
      oneHome: 'robustness-analysis/cdf-top-robust-strategies-one-home.svg',
      twoHome: 'robustness-analysis/cdf-top-robust-strategies-two-home.svg',
    },
    heatmap: 'robustness-analysis/heatmap-deposit-vs-mortgage.svg',
    sensitivity: 'robustness-analysis/sensitivity-medium-weight-vs-private-school.svg',
    markdown: 'robustness-analysis/report.md',
  },
};

const markdown = `# Robustness analysis

Generated: ${reportJson.generatedAt}

## Setup

- Scenario method: ${reportJson.meta.sampleMethod}
- Scenario count: ${reportJson.meta.scenarioCount}
- Candidate strategies: ${reportJson.meta.candidateStrategyCount}
- Scenario sampling: ${reportJson.meta.scenarioSampling.description}
- Strategy sampling: ${reportJson.meta.strategySampling.description}
- Default medium-case weight: ${formatPercent(reportJson.meta.defaultMediumWeight, 0)}
- Default private-school probability: ${formatPercent(reportJson.meta.defaultPrivateSchoolProbability, 0)}
- Starting incomes baked into the robustness run: ${formatCurrency(OPTIMIZER_STARTING_INCOME_1)} for person 1 and ${formatCurrency(OPTIMIZER_STARTING_INCOME_2)} for person 2
- House-value rule: one-home first house at least ${formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in ${standardOptimizerVariant.baseParams.firstHousePurchaseYear}; two-home second purchase at least ${formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}
- Why not every scenario: ${reportJson.meta.scenarioSampling.whyNotEveryScenario}

## Recommendation

${recommendation.headline}

${recommendation.notes.map((note) => `- ${note}`).join('\n')}

## Top strategies

${buildMarkdownTable({
  headers: ['Rank', 'Strategy', 'Path', 'Deposit 1', 'Mortgage 1', 'Expected Net Worth', 'Regret CVaR 10%', 'Feasibility', 'Private School Feasibility'],
  rows: topStrategies.map((metric, index) => [
    String(index + 1),
    metric.strategyId,
    metric.strategy.enableSecondHouse ? 'Two-home' : 'One-home',
    formatCurrency(metric.strategy.deposit1),
    formatCurrency(metric.strategy.mortgage1),
    formatCurrency(metric.weightedMeanNetWorth),
    formatCurrency(metric.weightedRegretCvar10),
    formatPercent(metric.weightedFeasibilityProbability),
    formatPercent(metric.weightedPrivateSchoolFeasibilityProbability),
  ]),
})}

## Pareto frontier

${buildMarkdownTable({
  headers: ['Strategy', 'Expected Net Worth', 'Regret CVaR 10%', 'Feasibility', 'Composite Score'],
  rows: paretoFrontier.slice(0, 15).map((metric) => [
    metric.strategyId,
    formatCurrency(metric.weightedMeanNetWorth),
    formatCurrency(metric.weightedRegretCvar10),
    formatPercent(metric.weightedFeasibilityProbability),
    metric.compositeRobustScore.toFixed(1),
  ]),
})}

## Charts

- [Scatter: all strategies](./scatter-net-worth-vs-regret-overall.svg)
- [Scatter: one-home only](./scatter-net-worth-vs-regret-one-home.svg)
- [Scatter: two-home only](./scatter-net-worth-vs-regret-two-home.svg)
- [CDF: all top strategies](./cdf-top-robust-strategies-overall.svg)
- [CDF: one-home top strategies](./cdf-top-robust-strategies-one-home.svg)
- [CDF: two-home top strategies](./cdf-top-robust-strategies-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
`;

await mkdir(robustnessDir, { recursive: true });
await writeFile(scatterOverallChartPath, scatterOverallSvg);
await writeFile(scatterOneHomeChartPath, scatterOneHomeSvg);
await writeFile(scatterTwoHomeChartPath, scatterTwoHomeSvg);
await writeFile(cdfOverallChartPath, cdfOverallSvg);
await writeFile(cdfOneHomeChartPath, cdfOneHomeSvg);
await writeFile(cdfTwoHomeChartPath, cdfTwoHomeSvg);
await writeFile(heatmapChartPath, heatmapSvg);
await writeFile(sensitivityChartPath, sensitivitySvg);
await writeFile(reportMarkdownPath, markdown);
await writeFile(reportJsonPath, JSON.stringify(reportJson, null, 2));

console.log(JSON.stringify({
  generatedAt: reportJson.generatedAt,
  scenarioCount: reportJson.meta.scenarioCount,
  candidateStrategyCount: reportJson.meta.candidateStrategyCount,
  topStrategy: reportJson.topStrategies[0]?.strategyId ?? null,
  plateauRegion: reportJson.recommendation.plateauRegion,
}, null, 2));
