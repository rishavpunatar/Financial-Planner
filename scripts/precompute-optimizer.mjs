import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as optimizerCore from '../src/plannerModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const tempDir = path.join(repoRoot, '.tmp');
const outputPath = path.join(repoRoot, 'public', 'precomputed-optimizer-results.json');
const OPTIMIZER_PRECOMPUTE_VARIANTS = [
  { key: 'standard', label: 'Private school off', usePrivateSchool: false },
  { key: 'privateSchool', label: 'Private school on', usePrivateSchool: true },
];
const DEFAULT_FIRST_HOUSE_MORTGAGE_MAX = 600000;
const OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE = 400000;
const OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF = 2035;
const OPTIMIZER_MAX_UPGRADE_VALUE = 600000;
const PRECOMPUTED_TOP_RESULTS_PER_CASE = 20;

await mkdir(tempDir, { recursive: true });

const {
  BASE_BIRTH_YEAR,
  OPTIMIZER_ASSUMPTION_CASES,
  OPTIMIZER_OBJECTIVE_DEFINITIONS,
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
  OPTIMIZER_MIN_FIRST_PROPERTY_VALUE,
  OPTIMIZER_MIN_UPGRADE_VALUE,
  OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
  OPTIMIZER_LATE_UPGRADE_YEAR_MAX,
  OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  OPTIMIZER_MAX_TOTAL_MORTGAGE,
  TAX_THRESHOLD_DRAG_PCT,
  buildSteppedPoints,
  getOptimizerUpgradeYearMax,
  compareOptimizerResults,
  compareOptimizerResultsForObjective,
  createOptimizerFailureCounts,
  recordOptimizerFailures,
  summarizeOptimizerFailureCounts,
  roundToStep,
  clampValue,
  getDefaultOptimizerMortgagePctBounds,
  simulateFinancialPlan,
} = optimizerCore;

const defaultScenario = {
  startYear: 2027,
  firstHousePurchaseYear: 2027,
  mortgageRate: 2.3,
  salaryMortgageEarly: 18,
  salaryMortgageLater: 10,
  realGrowthCosts: 2,
  taxThresholdDragPct: TAX_THRESHOLD_DRAG_PCT,
  realGrowthProperty: 2,
  isaGrowth: 3,
  initialMortgage: 300000,
  secondMortgage: 100000,
  initialDeposit: 300000,
  secondHouseDeposit: 200000,
  isaSeed: 0,
  income1Start: OPTIMIZER_STARTING_INCOME_1,
  income2Start: OPTIMIZER_STARTING_INCOME_2,
  incomeGrowth: 0,
  secondHouseYear: 2037,
  child1BirthYear: 2032,
  child2BirthYear: 2034,
  recessionYear: 2035,
  secondRecessionYear: 2042,
  thirdRecessionYear: 2050,
  enableRedundancy: false,
  redundancyYear: 2031,
  secondRedundancyYear: 2039,
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
  usePrivateSchool: false,
  enableSecondHouse: true,
};

const startAge = defaultScenario.startYear - BASE_BIRTH_YEAR;
const kid1GiftYear = defaultScenario.child1BirthYear + 27;
const kid2GiftYear = defaultScenario.child2BirthYear + 27;
const defaultSecondHouseMortgageMax = clampValue(
  Math.max(
    Math.max(0, roundToStep(Math.max(defaultScenario.secondMortgage, 100000) * 0.75, 50000)),
    Math.max(
      0,
      OPTIMIZER_MAX_UPGRADE_VALUE - Math.max(
        Math.max(0, roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 0.75, 50000)),
        roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 1.25, 50000),
      ),
    ),
    roundToStep(Math.max(defaultScenario.secondMortgage, 100000) * 1.25, 50000),
  ),
  0,
  OPTIMIZER_MAX_TOTAL_MORTGAGE,
);
const defaultMortgagePctBounds = getDefaultOptimizerMortgagePctBounds({
  mortgageRate: defaultScenario.mortgageRate,
  firstHouseMortgageMax: DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
  laterMortgageReferenceBalance: defaultSecondHouseMortgageMax,
});

