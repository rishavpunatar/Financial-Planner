import {
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
} from './plannerModel.js';

const BASE_PARAM_FIELDS = [
  'startYear',
  'mortgageRate',
  'realGrowthCosts',
  'child1BirthYear',
  'child2BirthYear',
  'baseLivingCost',
  'child1AnnualCost',
  'child2AnnualCost',
  'emergencyFundAnnual',
  'pensionContributionRate',
  'visaCostPreSecondHouse',
  'visaCostAtSecondHouse',
  'carCost',
  'kid1GiftAmount',
  'kid2GiftAmount',
  'isaContributionCap',
  'recessionHitPct',
  'cgtRatePct',
  'recessionYear',
  'secondRecessionYear',
  'thirdRecessionYear',
  'enableRedundancy',
  'redundancyYear',
  'secondRedundancyYear',
];

export const buildPlannerBasePatch = ({
  appliedBaseParams,
  strategyApplyMode,
  fallbackPrivateSchool = false,
}) => {
  const forcedPrivateSchool = strategyApplyMode === 'privateSchoolOn';

  if (!appliedBaseParams) {
    return {
      usePrivateSchool: forcedPrivateSchool || fallbackPrivateSchool,
    };
  }

  const patch = Object.fromEntries(
    BASE_PARAM_FIELDS
      .filter((field) => Object.hasOwn(appliedBaseParams, field))
      .map((field) => [field, appliedBaseParams[field]]),
  );

  patch.combinedGiftAmount = (appliedBaseParams.kid1GiftAmount ?? 0)
    + (appliedBaseParams.kid2GiftAmount ?? 0);
  patch.usePrivateSchool = forcedPrivateSchool || appliedBaseParams.usePrivateSchool;

  return patch;
};

export const buildOptimizerStrategyApplication = ({
  result,
  strategyApplyMode,
  optimizerUsePrivateSchool,
  appliedBaseParams,
}) => {
  const patch = {
    initialCash: result.initialDeposit + result.optimizerIsaSeed,
    initialDeposit: result.initialDeposit,
    initialMortgage: result.initialMortgage,
    isaSeed: result.optimizerIsaSeed,
    firstHousePurchaseYear: result.firstHousePurchaseYear,
    salaryMortgageEarly: result.salaryMortgageEarly,
    salaryMortgageLater: result.salaryMortgageLater,
    enableSecondHouse: result.enableSecondHouse,
    lockHouseLink: false,
    secondHouseDeposit: result.enableSecondHouse ? result.secondHouseDeposit : 0,
    secondMortgage: result.enableSecondHouse ? result.secondMortgage : 0,
    secondHouseYear: result.enableSecondHouse ? result.secondHouseYear : undefined,
    presetName: `${result.assumptionCase.label} plan`,
    activeTab: 'planner',
  };

  if (strategyApplyMode !== 'currentPlanner') {
    Object.assign(patch, buildPlannerBasePatch({
      appliedBaseParams,
      strategyApplyMode,
      fallbackPrivateSchool: optimizerUsePrivateSchool,
    }));
    patch.income1Start = OPTIMIZER_STARTING_INCOME_1;
    patch.income2Start = OPTIMIZER_STARTING_INCOME_2;
    patch.incomeGrowth = result.assumptionCase.incomeGrowth;
    patch.isaGrowth = result.assumptionCase.isaGrowth;
    patch.realGrowthProperty = result.assumptionCase.propertyGrowth;
  }

  return patch;
};

export const buildRobustnessStrategyApplication = ({
  robustStrategy,
  strategyApplyMode,
  appliedBaseParams,
  defaultApplyScenario,
}) => {
  const patch = {
    initialCash: robustStrategy.decisionVector.deposit1 + (robustStrategy.decisionVector.optimizerIsaSeed ?? 0),
    initialDeposit: robustStrategy.decisionVector.deposit1,
    initialMortgage: robustStrategy.decisionVector.mortgage1,
    isaSeed: robustStrategy.decisionVector.optimizerIsaSeed ?? 0,
    firstHousePurchaseYear: robustStrategy.decisionVector.buyYear1,
    salaryMortgageEarly: robustStrategy.decisionVector.salaryMortgageEarly,
    salaryMortgageLater: robustStrategy.decisionVector.salaryMortgageLater,
    enableSecondHouse: Boolean(robustStrategy.decisionVector.buyYear2),
    lockHouseLink: false,
    secondHouseDeposit: robustStrategy.decisionVector.buyYear2 ? robustStrategy.decisionVector.deposit2 : 0,
    secondMortgage: robustStrategy.decisionVector.buyYear2 ? robustStrategy.decisionVector.mortgage2 : 0,
    secondHouseYear: robustStrategy.decisionVector.buyYear2 || undefined,
    presetName: `Robust ${robustStrategy.strategyId}`,
    activeTab: 'planner',
  };

  if (strategyApplyMode !== 'currentPlanner') {
    Object.assign(patch, buildPlannerBasePatch({
      appliedBaseParams,
      strategyApplyMode,
      fallbackPrivateSchool: defaultApplyScenario?.usePrivateSchool ?? false,
    }));
    patch.income1Start = OPTIMIZER_STARTING_INCOME_1;
    patch.income2Start = OPTIMIZER_STARTING_INCOME_2;
    patch.incomeGrowth = defaultApplyScenario?.incomeGrowth;
    patch.isaGrowth = defaultApplyScenario?.isaGrowth;
    patch.realGrowthProperty = defaultApplyScenario?.propertyGrowth;
  }

  return patch;
};
