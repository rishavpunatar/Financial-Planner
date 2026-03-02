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
          <div className="robustness-explainer-grid">
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">What this tab does</div>
              <div className="optimizer-result-sub">
                This tab stress-tests housing strategies across many future paths rather than assuming one single future. It is trying to answer: “which starting setup still looks sensible across a wide range of income, market, mortgage-rate, and school-cost outcomes?”
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">What was sampled</div>
              <div className="optimizer-result-sub">
                {robustnessMeta?.scenarioSampling?.description ?? 'Scenario sampling details unavailable.'}
                {' '}On the strategy side, {robustnessMeta?.strategySampling?.description?.toLowerCase() ?? 'strategy sampling details are not available'}.
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">How scenarios were identified</div>
              <div className="optimizer-result-sub">
                {robustnessMeta?.scenarioSampling
                  ? `${robustnessMeta.scenarioSampling.bucketCount?.toLocaleString() ?? '—'} top-level buckets were created from income x market x private-school states, then ${robustnessMeta.scenarioSampling.drawsPerBucket?.toLocaleString() ?? '—'} random yearly path draws were generated inside each bucket.`
                  : 'Scenario-generation details are unavailable.'}
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">How many were tested</div>
              <div className="optimizer-result-sub">
                {robustnessMeta?.strategySampling
                  ? `Screening stage: ${robustnessMeta.strategySampling.explicitGridCount?.toLocaleString() ?? '—'} housing strategies x ${robustnessMeta.strategySampling.screeningScenarioCount?.toLocaleString() ?? '—'} lighter futures = ${robustnessMeta.strategySampling.screeningEvaluationCount?.toLocaleString() ?? '—'} screening simulations. Full stage: ${robustnessMeta.candidateStrategyCount?.toLocaleString() ?? '—'} carried-forward strategies x ${robustnessMeta.scenarioCount?.toLocaleString() ?? '—'} weighted futures = ${robustnessMeta.strategySampling.fullEvaluationCount?.toLocaleString() ?? '—'} full robustness simulations.`
                  : 'Testing-count details are unavailable.'}
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">What weighted share means</div>
              <div className="optimizer-result-sub">
                A “weighted share” is not just raw row-count percentage. Medium futures count more than low/high by design, and private-school futures only count by the private-school probability you set. So 60% success rate means the plan survives 60% of the model’s total probability mass, not necessarily 60% of raw rows.
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">Why not every scenario</div>
              <div className="optimizer-result-sub">
                {robustnessMeta?.scenarioSampling?.whyNotEveryScenario ?? 'The future-path generator is continuous year by year, so there is no finite master list of all possible scenarios to enumerate.'}
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">What is exact vs estimated</div>
              <div className="optimizer-result-sub">
                {robustnessCoverageNotes?.winnerScope ?? 'Winner-scope note unavailable.'}
                {' '}
                {robustnessCoverageNotes?.scenarioScope ?? 'Scenario-scope note unavailable.'}
              </div>
            </div>
            <div className="robustness-explainer-card">
              <div className="optimizer-result-title">What regret is relative to</div>
              <div className="optimizer-result-sub">
                {robustnessCoverageNotes?.regretScope ?? 'Regret-scope note unavailable.'}
              </div>
            </div>
          </div>

          <div className="summary-grid robustness-summary-grid">
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Scenario Sample</div>
              <div className="summary-value">{robustnessMeta?.scenarioCount?.toLocaleString() ?? '—'}</div>
              <div className="summary-sub">
                {robustnessMeta?.sampleMethod ?? 'Weighted stratified Monte Carlo'}
              </div>
            </div>
            <div className="summary-card summary-accent-blue">
              <div className="summary-label">Candidate Strategies</div>
              <div className="summary-value">{robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'}</div>
              <div className="summary-sub">
                Housing decision vectors tested across the scenario sample
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">Robust Region</div>
              <div className="summary-value">
                {robustnessRecommendation
                  ? `${formatCurrency(robustnessRecommendation.plateauRegion.deposit1Min)} / ${formatCurrency(robustnessRecommendation.plateauRegion.mortgage1Min)}`
                  : '—'}
              </div>
              <div className="summary-sub">
                First deposit / first mortgage at the strongest plateau start
              </div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Path Mix</div>
              <div className="summary-value">
                {(robustnessMeta?.strategySampling?.pathCounts?.oneHome ?? 0).toLocaleString()}
                {' / '}
                {(robustnessMeta?.strategySampling?.pathCounts?.twoHome ?? 0).toLocaleString()}
              </div>
              <div className="summary-sub">
                One-home / two-home strategies in the robustness catalog
              </div>
            </div>
          </div>

          <div className="robustness-card">
            <div className="optimizer-result-title">Recommended robust starting region</div>
            <div className="optimizer-result-sub">
              {robustnessRecommendation?.headline}
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
            <div className="optimizer-result-title">How the sample was built</div>
            <div className="robustness-explainer-grid">
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Scenario buckets</div>
                <div className="optimizer-result-sub">
                  Income uses the low / medium / high real growth buckets from the planner. Market uses the linked ISA/property low / medium / high buckets. Private school is treated as uncertain rather than fixed, so every run includes both school-on and school-off futures.
                </div>
                <div className="optimizer-detail-list">
                  <div>Income cases: {OPTIMIZER_INCOME_CASES.map((item) => `${item.shortLabel} ${item.growth}%`).join(', ')}</div>
                  <div>
                    Market cases: {OPTIMIZER_MARKET_CASES.map((item) => `${item.shortLabel} ISA ${item.isaGrowth}% / Property ${item.propertyGrowth}%`).join(', ')}
                  </div>
                  <div>
                    Extra sampled shocks: {robustnessMeta?.scenarioSampling?.sampledDimensions?.join(', ') || '—'}
                  </div>
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Strategy buckets</div>
                <div className="optimizer-result-sub">
                  The robustness run now starts from an explicit housing grid across the allowed deposit, mortgage, year, and salary-payment ranges. It screens that wider grid on a lighter scenario set first, then carries the strongest and most representative candidates into the full robustness run.
                </div>
                <div className="optimizer-detail-list">
                  <div>
                    Explicit grid before screening: {(robustnessMeta?.strategySampling?.explicitGridCount ?? 0).toLocaleString()} strategies
                  </div>
                  <div>
                    Screening futures: {(robustnessMeta?.strategySampling?.screeningScenarioCount ?? 0).toLocaleString()} | screening simulations: {(robustnessMeta?.strategySampling?.screeningEvaluationCount ?? 0).toLocaleString()}
                  </div>
                  <div>
                    Full robustness catalog after screening: {(robustnessMeta?.strategySampling?.screenedToCandidateCount ?? 0).toLocaleString()} strategies
                  </div>
                  <div>
                    Full robustness simulations: {(robustnessMeta?.strategySampling?.fullEvaluationCount ?? 0).toLocaleString()}
                  </div>
                  <div>
                    Origins: {Object.entries(robustnessMeta?.strategySampling?.originCounts ?? {}).map(([origin, count]) => `${origin.replaceAll('-', ' ')} ${count}`).join(', ') || '—'}
                  </div>
                  <div>
                    Heatmap range: deposit {robustnessMeta?.strategySampling?.firstDepositPoints?.length
                      ? `${formatCurrency(robustnessMeta.strategySampling.firstDepositPoints[0])} to ${formatCurrency(robustnessMeta.strategySampling.firstDepositPoints[robustnessMeta.strategySampling.firstDepositPoints.length - 1])}`
                      : '—'}
                    {' '}and mortgage {robustnessMeta?.strategySampling?.firstMortgagePoints?.length
                      ? `${formatCurrency(robustnessMeta.strategySampling.firstMortgagePoints[0])} to ${formatCurrency(robustnessMeta.strategySampling.firstMortgagePoints[robustnessMeta.strategySampling.firstMortgagePoints.length - 1])}`
                      : '—'}.
                  </div>
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">How to read percentages</div>
                <div className="optimizer-result-sub">
                  Success-rate and private-school percentages are weighted shares of probability, not plain row counts. If medium futures are weighted more heavily, a strategy can have a high weighted success rate even if its raw success count is lower in some lighter-weight buckets.
                </div>
                <div className="optimizer-detail-list">
                  <div>{robustnessMeta?.weightingExplanation ?? 'Weighting explanation unavailable.'}</div>
                  <div>
                    Private school % only asks: inside the private-school slice of futures, what share still works and keeps those fees affordable?
                  </div>
                </div>
              </div>
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
                The scatter plot and CDF below follow this objective. The heatmap and sensitivity plot stay on the balanced-robustness screening view because they are showing the broader starting region rather than just one objective ranking.
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
            <div className="robustness-explainer-grid">
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Regret CVaR 10%</div>
                <div className="optimizer-result-sub">
                  This is a downside measure. For each future, the model asks how far this strategy falls behind the best strategy in that same future. It then looks at the worst 10% of those gaps and averages them. Lower is better.
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Success Rate %</div>
                <div className="optimizer-result-sub">
                  This is the weighted share of the model’s full future probability where the plan stays valid overall: cash does not break, mortgage rules hold, the post-2032 liquid-savings floor is preserved, and the one-home or two-home house-value rule is met. Higher is better.
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">Private School Success %</div>
                <div className="optimizer-result-sub">
                  This only looks at the private-school slice of futures. It asks: after re-weighting just that slice to 100%, what share still remains feasible and can still afford school fees? Higher is better.
                </div>
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
                This chart changes with both the path toggle and the selected robustness objective. Each dot is one sampled strategy in that path view. The horizontal axis is weighted expected end net worth, so further right is better. The vertical axis is regret CVaR 10%, so lower is better. The line is the Pareto frontier: strategies on that line are not clearly beaten on both expected wealth and downside regret at the same time. The highlighted labels are the strongest strategies for the current objective.
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
                This chart follows both the selected path view and the selected robustness objective. Each line is one of the strongest strategies in that bucket for the current objective. Moving right means higher end net worth. If one line stays to the right of another for most of the plot, it usually means that strategy is producing better end-wealth outcomes across a broad chunk of the distribution, not just in the average case.
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
                This is the balanced-robustness screening heatmap across the full explicit first-deposit and first-mortgage grid. Darker cells are stronger balanced robust scores. The bold plateau is the “good neighborhood” where nearby starting combinations perform similarly well, so you are not relying on one fragile exact point.
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
                This is also a balanced-robustness view. It does not resimulate the housing grid from scratch. Instead, it changes two judgment calls on the same scenario set: how much weight to give medium-case futures, and how likely private school is. Each box shows which strategy wins under that weighting choice, so you can see whether the balanced recommendation is stable or flips easily.
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