const searchConfig = {
  propertyMode: 'both',
  firstHouseDepositMin: Math.max(
    0,
    roundToStep(Math.max(defaultScenario.initialDeposit, 50000) * 0.75, 50000),
  ),
  firstHouseDepositMax: Math.max(
    Math.max(0, roundToStep(Math.max(defaultScenario.initialDeposit, 50000) * 0.75, 50000)),
    roundToStep(Math.max(defaultScenario.initialDeposit, 50000) * 1.25, 50000),
  ),
  firstHouseMortgageMin: clampValue(
    Math.max(0, roundToStep(Math.max(defaultScenario.initialMortgage, 100000) * 0.75, 50000)),
    0,
    OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  ),
  firstHouseMortgageMax: clampValue(
    Math.max(
      Math.max(0, roundToStep(Math.max(defaultScenario.initialMortgage, 100000) * 0.75, 50000)),
      DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
      roundToStep(Math.max(defaultScenario.initialMortgage, 100000) * 1.25, 50000),
    ),
    0,
    OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE,
  ),
  firstHouseYearMin: OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
  firstHouseYearMax: OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
  secondHouseDepositMin: Math.max(
    0,
    roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 0.75, 50000),
  ),
  secondHouseDepositMax: Math.max(
    Math.max(0, roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 0.75, 50000)),
    roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 1.25, 50000),
  ),
  secondHouseMortgageMin: clampValue(
    Math.max(0, roundToStep(Math.max(defaultScenario.secondMortgage, 100000) * 0.75, 50000)),
    0,
    OPTIMIZER_MAX_TOTAL_MORTGAGE,
  ),
  secondHouseMortgageMax: clampValue(
    Math.max(
      Math.max(0, roundToStep(Math.max(defaultScenario.secondMortgage, 100000) * 0.75, 50000)),
      Math.max(
        0,
        OPTIMIZER_MAX_UPGRADE_VALUE - Math.max(
          Math.max(0, roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 0.75, 50000)),
          roundToStep(Math.max(defaultScenario.secondHouseDeposit, 100000) * 1.25, 50000),
        ),
      ),
      roundToStep(Math.max(defaultScenario.secondMortgage, 100000) * 1.25, 50000),
    ),
    0,
    OPTIMIZER_MAX_TOTAL_MORTGAGE,
  ),
  secondHouseYearMin: Math.max(defaultScenario.secondHouseYear - 3, defaultScenario.startYear + 1),
  secondHouseYearMax: Math.min(defaultScenario.secondHouseYear + 3, OPTIMIZER_LATE_UPGRADE_YEAR_MAX),
  earlyMortgagePctMin: defaultMortgagePctBounds.earlyMortgagePctMin,
  earlyMortgagePctMax: defaultMortgagePctBounds.earlyMortgagePctMax,
  laterMortgagePctMin: defaultMortgagePctBounds.laterMortgagePctMin,
  laterMortgagePctMax: defaultMortgagePctBounds.laterMortgagePctMax,
};

const baseParams = {
  ...defaultScenario,
  startAge,
  kid1GiftYear,
  kid2GiftYear,
  calculateTakeHomePayFn: optimizerCore.calculateRealTermsTakeHomePay,
};

const buildFullSearchPlan = (config) => {
  const propertyModes = config.propertyMode === 'both' ? ['one', 'two'] : [config.propertyMode];

  return {
    propertyModes,
    firstHouseDeposits: buildSteppedPoints(config.firstHouseDepositMin, config.firstHouseDepositMax, 50000),
    firstHouseMortgages: buildSteppedPoints(
      Math.min(config.firstHouseMortgageMin, OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE),
      Math.min(config.firstHouseMortgageMax, OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE),
      50000,
    ),
    firstHouseYears: buildSteppedPoints(config.firstHouseYearMin, config.firstHouseYearMax, 1),
    earlyMortgagePcts: buildSteppedPoints(config.earlyMortgagePctMin, config.earlyMortgagePctMax, 1),
    secondHouseDeposits: buildSteppedPoints(config.secondHouseDepositMin, config.secondHouseDepositMax, 50000),
    secondHouseMortgages: buildSteppedPoints(
      Math.min(config.secondHouseMortgageMin, OPTIMIZER_MAX_TOTAL_MORTGAGE),
      Math.min(config.secondHouseMortgageMax, OPTIMIZER_MAX_TOTAL_MORTGAGE),
      50000,
    ),
    secondHouseYears: buildSteppedPoints(
      config.secondHouseYearMin,
      Math.min(config.secondHouseYearMax, OPTIMIZER_LATE_UPGRADE_YEAR_MAX),
      1,
    ),
    laterMortgagePcts: buildSteppedPoints(config.laterMortgagePctMin, config.laterMortgagePctMax, 1),
  };
};

