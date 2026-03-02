const section = (title, lines) => [
  `## ${title}`,
  '',
  ...lines,
  '',
].join('\n');

export const buildPlannerSummaryMarkdown = ({
  presetName,
  shareUrl,
  endAge,
  metrics,
  currentInputs,
  warnings,
  assumptions,
}) => [
  `# ${presetName || 'Planner scenario'}`,
  '',
  shareUrl ? `Share link: ${shareUrl}` : null,
  '',
  section('Outcome', [
    `- Final cash after age-${endAge} mortgage payoff: ${metrics.cashEnd}`,
    `- Final property value: ${metrics.finalPropertyValue}`,
    `- Final mortgage balance after payoff: ${metrics.finalMortgageBalance}`,
    `- Total mortgage payments: ${metrics.totalMortgagePayments}`,
    `- Lifetime interest paid: ${metrics.lifetimeInterestPaid}`,
    `- Min ISA balance: ${metrics.minIsaBalance}`,
    `- Min liquid savings after 2032: ${metrics.minLiquidBufferPost2032}`,
  ]),
  section('Current Inputs', currentInputs.map((line) => `- ${line}`)),
  section('Warnings', warnings.length ? warnings.map((line) => `- ${line}`) : ['- No active warning flags in the current path.']),
  section('Baked-In Assumptions', assumptions.map((line) => `- ${line}`)),
].filter(Boolean).join('\n');

export const buildOptimizerSummaryMarkdown = ({
  objectiveLabel,
  modeLabel,
  selectedResult,
  searchNotes,
  frozenAssumptions,
  housingEndLabel,
  housingEndValue,
}) => [
  `# Optimizer selection: ${selectedResult.assumptionCase.label}`,
  '',
  section('Selection', [
    `- Objective: ${objectiveLabel}`,
    `- Property mode: ${modeLabel}`,
    `- Path: ${selectedResult.enableSecondHouse ? 'Two-home path' : 'One-home path'}`,
    `- First house: ${selectedResult.firstHousePurchaseYear}, ${selectedResult.firstHouseValue} = ${selectedResult.initialDeposit} deposit + ${selectedResult.initialMortgage} mortgage`,
    selectedResult.enableSecondHouse
      ? `- Upgrade: ${selectedResult.secondHouseYear}, +${selectedResult.secondUpgradeValue} = ${selectedResult.secondHouseDeposit} deposit + ${selectedResult.secondMortgage} mortgage`
      : '- Upgrade: none',
    `- Mortgage budget: ${selectedResult.salaryMortgageEarly}% early${selectedResult.enableSecondHouse ? `, ${selectedResult.salaryMortgageLater}% later` : ''}`,
  ]),
  section('Outcome', [
    `- End net worth: ${selectedResult.netWorthEnd}`,
    `- Cash end after payoff: ${selectedResult.cashEnd}`,
    `- ${housingEndLabel}: ${housingEndValue}`,
    `- Lifetime interest: ${selectedResult.lifetimeInterestPaid}`,
    `- Cash before terminal payoff: ${selectedResult.cashBeforeTerminalMortgagePayoff}`,
    `- Terminal mortgage paydown: ${selectedResult.terminalMortgagePaydown}`,
  ]),
  section('Coverage', searchNotes.map((line) => `- ${line}`)),
  section('Frozen Assumptions', frozenAssumptions.map((line) => `- ${line}`)),
].join('\n');

export const buildRobustnessSummaryMarkdown = ({
  objectiveLabel,
  strategy,
  whyLines,
  coverageNotes,
  weightingExplanation,
  sampleDescription,
}) => [
  `# Robust strategy: ${strategy.strategyId}`,
  '',
  section('Selection', [
    `- Objective: ${objectiveLabel}`,
    `- Path: ${strategy.pathType}`,
    `- First house: ${strategy.decisionVector.buyYear1}, ${strategy.decisionVector.deposit1} deposit + ${strategy.decisionVector.mortgage1} mortgage`,
    strategy.decisionVector.buyYear2
      ? `- Upgrade: ${strategy.decisionVector.buyYear2}, ${strategy.decisionVector.deposit2} deposit + ${strategy.decisionVector.mortgage2} mortgage`
      : '- Upgrade: none',
  ]),
  section('Metrics', [
    `- Expected end net worth: ${strategy.metrics.expectedEndNetWorth}`,
    `- End net worth CVaR 10%: ${strategy.metrics.endNetWorthCvar10}`,
    `- Regret CVaR 10%: ${strategy.metrics.regretCvar10}`,
    `- Success rate: ${strategy.metrics.feasibilityProbability}`,
    `- Private school success: ${strategy.metrics.privateSchoolFeasibilityProbability}`,
    `- Expected cash end: ${strategy.metrics.expectedCashEnd}`,
    `- Expected property value: ${strategy.metrics.expectedFinalPropertyValue}`,
  ]),
  section('Why This Wins', whyLines.map((line) => `- ${line}`)),
  section('Coverage', [
    `- Scenario sampling: ${sampleDescription}`,
    `- Weighting: ${weightingExplanation}`,
    ...coverageNotes.map((line) => `- ${line}`),
  ]),
].join('\n');
