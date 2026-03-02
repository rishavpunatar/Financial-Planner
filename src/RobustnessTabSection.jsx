const ROBUSTNESS_PATH_OPTIONS = [
  { id: 'all', label: 'All paths' },
  { id: 'oneHome', label: 'One-home only' },
  { id: 'twoHome', label: 'Two-home only' },
];

const RobustnessTabSection = ({
  constants,
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
  robustnessApplyFilterDescription,
}) => {
  const {
    OPTIMIZER_FIXED_FIRST_HOUSE_YEAR,
    OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
    OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
    POST_2032_MIN_TOTAL_SAVINGS,
  } = constants;

  const plateauRegion = robustnessRecommendation?.plateauRegion ?? null;
  const plateauCellCount = plateauRegion?.plateauCellCount ?? 0;
  const hasPlateauRegion = plateauCellCount > 1;
  const strategyCatalog = robustnessReport?.strategyCatalog ?? [];
  const privateSchoolBaseCasePassCount = strategyCatalog.filter(
    (strategy) => strategy.privateSchoolApplyScenarioCheck?.overallPass === true,
  ).length;
  const bestPrivateSchoolSuccess = strategyCatalog.length
    ? Math.max(...strategyCatalog.map((strategy) => strategy.metrics?.privateSchoolFeasibilityProbability ?? 0))
    : 0;
  const robustScoreWeights = robustnessMeta?.robustScoreWeights ?? null;

  const recommendationTitle = hasPlateauRegion
    ? 'Current recommendation: robust region'
    : 'Current recommendation: best tested setup';
  const recommendationSummary = hasPlateauRegion
    ? `The tested grid found ${plateauCellCount} nearby first-house starting points that all scored similarly well.`
    : 'This run did not find a broad stable neighborhood. It found one strongest tested starting point.';
  const objectiveHelperText = (() => {
    if (robustnessObjective === 'robust') {
      return 'This is the all-round ranking. It tries to favor setups that survive more often, lose by less when they fail, and still end up wealthy.';
    }

    if (robustnessObjective === 'cashEnd') {
      return 'This ranking prefers the most liquid cash left at the end, not the best all-round resilience.';
    }

    if (robustnessObjective === 'propertyValue') {
      return 'This ranking prefers the highest end property value, even if another setup is more balanced overall.';
    }

    if (robustnessObjective === 'bigFirstHouse') {
      return 'This objective now means the largest possible first house value, with stronger overall outcomes used as tie-breakers.';
    }

    if (privateSchoolBaseCasePassCount === 0) {
      return `No tested setup survives the stricter private-school base-case filter in this run. So this ranking shows the least-bad school-on options inside the sampled futures, not a guaranteed viable school-on plan.`;
    }

    return 'This ranking looks first at the school-on futures and asks which setup copes best there.';
  })();

  return (
    <div className="chart-card">
      <h2 className="panel-title">Robustness Analysis</h2>
      <p className="helper-text">
        This tab asks a different question from the optimizer: not “what wins in one assumed future?”, but “what still looks sensible across many plausible futures?”
      </p>

      {robustnessError && !robustnessReport && (
        <div className="optimizer-empty">
          Robustness report could not be loaded: {robustnessError}
        </div>
      )}

      {!robustnessReport && !robustnessError && (
        <div className="optimizer-empty">
          Loading robustness report...
        </div>
      )}

      {robustnessReport && (
        <>
          <div className="summary-grid robustness-summary-grid">
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Future Paths Tested</div>
              <div className="summary-value">{robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'}</div>
              <div className="summary-sub">
                Different plausible year-by-year futures for income, markets, rates, costs, and shocks
              </div>
            </div>
            <div className="summary-card summary-accent-blue">
              <div className="summary-label">Setups Fully Tested</div>
              <div className="summary-value">{robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'}</div>
              <div className="summary-sub">
                The shortlist that made it into the full stress test
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">{hasPlateauRegion ? 'Stable Region' : 'Best Setup'}</div>
              <div className="summary-value">
                {plateauRegion
                  ? `${formatCurrency(plateauRegion.deposit1Min)} / ${formatCurrency(plateauRegion.mortgage1Min)}`
                  : '—'}
              </div>
              <div className="summary-sub">
                {hasPlateauRegion
                  ? 'First deposit / first mortgage at the start of the strongest neighborhood'
                  : 'First deposit / first mortgage for the single strongest tested point'}
              </div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">One vs Two Home</div>
              <div className="summary-value">
                {(robustnessMeta?.strategySampling?.pathCounts?.oneHome ?? 0).toLocaleString()}
                {' / '}
                {(robustnessMeta?.strategySampling?.pathCounts?.twoHome ?? 0).toLocaleString()}
              </div>
              <div className="summary-sub">
                One-home / two-home setups in the full robustness shortlist
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">How this page works</div>
            <div className="optimizer-result-sub">
              This is one stress test over many plausible futures. It is not one forecast.
            </div>
            <div className="optimizer-detail-list">
              <div>
                What changes across housing setups: first-house deposit, first-house mortgage, one-home vs two-home path, second-house extra deposit, second-house extra mortgage, second-house year, mortgage payment % before the move, and mortgage payment % after the move. Those are the choices you control.
              </div>
              <div>
                What changes across future paths: income path, ISA return path, property growth path, mortgage-rate path, living-cost growth, tax-drag level, recession timing and severity, redundancy timing, and private school on/off. Those are the outside-world changes.
              </div>
              <div>
                The model first built {robustnessMeta?.strategySampling?.explicitGridCount?.toLocaleString() ?? '—'} legal housing setups from the allowed ranges, screened them quickly, then carried {robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'} stronger or more distinct setups into the full run.
              </div>
              <div>
                The model also generated {robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'} future paths. Each future path is one year-by-year version of your life to age 70 with different income, market, rate, cost, recession, and redundancy outcomes.
              </div>
              <div>
                Why there are two big numbers: {robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'} is the number of future paths. {robustnessMeta?.strategySampling?.fullEvaluationCount?.toLocaleString() ?? '—'} is the number of full simulations, which equals future paths x fully tested setups.
              </div>
              <div>
                In this run that is {robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'} future paths x {robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'} fully tested setups = {robustnessMeta?.strategySampling?.fullEvaluationCount?.toLocaleString() ?? '—'} full simulations.
              </div>
              <div>
                One full simulation means taking one fixed housing setup and running it through one complete future path, year by year, recording cash, property, mortgage, and whether any hard rule breaks.
              </div>
              <div>
                Success rate is the weighted share of futures where the full plan still works. “Works” means it preserves the {formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} post-2032 liquid-savings floor, passes mortgage rules, and meets the house-value rule.
              </div>
              <div>
                Regret CVaR 10% is a downside measure. For each future, the model compares one setup with the best tested setup in that same future, then averages the worst 10% of those gaps. Lower is better.
              </div>
              <div>
                Private-school success only looks inside the private-school futures and asks what share still stays feasible and can afford school fees. Best sampled private-school success in this run: {formatProbability(bestPrivateSchoolSuccess)}.
              </div>
              <div>
                Private-school probability {formatProbability(robustnessMeta?.defaultPrivateSchoolProbability ?? 0)} does not mean the model thinks private school is literally “30% likely” in real life. It means {formatProbability(robustnessMeta?.defaultPrivateSchoolProbability ?? 0)} of the averaging weight is given to school-on futures and {formatProbability(1 - (robustnessMeta?.defaultPrivateSchoolProbability ?? 0))} to school-off futures when the robustness metrics are calculated.
              </div>
              <div>
                What is estimated versus exact: {robustnessCoverageNotes?.winnerScope ?? 'Winner-scope note unavailable.'} {robustnessCoverageNotes?.scenarioScope ?? 'Scenario-scope note unavailable.'} {robustnessCoverageNotes?.regretScope ?? 'Regret-scope note unavailable.'}
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">{recommendationTitle}</div>
            <div className="optimizer-result-sub">
              {recommendationSummary}
            </div>
            <div className="robustness-explainer-grid">
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Recommendation summary</div>
                <div className="optimizer-detail-list">
                  <div>
                    First deposit: {plateauRegion ? formatCurrency(plateauRegion.deposit1Min) : '—'}
                    {hasPlateauRegion ? ` to ${formatCurrency(plateauRegion.deposit1Max)}` : ''}.
                  </div>
                  <div>
                    First mortgage: {plateauRegion ? formatCurrency(plateauRegion.mortgage1Min) : '—'}
                    {hasPlateauRegion ? ` to ${formatCurrency(plateauRegion.mortgage1Max)}` : ''}.
                  </div>
                  <div>
                    {hasPlateauRegion
                      ? `${formatProbability(plateauRegion?.twoHomeShare ?? 0)} of the stable neighborhood resolves to a two-home path.`
                      : 'This is a single strongest tested point, not a broad stable neighborhood.'}
                  </div>
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Rules used in this run</div>
                <div className="optimizer-detail-list">
                  <div>
                    One-home paths need a first house of at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}.
                  </div>
                  <div>
                    Two-home paths need the second house purchase value to reach at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}.
                  </div>
                  <div>
                    Default weighting: medium futures {formatProbability(robustnessMeta?.defaultMediumWeight ?? 0)} and private-school probability {formatProbability(robustnessMeta?.defaultPrivateSchoolProbability ?? 0)}.
                  </div>
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Apply-to-planner baseline</div>
                <div className="optimizer-detail-list">
                  <div>
                    {robustnessMeta?.defaultApplyScenario?.incomeLabel ?? 'Medium income'} / {robustnessMeta?.defaultApplyScenario?.marketLabel ?? 'Medium market'}.
                  </div>
                  <div>
                    Income growth {robustnessMeta?.defaultApplyScenario?.incomeGrowth ?? 0}% | ISA growth {robustnessMeta?.defaultApplyScenario?.isaGrowth ?? 0}% | property growth {robustnessMeta?.defaultApplyScenario?.propertyGrowth ?? 0}%.
                  </div>
                  <div>
                    Starting incomes: {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person1 ?? 0)} and {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person2 ?? 0)}.
                  </div>
                </div>
              </div>
            </div>
            <div className="robustness-links">
              {robustnessCharts?.markdown && (
                <a
                  className="preset-button preset-button-secondary"
                  href={`${import.meta.env.BASE_URL}${robustnessCharts.markdown}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open markdown report
                </a>
              )}
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">Choose what “best” means</div>
            <div className="optimizer-result-sub">
              Switching this changes the winner cards, the table ranking, the scatter chart, and the CDF chart.
            </div>
            <div className="view-tabs robustness-path-tabs">
              {robustnessObjectiveDefinitions.map((objective) => (
                <button
                  key={objective.id}
                  type="button"
                  className={`view-tab${robustnessObjective === objective.id ? ' view-tab-active' : ''}`}
                  onClick={() => setRobustnessObjective(objective.id)}
                >
                  {objective.label}
                </button>
              ))}
            </div>
            <div className="robustness-objective-note">
              <div className="optimizer-result-title">{selectedRobustnessObjectiveDefinition.label}</div>
              <div className="optimizer-result-sub">{objectiveHelperText}</div>
              <div className="optimizer-detail-list">
                <div>{selectedRobustnessObjectiveDefinition.description}</div>
                <div>
                  Displayed winners are filtered to strategies that pass the {robustnessApplyFilterDescription} hard rules, including the post-2032 {formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} liquid-savings floor.
                </div>
                {robustnessObjective === 'robust' && robustScoreWeights && (
                  <div>
                    All-round score weights in this run: success rate {(robustScoreWeights.overallFeasibility * 100).toFixed(0)}%, private-school success {(robustScoreWeights.privateSchoolFeasibility * 100).toFixed(0)}%, downside protection {(robustScoreWeights.inverseRegretCvar * 100).toFixed(0)}%, expected wealth {(robustScoreWeights.meanNetWorth * 100).toFixed(0)}%.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">Apply to planner</div>
            <div className="optimizer-result-sub">
              {selectedStrategyApplyModeDefinition.description}
            </div>
            <div className="view-tabs robustness-path-tabs">
              {strategyApplyModeDefinitions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`view-tab${strategyApplyMode === mode.id ? ' view-tab-active' : ''}`}
                  onClick={() => setStrategyApplyMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">Best strategy by path type</div>
            <div className="optimizer-result-sub">
              These cards follow the selected objective, so you can compare the best overall strategy with the strongest one-home and two-home strategies under that goal.
            </div>
            <div className="robustness-explainer-grid">
              {robustnessPathLeaderCards.map(({ key, label, strategy }) => (
                <div key={key} className="robustness-explainer-card">
                  <div className="optimizer-result-title">{label}</div>
                  {strategy ? (
                    <>
                      <div className="optimizer-result-sub">
                        {strategy.strategyId} · {strategy.pathType}
                      </div>
                      <div className="robustness-metric-chip-row">
                        <div className="robustness-metric-chip">
                          <span>Start</span>
                          <strong>{formatCurrency(strategy.decisionVector.deposit1)} / {formatCurrency(strategy.decisionVector.mortgage1)}</strong>
                        </div>
                        <div className="robustness-metric-chip">
                          <span>Success</span>
                          <strong>{formatProbability(strategy.metrics.feasibilityProbability)}</strong>
                        </div>
                        <div className="robustness-metric-chip">
                          <span>Regret CVaR</span>
                          <strong>{formatCurrency(strategy.metrics.regretCvar10)}</strong>
                        </div>
                        <div className="robustness-metric-chip">
                          <span>End net worth</span>
                          <strong>{formatCurrency(strategy.metrics.expectedEndNetWorth)}</strong>
                        </div>
                      </div>
                      <div className="optimizer-detail-list">
                        {buildRobustnessWhyLines(strategy).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                      <div className="robustness-links">
                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => handleApplyRobustnessStrategy(strategy)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => handleDownloadRobustnessSummary(strategy)}
                        >
                          Download
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="optimizer-result-sub">
                      No strategy available for this path bucket.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">Robust strategy range</div>
            <div className="optimizer-result-sub">
              Use the path toggle to switch between all strategies, one-home only, and two-home only. The table ranking follows the selected objective.
            </div>
            <div className="view-tabs robustness-path-tabs">
              {ROBUSTNESS_PATH_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`view-tab${robustnessPathView === option.id ? ' view-tab-active' : ''}`}
                  onClick={() => setRobustnessPathView(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="optimizer-result-sub">
              Showing the top {Math.min(15, robustnessEligibleStrategies.length)} of {robustnessEligibleStrategies.length} strategies in the selected path view after the {robustnessApplyFilterDescription} hard-rule filter.
            </div>
            <div className="robustness-table-wrap">
              <table className="robustness-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Strategy</th>
                    <th>Path</th>
                    <th>Origin</th>
                    <th>Deposit 1</th>
                    <th>Mortgage 1</th>
                    <th>Deposit 2</th>
                    <th>Mortgage 2</th>
                    <th>Expected Net Worth</th>
                    <th>Regret CVaR 10%</th>
                    <th>Success Rate</th>
                    <th>Private School Success</th>
                    <th>Apply</th>
                  </tr>
                </thead>
                <tbody>
                  {robustnessDisplayedStrategies.map((result, index) => (
                    <tr key={result.strategyId}>
                      <td>{index + 1}</td>
                      <td>{result.strategyId}</td>
                      <td>{result.pathType}</td>
                      <td>{formatStrategyOrigin(result.strategyOrigin)}</td>
                      <td>{formatCurrency(result.decisionVector.deposit1)}</td>
                      <td>{formatCurrency(result.decisionVector.mortgage1)}</td>
                      <td>{result.decisionVector.buyYear2 ? formatCurrency(result.decisionVector.deposit2) : '—'}</td>
                      <td>{result.decisionVector.buyYear2 ? formatCurrency(result.decisionVector.mortgage2) : '—'}</td>
                      <td>{formatCurrency(result.metrics.expectedEndNetWorth)}</td>
                      <td>{formatCurrency(result.metrics.regretCvar10)}</td>
                      <td>{formatProbability(result.metrics.feasibilityProbability)}</td>
                      <td>{formatProbability(result.metrics.privateSchoolFeasibilityProbability)}</td>
                      <td>
                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => handleApplyRobustnessStrategy(result)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => handleDownloadRobustnessSummary(result)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="robustness-chart-grid">
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">Expected Net Worth vs Regret</div>
              <div className="robustness-chart-badge">Decision use: High</div>
              <div className="optimizer-result-sub">
                Best chart for shortlisting. Each dot is one tested strategy in the selected path view. Further right means higher expected end net worth. Lower means smaller downside regret.
              </div>
              {robustnessSelectedScatter && (
                <img
                  className="robustness-chart-image"
                  src={`${import.meta.env.BASE_URL}${robustnessSelectedScatter}`}
                  alt="Scatter plot of expected net worth vs regret CVaR"
                />
              )}
            </div>
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">CDF of Top Strategies</div>
              <div className="robustness-chart-badge">Decision use: High</div>
              <div className="optimizer-result-sub">
                Best chart for comparing shortlisted strategies. A line further right usually means better end net worth. A line that drops more slowly is spending less probability in weak outcomes.
              </div>
              {robustnessSelectedCdf && (
                <img
                  className="robustness-chart-image"
                  src={`${import.meta.env.BASE_URL}${robustnessSelectedCdf}`}
                  alt="CDF of top robust strategies"
                />
              )}
            </div>
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">Deposit vs Mortgage Plateau</div>
              <div className="robustness-chart-badge robustness-chart-badge-muted">Decision use: Medium</div>
              <div className="optimizer-result-sub">
                Use this as a stability check. It shows whether nearby starting deposit / mortgage pairs behave similarly well, or whether the recommendation depends on one fragile point.
              </div>
              <div className="optimizer-detail-list">
                <div>
                  First-deposit points shown: {robustnessMeta?.strategySampling?.firstDepositPoints?.map((value) => formatCurrency(value)).join(', ') || '—'}.
                </div>
                <div>
                  First-mortgage points shown: {robustnessMeta?.strategySampling?.firstMortgagePoints?.map((value) => formatCurrency(value)).join(', ') || '—'}.
                </div>
                <div>
                  Grey cells mean that deposit/mortgage pair was in the plotted range, but no screened strategy survived there.
                </div>
                <div>
                  The number written inside each colored cell is the all-round ranking score for that chart only. It is not a cash amount.
                </div>
              </div>
              {robustnessCharts?.heatmap && (
                <img
                  className="robustness-chart-image"
                  src={`${import.meta.env.BASE_URL}${robustnessCharts.heatmap}`}
                  alt="Heatmap of robust score by first deposit and first mortgage"
                />
              )}
            </div>
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">Sensitivity</div>
              <div className="robustness-chart-badge robustness-chart-badge-muted">Decision use: Low</div>
              <div className="optimizer-result-sub">
                Use this only as a check on how sensitive the all-round recommendation is to two judgment calls: how much weight to give medium futures, and how likely private school is.
              </div>
              <div className="optimizer-detail-list">
                <div>
                  Horizontal axis: assumed private-school probability. Vertical axis: how much total weight goes to medium futures versus low/high futures.
                </div>
                <div>
                  In each box, the top text is the winning strategy ID and the lower number is its all-round ranking score under that weighting choice.
                </div>
                <div>
                  That number is a ranking score for this chart only. Higher is better within the chart, but it is not a pound value.
                </div>
              </div>
              {robustnessCharts?.sensitivity && (
                <img
                  className="robustness-chart-image"
                  src={`${import.meta.env.BASE_URL}${robustnessCharts.sensitivity}`}
                  alt="Sensitivity of the top robust strategy to medium-weight and private-school probability"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RobustnessTabSection;