const sanitizeResult = (result) => ({
  assumptionCase: {
    id: result.assumptionCase.id,
    label: result.assumptionCase.label,
    incomeGrowth: result.assumptionCase.incomeGrowth,
    isaGrowth: result.assumptionCase.isaGrowth,
    propertyGrowth: result.assumptionCase.propertyGrowth,
    incomeCase: result.assumptionCase.incomeCase,
    marketCase: result.assumptionCase.marketCase,
    sortOrder: result.assumptionCase.sortOrder,
  },
  enableSecondHouse: result.enableSecondHouse,
  firstHousePurchaseYear: result.firstHousePurchaseYear,
  initialDeposit: result.initialDeposit,
  initialMortgage: result.initialMortgage,
  firstHouseValue: result.firstHouseValue,
  salaryMortgageEarly: result.salaryMortgageEarly,
  salaryMortgageLater: result.salaryMortgageLater,
  optimizerIsaSeed: result.optimizerIsaSeed,
  secondHouseYear: result.secondHouseYear,
  secondHouseDeposit: result.secondHouseDeposit,
  secondMortgage: result.secondMortgage,
  secondUpgradeValue: result.secondUpgradeValue,
  cashBeforeTerminalMortgagePayoff: result.cashBeforeTerminalMortgagePayoff,
  terminalMortgagePaydown: result.terminalMortgagePaydown,
  cashEnd: result.cashEnd,
  equityEnd: result.equityEnd,
  netWorthEnd: result.netWorthEnd,
  lifetimeInterestPaid: result.lifetimeInterestPaid,
  finalPropertyValue: result.finalPropertyValue,
  finalMortgageBalance: result.finalMortgageBalance,
  peakMortgageBalance: result.peakMortgageBalance,
});

const buildObjectiveResults = (results) => Object.fromEntries(
  OPTIMIZER_OBJECTIVE_DEFINITIONS.map((objective) => {
    const sortedResults = [...results].sort((left, right) => (
      compareOptimizerResultsForObjective(objective.id, left, right)
    ));

    return [
      objective.id,
      {
        objective: {
          id: objective.id,
          label: objective.label,
          shortLabel: objective.shortLabel,
          description: objective.description,
        },
        bestResult: sortedResults[0] ?? null,
        topResults: sortedResults.slice(0, PRECOMPUTED_TOP_RESULTS_PER_CASE),
      },
    ];
  }),
);

