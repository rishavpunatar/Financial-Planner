// src/App.jsx
import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import RangeSlider from './RangeSlider.jsx';
import {
  loadStoredScenario,
  saveFiltersToURL,
} from './scenarioPersistence.js';
import {
  buildOptimizerSummaryMarkdown,
  buildPlannerSummaryMarkdown,
  buildRobustnessSummaryMarkdown,
} from './exportSummaries.js';
import {
  validatePrecomputedOptimizerPayload,
  validateRobustnessReport,
} from './reportValidation.js';
import {
  buildOptimizerStrategyApplication,
  buildRobustnessStrategyApplication,
} from './strategyApplication.js';

import {
  calculateStampDuty,
  BASE_BIRTH_YEAR,
  END_AGE,
  CAREER_GROWTH_PEAK_AGE,
  CAREER_GROWTH_END_AGE,
  OPTIMIZER_STARTING_INCOME_1,
  OPTIMIZER_STARTING_INCOME_2,
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
  OPTIMIZER_BIG_FIRST_HOUSE_TARGET,
  OPTIMIZER_DEFAULT_FIRST_HOUSE_MORTGAGE_MAX,
  FIRST_HOME_SALE_AGENT_FEE_PCT,
  FIRST_HOME_SALE_LEGAL_FEES,
  FIRST_HOUSE_LEGAL_FEES,
  SECOND_HOUSE_LEGAL_FEES,
  OPTIMIZER_INCOME_CASES,
  OPTIMIZER_MARKET_CASES,
  OPTIMIZER_OBJECTIVE_DEFINITIONS,
  STRATEGY_APPLY_MODE_DEFINITIONS,
  TAX_YEAR_LABEL,
  TAX_THRESHOLD_DRAG_PCT,
  clampValue,
  roundToStep,
  getOptimizerUpgradeYearMax,
  calculateRealTermsTakeHomePay,
  simulateFinancialPlan,
  runHousingOptimizer,
  getOptimizerResultKey,
  getOptimizerNetWorth,
  getOptimizerObjectiveDefinition,
  getOptimizerHousingEndLabel,
  getOptimizerHousingEndValue,
  getOptimizerHousingEndSub,
  getOptimizerHousingEndInlineLabel,
  compareOptimizerResultsForObjective,
  compareRobustnessStrategiesForObjective,
} from './plannerModel.js';

