import test from 'node:test';
import assert from 'node:assert/strict';
import loadPlannerCore from '../scripts/load-planner-core.mjs';

const {
  applyTerminalMortgagePayoff,
  simulateFinancialPlan,
} = await loadPlannerCore({ moduleName: 'planner-test-core' });

const createBaseParams = (overrides = {}) => ({
  startYear: 2033,
  firstHousePurchaseYear: 2033,
  startAge: 35,
  maxYear: 2036,
  mortgageRate: 2.3,
  salaryMortgageEarly: 18,
  salaryMortgageLater: 10,
  realGrowthCosts: 2,
  realGrowthProperty: 2,
  isaGrowth: 3,
  initialMortgage: 300000,
  secondMortgage: 0,
  initialDeposit: 300000,
  secondHouseDeposit: 0,
  isaSeed: 0,
  income1Start: 70000,
  income2Start: 90000,
  incomeGrowth: 3.5,
  secondHouseYear: 2036,
  child1BirthYear: 2040,
  child2BirthYear: 2042,
  kid1GiftYear: 2067,
  kid2GiftYear: 2069,
  recessionYear: 2045,
  secondRecessionYear: 2050,
  thirdRecessionYear: 2055,
  enableRedundancy: false,
  redundancyYear: 2040,
  secondRedundancyYear: 2045,
  baseLivingCost: 40000,
  child1AnnualCost: 30000,
  child2AnnualCost: 20000,
  emergencyFundAnnual: 5000,
  pensionContributionRate: 5,
  visaCostPreSecondHouse: 0,
  visaCostAtSecondHouse: 0,
  carCost: 0,
  kid1GiftAmount: 0,
  kid2GiftAmount: 0,
  isaContributionCap: 40000,
  recessionHitPct: 20,
  cgtRatePct: 20,
  usePrivateSchool: false,
  enableSecondHouse: false,
  returnFullData: false,
  ...overrides,
});

test('terminal mortgage payoff uses surplus savings before ISA', () => {
  const payoff = applyTerminalMortgagePayoff({
    isaTotal: 60000,
    surplusPot: 25000,
    mortgageBalance: 50000,
  });

  assert.equal(payoff.terminalMortgagePaydown, 50000);
  assert.equal(payoff.surplusPotEnd, 0);
  assert.equal(payoff.isaEnd, 35000);
  assert.equal(payoff.finalMortgageBalance, 0);
});

test('first-house purchase year does not receive an immediate property-growth uplift', () => {
  const result = simulateFinancialPlan(createBaseParams({
    startYear: 2027,
    startAge: 29,
    maxYear: 2027,
    firstHousePurchaseYear: 2027,
    initialDeposit: 300000,
    initialMortgage: 300000,
    income1Start: 0,
    income2Start: 0,
    realGrowthProperty: 10,
    baseLivingCost: 0,
    emergencyFundAnnual: 0,
    pensionContributionRate: 0,
    isaSeed: 0,
  }));

  assert.equal(result.finalPropertyValue, 600000);
});

test('second-house deposit can be funded from surplus savings before ISA', () => {
  const result = simulateFinancialPlan(createBaseParams({
    maxYear: 2035,
    initialDeposit: 300000,
    initialMortgage: 300000,
    enableSecondHouse: true,
    secondHouseYear: 2034,
    secondHouseDeposit: 100000,
    secondMortgage: 200000,
    isaSeed: 0,
    income1Start: 250000,
    income2Start: 250000,
    incomeGrowth: 0,
    baseLivingCost: 0,
    emergencyFundAnnual: 0,
    pensionContributionRate: 0,
    isaContributionCap: 0,
    cgtRatePct: 0,
    mortgageRate: 0,
    salaryMortgageEarly: 0,
    salaryMortgageLater: 0,
  }));

  assert.equal(result.canBuyHouse2IfChosen, true);
  assert.equal(result.secondHouseFundingGap, 0);
  assert.ok(result.cashBeforeTerminalMortgagePayoff > 0);
});

test('post-2032 savings floor uses the true intra-year minimum, not just year-end cash', () => {
  const result = simulateFinancialPlan(createBaseParams({
    startYear: 2033,
    firstHousePurchaseYear: 2033,
    maxYear: 2034,
    enableSecondHouse: true,
    secondHouseYear: 2033,
    secondHouseDeposit: 60000,
    secondMortgage: 200000,
    isaSeed: 60000,
    income1Start: 300000,
    income2Start: 300000,
    incomeGrowth: 0,
    baseLivingCost: 0,
    emergencyFundAnnual: 0,
    pensionContributionRate: 0,
    visaCostPreSecondHouse: 0,
    visaCostAtSecondHouse: 0,
    isaContributionCap: 40000,
    cgtRatePct: 0,
    mortgageRate: 0,
    salaryMortgageEarly: 0,
    salaryMortgageLater: 0,
  }));

  assert.ok(result.cashEnd > 50000);
  assert.ok(result.minLiquidBufferPost2032 < 50000);
  assert.equal(result.post2032SavingsFloorOk, false);
});

test('negative amortization is flagged when the mortgage budget does not cover interest', () => {
  const result = simulateFinancialPlan(createBaseParams({
    maxYear: 2034,
    initialDeposit: 100000,
    initialMortgage: 500000,
    income1Start: 20000,
    income2Start: 0,
    incomeGrowth: 0,
    mortgageRate: 10,
    salaryMortgageEarly: 1,
    salaryMortgageLater: 1,
    baseLivingCost: 0,
    emergencyFundAnnual: 0,
    pensionContributionRate: 0,
    isaSeed: 100000,
    cgtRatePct: 0,
  }));

  assert.ok(result.negativeAmortizationYears > 0);
  assert.ok(result.capitalizedInterestTotal > 0);
});
