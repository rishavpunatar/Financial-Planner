import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appPath = path.join(repoRoot, 'src', 'App.jsx');
const tempDir = path.join(repoRoot, '.tmp');

const DEFAULT_EXPORTS = [
  'BASE_BIRTH_YEAR',
  'END_AGE',
  'OPTIMIZER_INCOME_CASES',
  'OPTIMIZER_MARKET_CASES',
  'OPTIMIZER_ASSUMPTION_CASES',
  'OPTIMIZER_OBJECTIVE_DEFINITIONS',
  'OPTIMIZER_STARTING_INCOME_1',
  'OPTIMIZER_STARTING_INCOME_2',
  'OPTIMIZER_MIN_FIRST_PROPERTY_VALUE',
  'OPTIMIZER_MIN_UPGRADE_VALUE',
  'OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE',
  'OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE',
  'OPTIMIZER_FIXED_FIRST_HOUSE_YEAR',
  'OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD',
  'OPTIMIZER_FAST_UPGRADE_YEAR_MAX',
  'OPTIMIZER_LATE_UPGRADE_YEAR_MAX',
  'OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE',
  'OPTIMIZER_MAX_TOTAL_MORTGAGE',
  'POST_2032_SAVINGS_FLOOR_START_YEAR',
  'POST_2032_MIN_TOTAL_SAVINGS',
  'FIRST_HOME_SALE_AGENT_FEE_PCT',
  'FIRST_HOME_SALE_LEGAL_FEES',
  'FIRST_HOUSE_LEGAL_FEES',
  'SECOND_HOUSE_LEGAL_FEES',
  'OPTIMIZER_BIG_FIRST_HOUSE_TARGET',
  'calculateStampDuty',
  'calculateRealTermsTakeHomePay',
  'calculateCareerIncome',
  'buildSteppedPoints',
  'getOptimizerUpgradeYearMax',
  'passesOptimizerHouseValueRule',
  'compareOptimizerResults',
  'compareOptimizerResultsForObjective',
  'createOptimizerFailureCounts',
  'recordOptimizerFailures',
  'summarizeOptimizerFailureCounts',
  'roundToStep',
  'clampValue',
  'applyTerminalMortgagePayoff',
  'simulateFinancialPlan',
];

export const loadPlannerCore = async ({
  moduleName = 'planner-core',
  extraExports = [],
} = {}) => {
  const appSource = await readFile(appPath, 'utf8');
  const startToken = 'const calculateStampDuty';
  const endToken = 'const App = () => {';
  const startIndex = appSource.indexOf(startToken);
  const endIndex = appSource.indexOf(endToken);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Could not extract planner core from src/App.jsx');
  }

  const exportNames = Array.from(new Set([...DEFAULT_EXPORTS, ...extraExports]));
  const modulePath = path.join(tempDir, `${moduleName}.mjs`);
  const moduleSource = `${appSource.slice(startIndex, endIndex)}

export {
  ${exportNames.join(',\n  ')},
};
`;

  await mkdir(tempDir, { recursive: true });
  await writeFile(modulePath, moduleSource);

  return import(`${pathToFileURL(modulePath).href}?ts=${Date.now()}`);
};

export default loadPlannerCore;
