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
    OPTIMIZER_INCOME_CASES,
    OPTIMIZER_MARKET_CASES,
    OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE,
    OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE,
    POST_2032_MIN_TOTAL_SAVINGS,
  } = constants;
  const plateauCellCount = robustnessRecommendation?.plateauRegion?.plateauCellCount ?? 0;
  const hasPlateauRegion = plateauCellCount > 1;
  const firstDepositPoints = robustnessMeta?.strategySampling?.firstDepositPoints ?? [];
  const firstMortgagePoints = robustnessMeta?.strategySampling?.firstMortgagePoints ?? [];
  const oneHomePctPoints = robustnessMeta?.strategySampling?.oneHomeEarlyPctPoints ?? [];
  const twoHomeEarlyPctPoints = robustnessMeta?.strategySampling?.twoHomeEarlyPctPoints ?? [];
  const laterPctPoints = robustnessMeta?.strategySampling?.laterPctPoints ?? [];
  const secondDepositPoints = robustnessMeta?.strategySampling?.secondDepositPoints ?? [];
  const secondMortgagePoints = robustnessMeta?.strategySampling?.secondMortgagePoints ?? [];
  const secondYearPoints = robustnessMeta?.strategySampling?.secondYearPoints ?? [];

  return (
    <div className="chart-card">
      <h2 className="panel-title">Robustness Analysis</h2>
      <p className="helper-text">
        This tab answers a different question from the optimizer: not “what wins in one assumed future?”, but “what still looks sensible across many plausible futures?”
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
                Shortlisted starting setups carried into the full stress test
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">{hasPlateauRegion ? 'Robust Region' : 'Robust Setup'}</div>
              <div className="summary-value">
                {robustnessRecommendation
                  ? `${formatCurrency(robustnessRecommendation.plateauRegion.deposit1Min)} / ${formatCurrency(robustnessRecommendation.plateauRegion.mortgage1Min)}`
                  : '—'}
              </div>
              <div className="summary-sub">
                {hasPlateauRegion
                  ? 'First deposit / first mortgage at the start of the strongest stable neighborhood'
                  : 'First deposit / first mortgage for the single strongest stable starting point'}
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
                One-home / two-home setups inside the fully tested shortlist
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">How to use this page</div>
            <div className="optimizer-result-sub">
              This page is a stress test. It is asking which housing setup still looks acceptable across many plausible futures, not which setup wins in one single forecast.
            </div>
            <div className="optimizer-detail-list">
              <div>
                How the futures were built: the model starts with {robustnessMeta?.scenarioSampling?.bucketCount?.toLocaleString() ?? '—'} top-level buckets from income level x market level x private-school on/off. Inside each bucket it then generates {robustnessMeta?.scenarioSampling?.drawsPerBucket?.toLocaleString() ?? '—'} different year-by-year life paths by varying income, ISA returns, property growth, mortgage rates, cost growth, tax drag, recessions, and redundancy timing. That creates {robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'} futures in total.
              </div>
              <div>
                How the {robustnessMeta?.strategySampling?.explicitGridCount?.toLocaleString() ?? '—'} starting setups were created: the model crossed the allowed first deposit points ({firstDepositPoints.map((value) => formatCurrency(value)).join(', ') || '—'}), first mortgage points ({firstMortgagePoints.map((value) => formatCurrency(value)).join(', ') || '—'}), one-home mortgage % points ({oneHomePctPoints.join('%, ')}{oneHomePctPoints.length ? '%' : ''}), and for two-home paths also the second-home year ({secondYearPoints.join(', ') || '—'}), extra deposit ({secondDepositPoints.map((value) => formatCurrency(value)).join(', ') || '—'}), extra mortgage ({secondMortgagePoints.map((value) => formatCurrency(value)).join(', ') || '—'}), early mortgage % ({twoHomeEarlyPctPoints.join('%, ')}{twoHomeEarlyPctPoints.length ? '%' : ''}), and later mortgage % ({laterPctPoints.join('%, ')}{laterPctPoints.length ? '%' : ''}). It then dropped combinations that broke your hard rules, such as house-value floors, timing rules, and mortgage caps. The survivors are the {robustnessMeta?.strategySampling?.explicitGridCount?.toLocaleString() ?? '—'} screened setups.
              </div>
              <div>
                Why only {robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'} were fully tested: after the first pass, the model kept the strongest and most different-looking setups rather than carrying every similar setup into the expensive full run. That smaller set is what was stress-tested in depth.
              </div>
              <div>
                What one simulation means: one chosen housing setup is run through one full future path year by year until age 70. The model records end net worth, cash left, property value, mortgage balance, interest paid, and whether any hard rule broke on the way.
              </div>
              <div>
                What the {robustnessMeta?.strategySampling?.fullEvaluationCount?.toLocaleString() ?? '—'} full simulations were used for: every one of the {robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'} carried-forward setups was run through all {robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'} futures. Those results were then summarised into the table and charts: expected net worth, success rate, private-school success, regret, and the shortlist/frontier.
              </div>
              <div>
                What weighted percentages mean: a weighted success rate is probability-weighted, not raw-row-count weighted. Medium futures count more than low/high by design, and private-school futures only count by the private-school probability. So a 60% success rate means the plan survives 60% of the modelled probability mass.
              </div>
              <div>
                What success rate means: the plan stays valid overall, including the post-2032 {formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} liquid-savings floor, the mortgage limits, and the one-home or two-home house-value rules.
              </div>
              <div>
                What private school success means: after looking only at private-school futures, what share still stays feasible and can still afford school fees.
              </div>
              <div>
                What regret CVaR 10% means: in each future, the model compares a strategy with the best tested strategy in that same future. It then averages the worst 10% of those gaps. Lower is better because it means the strategy is less painful when it loses.
              </div>
              <div>
                What is estimated versus exact: {robustnessCoverageNotes?.winnerScope ?? 'Winner-scope note unavailable.'} {robustnessCoverageNotes?.scenarioScope ?? 'Scenario-scope note unavailable.'} {robustnessCoverageNotes?.regretScope ?? 'Regret-scope note unavailable.'}
              </div>
              <div>
                How to use it: pick an objective, compare the best overall / one-home / two-home cards, then use the scatter and CDF charts to shortlist. Use the heatmap and sensitivity chart as stability checks, not as the final decision on their own.
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">{hasPlateauRegion ? 'Recommended robust starting region' : 'Recommended robust starting setup'}</div>
            <div className="optimizer-result-sub">
              {hasPlateauRegion
                ? robustnessRecommendation?.headline
                : `This run does not show a broad plateau. It shows one strongest starting point: first deposit ${formatCurrency(robustnessRecommendation?.plateauRegion?.deposit1Min ?? 0)} and first mortgage ${formatCurrency(robustnessRecommendation?.plateauRegion?.mortgage1Min ?? 0)}.`}
            </div>
            <div className="optimizer-detail-list">
              {robustnessRecommendation?.notes?.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
            <div className="optimizer-detail-list">
              <div>
                House-value rule in this run: one-home paths need a first house of at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}; two-home paths need the second house purchase value to reach at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}.
              </div>
              <div>
                Default weighting: medium cases {formatProbability(robustnessMeta?.defaultMediumWeight ?? 0)}
                {' '}and private school probability {formatProbability(robustnessMeta?.defaultPrivateSchoolProbability ?? 0)}.
              </div>
              <div>
                Starting incomes baked into this robustness run: {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person1 ?? 0)}
                {' '}and {formatCurrency(robustnessMeta?.optimizerStartingIncomes?.person2 ?? 0)}.
              </div>
              <div>
                Apply-to-planner default view: {robustnessMeta?.defaultApplyScenario?.incomeLabel ?? 'Medium income'} / {robustnessMeta?.defaultApplyScenario?.marketLabel ?? 'Medium market'}
                {' '}with income growth {robustnessMeta?.defaultApplyScenario?.incomeGrowth ?? 0}%,
                {' '}ISA growth {robustnessMeta?.defaultApplyScenario?.isaGrowth ?? 0}%,
                {' '}property growth {robustnessMeta?.defaultApplyScenario?.propertyGrowth ?? 0}%.
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
            <div className="optimizer-result-title">Robustness objective</div>
            <div className="optimizer-result-sub">
              Choose what the robustness tab should prefer when it picks the “best” strategy from the same weighted future sample.
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
            <div className="optimizer-detail-list">
              <div>{selectedRobustnessObjectiveDefinition.description}</div>
              <div>
                The scatter plot and CDF below follow this objective. The heatmap and sensitivity plot stay on the balanced-robustness view because they are meant to show whether the broader recommendation is stable, not to pick a winner for every objective.
              </div>
              <div>
                Displayed winners are also filtered to strategies that pass the {robustnessApplyFilterDescription} hard rules, including the post-2032 {formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} liquid-savings floor.
              </div>
              <div>
                {robustnessCoverageNotes?.heatmapScope ?? 'Heatmap scope note unavailable.'}
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
              These three cards now follow the selected robustness objective, so you can compare the best overall strategy with the strongest one-home and two-home strategies under that goal.
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
                      <div className="optimizer-detail-list">
                        <div>
                          Start: {formatCurrency(strategy.decisionVector.deposit1)} deposit / {formatCurrency(strategy.decisionVector.mortgage1)} mortgage
                        </div>
                        <div>
                          End net worth: {formatCurrency(strategy.metrics.expectedEndNetWorth)}
                        </div>
                        <div>
                          Regret CVaR 10%: {formatCurrency(strategy.metrics.regretCvar10)}
                        </div>
                        <div>
                          Success rate: {formatProbability(strategy.metrics.feasibilityProbability)}
                        </div>
                      </div>
                      <div className="optimizer-detail-list">
                        {buildRobustnessWhyLines(strategy).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
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
              Use the path toggle to switch between all strategies, one-home only, and two-home only. The table ranking also follows the selected robustness objective above, so you can see how the strongest strategies change under different goals.
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
            <div className="optimizer-detail-list">
              <div>
                Expected net worth is the weighted average end result across the sampled futures.
              </div>
              <div>
                Regret CVaR 10% is the average “how much this loses by” in the worst 10% of futures, relative to the best tested strategy in those same futures.
              </div>
              <div>
                Success rate is the weighted probability that the full plan still works.
              </div>
              <div>
                Private school success only looks inside the private-school futures and asks what share still works there.
              </div>
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
              <div className="optimizer-result-sub">
                Most useful for decision making. Each dot is one tested strategy in the selected path view. Further right means higher expected end net worth. Lower means smaller downside regret. The frontier line is the shortlist of strategies that are not clearly worse on both measures at once. Use this to narrow down candidates before looking at the table or CDF.
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
              <div className="optimizer-result-sub">
                Also useful for decision making. Each line is one of the strongest strategies for the current objective and path view. A line further right usually means better end net worth. A line that drops more slowly is spending less probability in very weak outcomes. Use this when two shortlisted strategies have similar averages but different downside shapes.
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
              <div className="optimizer-result-sub">
                Useful as a stability check, not as the final chooser. This is the balanced-robustness screening heatmap across the explicit first-deposit and first-mortgage grid. Darker cells are stronger on the balanced robust score. The bold plateau is the safer neighborhood where nearby starting combinations behave similarly, so you are not relying on one fragile exact point.
              </div>
              <div className="optimizer-detail-list">
                <div>
                  First-deposit points shown: {robustnessMeta?.strategySampling?.firstDepositPoints?.map((value) => formatCurrency(value)).join(', ') || '—'}
                </div>
                <div>
                  First-mortgage points shown: {robustnessMeta?.strategySampling?.firstMortgagePoints?.map((value) => formatCurrency(value)).join(', ') || '—'}
                </div>
                <div>
                  Grey cells mean that deposit/mortgage pair is in the plotted range, but no screened strategy combination survived there.
                </div>
                <div>
                  The number written inside each colored cell is the balanced composite robust score. It is only useful for comparing cells within this chart. It is not a cash amount and it is not directly comparable to the scatter or table numbers.
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
              <div className="optimizer-result-sub">
                Useful only as a robustness check on your judgment calls. It does not rerun a new strategy search. It re-scores the same tested strategies while changing two assumptions: how heavily medium futures are weighted, and how likely private school is. If the winner stays similar across boxes, the recommendation is stable. If it flips a lot, your answer depends heavily on those assumptions.
              </div>
              <div className="optimizer-detail-list">
                <div>
                  Horizontal axis: the assumed probability of private school. Vertical axis: how much total weight is given to medium futures versus low/high futures.
                </div>
                <div>
                  In each box, the top text is the winning strategy ID and the lower number is its balanced composite robust score under that weighting choice.
                </div>
                <div>
                  That score is only a ranking score for this sensitivity chart. Higher is better within this chart, but it is not a pound value and it should not be compared directly with end net worth.
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
