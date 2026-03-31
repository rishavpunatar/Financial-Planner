/**
 * Income growth helpers.
 *
 * These helpers keep the planner's age-based career-income taper logic in one place,
 * while still allowing alternative taper shapes if we want to experiment later.
 */

export const logisticTaper = (age, baseRate, opts = {}) => {
  const {
    age50 = 50,
    asymptote = 0.25,
    steepness = 4,
  } = opts;
  const multiplier = asymptote + (1 - asymptote) / (1 + Math.exp((age - age50) / steepness));
  return baseRate * multiplier;
};

export const piecewiseTaper = (age, baseRate, opts = {}) => {
  const {
    age50 = 50,
    taperEnd = 70,
    endMultiplier = 0.4,
  } = opts;

  if (age <= age50) return baseRate;
  if (age >= taperEnd) return baseRate * endMultiplier;

  const fraction = (age - age50) / (taperEnd - age50);
  const multiplier = 1 - fraction * (1 - endMultiplier);
  return baseRate * multiplier;
};

export const getCareerGrowthFactor = (
  age,
  {
    peakAge = 40,
    endAge = 55,
    endMultiplier = 0,
  } = {},
) => piecewiseTaper(age, 1, {
  age50: peakAge,
  taperEnd: endAge,
  endMultiplier,
});

export const calculateCareerIncome = (
  startIncome,
  baseGrowthRate,
  startAge,
  currentAge,
  taperOptions = {},
) => {
  if (currentAge <= startAge || baseGrowthRate <= 0) {
    return startIncome;
  }

  const baseIncrement = startIncome * (baseGrowthRate / 100);
  let income = startIncome;

  for (let age = startAge; age < currentAge; age += 1) {
    income += baseIncrement * getCareerGrowthFactor(age, taperOptions);
  }

  return income;
};

export default {
  logisticTaper,
  piecewiseTaper,
  getCareerGrowthFactor,
  calculateCareerIncome,
};