const PlannerChartSection = lazy(() => import('./PlannerChartSection.jsx'));
const OptimizerTabSection = lazy(() => import('./OptimizerTabSection.jsx'));
const RobustnessTabSection = lazy(() => import('./RobustnessTabSection.jsx'));

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
  const lifetimeInterestPaid = finalYear.totalInterestPaid || 0;
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

  const applyScenarioPatch = useCallback((patch) => {
    const setters = {
      activeTab: setActiveTab,
      baseLivingCost: setBaseLivingCost,
      cgtRatePct: setCgtRatePct,
      carCost: setCarCost,
      child1AnnualCost: setChild1AnnualCost,
      child1BirthYear: setChild1BirthYear,
      child2AnnualCost: setChild2AnnualCost,
      child2BirthYear: setChild2BirthYear,
      combinedGiftAmount: setCombinedGiftAmount,
      emergencyFundAnnual: setEmergencyFundAnnual,
      enableRedundancy: setEnableRedundancy,
      enableSecondHouse: setEnableSecondHouse,
      firstHousePurchaseYear: setFirstHousePurchaseYear,
      income1Start: setIncome1Start,
      income2Start: setIncome2Start,
      incomeGrowth: setIncomeGrowth,
      initialCash: setInitialCash,
      initialDeposit: setInitialDeposit,
      initialMortgage: setInitialMortgage,
      isaContributionCap: setIsaContributionCap,
      isaGrowth: setIsaGrowth,
      isaSeed: setIsaSeed,
      kid1GiftAmount: setKid1GiftAmount,
      kid2GiftAmount: setKid2GiftAmount,
      lockHouseLink: setLockHouseLink,
      mortgageRate: setMortgageRate,
      pensionContributionRate: setPensionContributionRate,
      presetName: setPresetName,
      realGrowthCosts: setRealGrowthCosts,
      realGrowthProperty: setRealGrowthProperty,
      recessionHitPct: setRecessionHitPct,
      recessionYear: setRecessionYear,
      redundancyYear: setRedundancyYear,
      salaryMortgageEarly: setSalaryMortgageEarly,
      salaryMortgageLater: setSalaryMortgageLater,
      secondHouseDeposit: setSecondHouseDeposit,
      secondHouseYear: setSecondHouseYear,
      secondMortgage: setSecondMortgage,
      secondRecessionYear: setSecondRecessionYear,
      secondRedundancyYear: setSecondRedundancyYear,
      startYear: setStartYear,
      thirdRecessionYear: setThirdRecessionYear,
      usePrivateSchool: setUsePrivateSchool,
      visaCostAtSecondHouse: setVisaCostAtSecondHouse,
      visaCostPreSecondHouse: setVisaCostPreSecondHouse,
    };

    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || !(key in setters)) return;
      setters[key](value);
    });
  }, []);

  const shouldUseStoredApplyBaseline = strategyApplyMode !== 'currentPlanner';

  const handleApplyOptimizerResult = (result) => {
    applyScenarioPatch(buildOptimizerStrategyApplication({
      result,
      strategyApplyMode,
      optimizerUsePrivateSchool,
      appliedBaseParams: shouldUseStoredApplyBaseline
        ? (selectedPrecomputedOptimizerPayload?.baseParams ?? null)
        : null,
    }));
  };

  const handleApplyRobustnessStrategy = (robustStrategy) => {
    if (!robustnessReport) return;

    applyScenarioPatch(buildRobustnessStrategyApplication({
      robustStrategy,
      strategyApplyMode,
      appliedBaseParams: shouldUseStoredApplyBaseline
        ? (robustnessReport.baseParams ?? null)
        : null,
      defaultApplyScenario: robustnessReport.meta?.defaultApplyScenario ?? null,
    }));
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

  const formatCurrency = useCallback((value) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  }, []);
  const formatProbability = useCallback((value) => `${(value * 100).toFixed(1)}%`, []);
  const formatStrategyOrigin = (origin) => ({
    'explicit-grid-one-home': 'Explicit grid: one-home',
    'explicit-grid-two-home': 'Explicit grid: two-home',
  }[origin] ?? String(origin || 'Unknown').replaceAll('-', ' '));
  const downloadMarkdownFile = useCallback((filename, text) => {
    if (typeof window === 'undefined') return;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const robustnessTopStrategies = robustnessReport?.topStrategies ?? [];
  const robustnessRecommendation = robustnessReport?.recommendation ?? null;
  const robustnessMeta = robustnessReport?.meta ?? null;
  const robustnessCharts = robustnessReport?.charts ?? null;
  const robustnessCoverageNotes = robustnessMeta?.coverageNotes ?? null;
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
  }, [formatCurrency, formatProbability, robustnessObjective]);

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
  const plannerWarnings = useMemo(() => [
    !post2032SavingsFloorSafe
      ? `Liquid savings fall below ${formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} after 2032.`
      : null,
    !minIsaSafe
      ? 'ISA falls below the £60k guardrail at some point.'
      : null,
    secondHouseFundingGap > 0
      ? `Second-house funding gap of ${formatCurrency(secondHouseFundingGap)} remains.`
      : null,
    finalShortfall > 0
      ? `Cumulative cash shortfall reaches ${formatCurrency(finalShortfall)}.`
      : null,
    negativeAmortizationYears > 0
      ? `Mortgage budget fails to cover interest in ${negativeAmortizationYears} year(s).`
      : null,
  ].filter(Boolean), [
    finalShortfall,
    formatCurrency,
    minIsaSafe,
    negativeAmortizationYears,
    post2032SavingsFloorSafe,
    secondHouseFundingGap,
  ]);

  const bakedInAssumptions = useMemo(() => [
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
  ], [
    cgtRatePct,
    child1BirthYear,
    child2BirthYear,
    effectiveSecondHouseYear,
    enableRedundancy,
    enableSecondHouse,
    finalMortgageBalance,
    formatCurrency,
    kid1GiftAmount,
    kid2GiftAmount,
    minLiquidBufferPost2032,
    negativeAmortizationYears,
    pensionContributionRate,
    post2032SavingsFloorSafe,
    recessionHitPct,
    recessionYear,
    secondHouseFundingGap,
    secondRedundancyYear,
    secondRecessionYear,
    terminalMortgagePaydown,
    thirdRecessionYear,
    usePrivateSchool,
    capitalizedInterestTotal,
    redundancyYear,
  ]);

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
  const optimizerFrozenAssumptions = useMemo(() => [
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
  ], [
    displayOptimizerSearchMeta,
    formatCurrency,
    initialDeposit,
    isaSeed,
    optimizerAssumptionMortgageRate,
    optimizerAssumptionRealGrowthCosts,
    optimizerAssumptionSourceLabel,
    optimizerUsePrivateSchool,
  ]);
  const optimizerCoverageNotes = useMemo(() => [
    hasPrecomputedOptimizerResults
      ? (precomputedOptimizerSearchMeta?.coverageNotes?.winnerScope
        ?? `Stored terminal results are exact within the frozen search ranges and step sizes from the last precompute run (${precomputedOptimizerSearchMeta?.testedScenarioCount?.toLocaleString() ?? '0'} combinations tested).`)
      : 'Current page results are only a browser preview sample across the active ranges, not the exact winner across the whole grid.',
    `Any “best” result is only best within the tested search space, not across every theoretical housing combination.`,
    precomputedOptimizerSearchMeta?.coverageNotes?.assumptionScope
      ?? `Optimizer winners use frozen baseline assumptions from ${optimizerAssumptionSourceLabel}.`,
  ], [
    hasPrecomputedOptimizerResults,
    optimizerAssumptionSourceLabel,
    precomputedOptimizerSearchMeta,
  ]);
  const handleDownloadPlannerSummary = useCallback(() => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const summary = buildPlannerSummaryMarkdown({
      presetName,
      shareUrl,
      endAge: END_AGE,
      metrics: {
        cashEnd: formatCurrency(finalLiquidNet),
        finalPropertyValue: formatCurrency(finalPropertyValue),
        finalMortgageBalance: formatCurrency(finalMortgageBalance),
        totalMortgagePayments: formatCurrency(totalMortgagePayments),
        lifetimeInterestPaid: formatCurrency(lifetimeInterestPaid),
        minIsaBalance: formatCurrency(minIsaBalance),
        minLiquidBufferPost2032: formatCurrency(minLiquidBufferPost2032),
      },
      currentInputs: [
        `First house ${formatCurrency(initialPropertyValue)} in ${firstHousePurchaseYear}`,
        enableSecondHouse
          ? `Second house move in ${effectiveSecondHouseYear} with +${formatCurrency(moveIncrementValue)}`
          : 'Second house disabled',
        `Starting cash ${formatCurrency(initialCash)} split as ${formatCurrency(initialDeposit)} deposit / ${formatCurrency(isaSeed)} ISA`,
        `Mortgage real rate ${mortgageRate}% and mortgage budget ${salaryMortgageEarly}% early${enableSecondHouse ? ` / ${salaryMortgageLater}% later` : ''}`,
        `Income starts at ${formatCurrency(income1Start)} and ${formatCurrency(income2Start)} with ${incomeGrowth}% real career growth`,
        `ISA growth ${isaGrowth}% and property growth ${realGrowthProperty}%`,
      ],
      warnings: plannerWarnings,
      assumptions: bakedInAssumptions,
    });
    downloadMarkdownFile(`${presetName || 'planner-scenario'}.md`, summary);
  }, [
    bakedInAssumptions,
    downloadMarkdownFile,
    effectiveSecondHouseYear,
    enableSecondHouse,
    finalLiquidNet,
    finalMortgageBalance,
    finalPropertyValue,
    firstHousePurchaseYear,
    formatCurrency,
    income1Start,
    income2Start,
    incomeGrowth,
    initialCash,
    initialDeposit,
    initialPropertyValue,
    isaGrowth,
    isaSeed,
    lifetimeInterestPaid,
    minIsaBalance,
    minLiquidBufferPost2032,
    mortgageRate,
    moveIncrementValue,
    plannerWarnings,
    presetName,
    realGrowthProperty,
    salaryMortgageEarly,
    salaryMortgageLater,
    totalMortgagePayments,
  ]);
  const handleDownloadOptimizerSummary = useCallback(() => {
    if (!selectedOptimizerResult) return;
    const summary = buildOptimizerSummaryMarkdown({
      objectiveLabel: selectedOptimizerObjectiveDefinition.label,
      modeLabel: optimizerModeLabel,
      selectedResult: {
        ...selectedOptimizerResult,
        firstHouseValue: formatCurrency(selectedOptimizerResult.firstHouseValue),
        initialDeposit: formatCurrency(selectedOptimizerResult.initialDeposit),
        initialMortgage: formatCurrency(selectedOptimizerResult.initialMortgage),
        secondUpgradeValue: formatCurrency(selectedOptimizerResult.secondUpgradeValue ?? 0),
        secondHouseDeposit: formatCurrency(selectedOptimizerResult.secondHouseDeposit ?? 0),
        secondMortgage: formatCurrency(selectedOptimizerResult.secondMortgage ?? 0),
        netWorthEnd: formatCurrency(selectedOptimizerResult.netWorthEnd),
        cashEnd: formatCurrency(selectedOptimizerResult.cashEnd),
        lifetimeInterestPaid: formatCurrency(selectedOptimizerResult.lifetimeInterestPaid),
        cashBeforeTerminalMortgagePayoff: formatCurrency(selectedOptimizerResult.cashBeforeTerminalMortgagePayoff),
        terminalMortgagePaydown: formatCurrency(selectedOptimizerResult.terminalMortgagePaydown),
      },
      searchNotes: optimizerCoverageNotes,
      frozenAssumptions: optimizerFrozenAssumptions,
      housingEndLabel: getOptimizerHousingEndLabel(selectedOptimizerResult),
      housingEndValue: formatCurrency(getOptimizerHousingEndValue(selectedOptimizerResult)),
    });
    downloadMarkdownFile(`${selectedOptimizerResult.assumptionCase.id}-optimizer.md`, summary);
  }, [
    downloadMarkdownFile,
    formatCurrency,
    optimizerCoverageNotes,
    optimizerFrozenAssumptions,
    optimizerModeLabel,
    selectedOptimizerObjectiveDefinition.label,
    selectedOptimizerResult,
  ]);
  const handleDownloadRobustnessSummary = useCallback((strategy) => {
    if (!strategy) return;
    const summary = buildRobustnessSummaryMarkdown({
      objectiveLabel: selectedRobustnessObjectiveDefinition.label,
      strategy: {
        ...strategy,
        decisionVector: {
          ...strategy.decisionVector,
          deposit1: formatCurrency(strategy.decisionVector.deposit1),
          mortgage1: formatCurrency(strategy.decisionVector.mortgage1),
          deposit2: formatCurrency(strategy.decisionVector.deposit2 ?? 0),
          mortgage2: formatCurrency(strategy.decisionVector.mortgage2 ?? 0),
        },
        metrics: {
          ...strategy.metrics,
          expectedEndNetWorth: formatCurrency(strategy.metrics.expectedEndNetWorth),
          endNetWorthCvar10: formatCurrency(strategy.metrics.endNetWorthCvar10),
          regretCvar10: formatCurrency(strategy.metrics.regretCvar10),
          feasibilityProbability: formatProbability(strategy.metrics.feasibilityProbability),
          privateSchoolFeasibilityProbability: formatProbability(strategy.metrics.privateSchoolFeasibilityProbability),
          expectedCashEnd: formatCurrency(strategy.metrics.expectedCashEnd),
          expectedFinalPropertyValue: formatCurrency(strategy.metrics.expectedFinalPropertyValue),
        },
      },
      whyLines: buildRobustnessWhyLines(strategy),
      coverageNotes: [
        robustnessCoverageNotes?.winnerScope,
        robustnessCoverageNotes?.regretScope,
        robustnessCoverageNotes?.scenarioScope,
        robustnessCoverageNotes?.heatmapScope,
      ].filter(Boolean),
      weightingExplanation: robustnessMeta?.weightingExplanation ?? 'Weighting explanation unavailable.',
      sampleDescription: robustnessMeta?.scenarioSampling?.description ?? 'Scenario sampling description unavailable.',
    });
    downloadMarkdownFile(`${strategy.strategyId.toLowerCase()}-robustness.md`, summary);
  }, [
    buildRobustnessWhyLines,
    downloadMarkdownFile,
    formatCurrency,
    formatProbability,
    robustnessCoverageNotes,
    robustnessMeta,
    selectedRobustnessObjectiveDefinition.label,
  ]);

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
    optimizerCoverageNotes,
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
    handleDownloadOptimizerSummary,
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
    robustnessCoverageNotes,
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
    handleDownloadRobustnessSummary,
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
          <button
            type="button"
            className="preset-button preset-button-secondary"
            onClick={handleDownloadPlannerSummary}
          >
            Download summary
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