const runFullHousingOptimizer = ({ baseParams, searchConfig }) => {
  const searchPlan = buildFullSearchPlan(searchConfig);
  const {
    propertyModes,
    firstHouseDeposits,
    firstHouseMortgages,
    firstHouseYears,
    earlyMortgagePcts,
    secondHouseDeposits,
    secondHouseMortgages,
    secondHouseYears,
    laterMortgagePcts,
  } = searchPlan;

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
                      const minimumFirstHouseValue = secondHouseYear <= OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF
                        ? OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE
                        : OPTIMIZER_MIN_FIRST_PROPERTY_VALUE;
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

    const feasibleResults = [...results].sort(compareOptimizerResults).map(sanitizeResult);
    const objectiveResults = buildObjectiveResults(feasibleResults);
    const topResults = objectiveResults.netWorth?.topResults ?? feasibleResults.slice(0, PRECOMPUTED_TOP_RESULTS_PER_CASE);

    return {
      assumptionCase: {
        id: assumptionCase.id,
        label: assumptionCase.label,
        incomeGrowth: assumptionCase.incomeGrowth,
        isaGrowth: assumptionCase.isaGrowth,
        propertyGrowth: assumptionCase.propertyGrowth,
        incomeCase: assumptionCase.incomeCase,
        marketCase: assumptionCase.marketCase,
        sortOrder: assumptionCase.sortOrder,
      },
      scenariosTested,
      feasibleCount: feasibleResults.length,
      bestResult: feasibleResults[0] ?? null,
      topResults,
      objectiveResults,
      failureSummary: summarizeOptimizerFailureCounts(failureCounts, scenariosTested),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    baseParams: {
      startYear: baseParams.startYear,
      firstHousePurchaseYear: baseParams.firstHousePurchaseYear,
      mortgageRate: baseParams.mortgageRate,
      realGrowthCosts: baseParams.realGrowthCosts,
      taxThresholdDragPct: baseParams.taxThresholdDragPct,
      child1BirthYear: baseParams.child1BirthYear,
      child2BirthYear: baseParams.child2BirthYear,
      baseLivingCost: baseParams.baseLivingCost,
      child1AnnualCost: baseParams.child1AnnualCost,
      child2AnnualCost: baseParams.child2AnnualCost,
      emergencyFundAnnual: baseParams.emergencyFundAnnual,
      pensionContributionRate: baseParams.pensionContributionRate,
      visaCostPreSecondHouse: baseParams.visaCostPreSecondHouse,
      visaCostAtSecondHouse: baseParams.visaCostAtSecondHouse,
      carCost: baseParams.carCost,
      kid1GiftAmount: baseParams.kid1GiftAmount,
      kid2GiftAmount: baseParams.kid2GiftAmount,
      isaContributionCap: baseParams.isaContributionCap,
      recessionHitPct: baseParams.recessionHitPct,
      cgtRatePct: baseParams.cgtRatePct,
      recessionYear: baseParams.recessionYear,
      secondRecessionYear: baseParams.secondRecessionYear,
      thirdRecessionYear: baseParams.thirdRecessionYear,
      enableRedundancy: baseParams.enableRedundancy,
      redundancyYear: baseParams.redundancyYear,
      secondRedundancyYear: baseParams.secondRedundancyYear,
      usePrivateSchool: baseParams.usePrivateSchool,
    },
    searchConfig,
    searchMeta: {
      isExhaustive: true,
      exactScenarioCount: caseResults.reduce((count, caseResult) => count + caseResult.scenariosTested, 0),
      testedScenarioCount: caseResults.reduce((count, caseResult) => count + caseResult.scenariosTested, 0),
      feasibleScenarioCount: caseResults.reduce((count, caseResult) => count + caseResult.feasibleCount, 0),
      startingCashPool,
      coverageNotes: {
        winnerScope: 'Winners are exact only within the frozen search ranges and step sizes used in this precompute run.',
        assumptionScope: 'The precomputed winners keep the stored baseline assumptions fixed apart from the searched housing levers and the 9 income/market assumption cases.',
      },
    },
    caseResults,
  };
};

const variants = Object.fromEntries(
  OPTIMIZER_PRECOMPUTE_VARIANTS.map((variant) => {
    const variantPayload = runFullHousingOptimizer({
      baseParams: {
        ...baseParams,
        usePrivateSchool: variant.usePrivateSchool,
      },
      searchConfig,
    });

    return [
      variant.key,
      {
        ...variantPayload,
        variant: {
          key: variant.key,
          label: variant.label,
          usePrivateSchool: variant.usePrivateSchool,
        },
      },
    ];
  }),
);

const payload = {
  generatedAt: new Date().toISOString(),
  variants,
};

await writeFile(outputPath, JSON.stringify(payload, null, 2));

console.log(`Wrote ${outputPath}`);
OPTIMIZER_PRECOMPUTE_VARIANTS.forEach((variant) => {
  const variantPayload = variants[variant.key];
  console.log(
    `${variant.label}: tested ${variantPayload.searchMeta.testedScenarioCount}, feasible ${variantPayload.searchMeta.feasibleScenarioCount}`,
  );
});
