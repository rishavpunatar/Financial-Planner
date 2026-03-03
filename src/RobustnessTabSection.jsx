const ROBUSTNESS_PATH_OPTIONS = [
  { id: 'all', label: 'All paths' },
  { id: 'oneHome', label: 'One-home only' },
  { id: 'twoHome', label: 'Two-home only' },
];

const PATH_COLOR_BY_TYPE = {
  'One-home path': '#0f766e',
  'Two-home path': '#2563eb',
};

const buildTicks = (min, max) => (
  [0, 0.25, 0.5, 0.75, 1].map((tick) => min + ((max - min) * tick))
);

const getPaddedBounds = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.05);
    return [min - padding, max + padding];
  }

  const padding = (max - min) * 0.08;
  return [min - padding, max + padding];
};

const RobustnessScatterSvg = ({
  points,
  title,
  subtitle,
  xAccessor,
  yAccessor,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
  highlightedIds,
  labelAll = false,
}) => {
  if (!points.length) {
    return (
      <div className="optimizer-empty">
        No strategies available for this chart.
      </div>
    );
  }

  const width = 920;
  const height = 520;
  const padding = { top: 42, right: 36, bottom: 72, left: 92 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xValues = points.map(xAccessor);
  const yValues = points.map(yAccessor);
  const [minX, maxX] = getPaddedBounds(xValues);
  const [minY, maxY] = getPaddedBounds(yValues);
  const xTicks = buildTicks(minX, maxX);
  const yTicks = buildTicks(minY, maxY);
  const scaleX = (value) => padding.left + (((value - minX) / Math.max(1, maxX - minX)) * plotWidth);
  const scaleY = (value) => padding.top + plotHeight - (((value - minY) / Math.max(1, maxY - minY)) * plotHeight);

  return (
    <svg
      className="robustness-chart-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
    >
      <rect width={width} height={height} fill="#ffffff" />
      <text x={padding.left} y={24} fontSize="20" fontFamily="Arial, sans-serif" fontWeight="700" fill="#0f172a">
        {title}
      </text>
      <text x={padding.left} y={44} fontSize="12" fontFamily="Arial, sans-serif" fill="#475569">
        {subtitle}
      </text>
      <line
        x1={padding.left}
        y1={padding.top + plotHeight}
        x2={padding.left + plotWidth}
        y2={padding.top + plotHeight}
        stroke="#94a3b8"
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + plotHeight}
        stroke="#94a3b8"
      />
      {xTicks.map((tickValue) => {
        const x = scaleX(tickValue);
        return (
          <g key={`x-${tickValue}`}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={padding.top + plotHeight}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={x}
              y={padding.top + plotHeight + 22}
              textAnchor="middle"
              fontSize="11"
              fontFamily="Arial, sans-serif"
              fill="#64748b"
            >
              {xFormatter(tickValue)}
            </text>
          </g>
        );
      })}
      {yTicks.map((tickValue) => {
        const y = scaleY(tickValue);
        return (
          <g key={`y-${tickValue}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + plotWidth}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="Arial, sans-serif"
              fill="#64748b"
            >
              {yFormatter(tickValue)}
            </text>
          </g>
        );
      })}
      {points.map((point) => {
        const highlighted = highlightedIds.has(point.strategyId);
        const x = scaleX(xAccessor(point));
        const y = scaleY(yAccessor(point));
        const color = PATH_COLOR_BY_TYPE[point.pathType] ?? '#334155';
        return (
          <g key={point.strategyId}>
            <circle
              cx={x}
              cy={y}
              r={highlighted || labelAll ? 5 : 3}
              fill={color}
              opacity={highlighted || labelAll ? 0.95 : 0.6}
            />
            {(highlighted || labelAll) && (
              <text
                x={x + 8}
                y={y - 8}
                fontSize="11"
                fontFamily="Arial, sans-serif"
                fill="#0f172a"
              >
                {point.strategyId}
              </text>
            )}
          </g>
        );
      })}
      <text
        x={width / 2}
        y={height - 16}
        textAnchor="middle"
        fontSize="12"
        fontFamily="Arial, sans-serif"
        fill="#334155"
      >
        {xLabel}
      </text>
      <text
        x="20"
        y={height / 2}
        transform={`rotate(-90 20 ${height / 2})`}
        textAnchor="middle"
        fontSize="12"
        fontFamily="Arial, sans-serif"
        fill="#334155"
      >
        {yLabel}
      </text>
      <rect x={width - 220} y={padding.top} width="180" height="56" rx="10" fill="#f8fafc" stroke="#cbd5e1" />
      <circle cx={width - 200} cy={padding.top + 20} r="5" fill="#0f766e" />
      <text x={width - 188} y={padding.top + 24} fontSize="11" fontFamily="Arial, sans-serif" fill="#334155">
        One-home path
      </text>
      <circle cx={width - 200} cy={padding.top + 40} r="5" fill="#2563eb" />
      <text x={width - 188} y={padding.top + 44} fontSize="11" fontFamily="Arial, sans-serif" fill="#334155">
        Two-home path
      </text>
    </svg>
  );
};

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
  const scatterHighlightedIds = new Set(
    robustnessDisplayedStrategies.slice(0, 5).map((strategy) => strategy.strategyId),
  );
  const topStrategyPlotPoints = robustnessDisplayedStrategies;
  const cashLikelihoodYAxisLabel = robustnessObjective === 'privateSchoolSuccess'
    ? 'Private-school success rate'
    : 'Success rate';
  const cashLikelihoodAccessor = (strategy) => (
    robustnessObjective === 'privateSchoolSuccess'
      ? strategy.metrics.privateSchoolFeasibilityProbability
      : strategy.metrics.feasibilityProbability
  );
  const topStrategyIds = new Set(topStrategyPlotPoints.map((strategy) => strategy.strategyId));

  const recommendationTitle = 'Recommended starting point from this run';
  const recommendationSummary = hasPlateauRegion
    ? `The tested grid found ${plateauCellCount} nearby starting points with similar results, so this is a real range rather than one fragile point estimate.`
    : 'This run found one strongest tested starting point rather than a broad stable range.';
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
      return `This ranking now ignores the stricter deterministic school-on baseline and simply shows the best available school-on robustness options from the tested set. In the current run, none of those options pass the separate medium/medium school-on baseline check.`;
    }

    return 'This ranking looks first at the school-on futures and asks which tested setup copes best there. It is not filtered by the deterministic school-on baseline check.';
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
              <div className="summary-label">Full Simulations Run</div>
              <div className="summary-value">
                {robustnessMeta?.strategySampling?.fullEvaluationCount?.toLocaleString() ?? '—'}
              </div>
              <div className="summary-sub">
                Fully tested setups x future paths, with each run simulated year by year to age 70
              </div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Setups Fully Tested</div>
              <div className="summary-value">{robustnessMeta?.candidateStrategyCount?.toLocaleString() ?? '—'}</div>
              <div className="summary-sub">
                {(robustnessMeta?.strategySampling?.pathCounts?.oneHome ?? 0).toLocaleString()}
                {' '}one-home and{' '}
                {(robustnessMeta?.strategySampling?.pathCounts?.twoHome ?? 0).toLocaleString()}
                {' '}two-home setups in the full shortlist
              </div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">Recommended Start</div>
              <div className="summary-value">
                {plateauRegion
                  ? `${formatCurrency(plateauRegion.deposit1Min)} / ${formatCurrency(plateauRegion.mortgage1Min)}`
                  : '—'}
              </div>
              <div className="summary-sub">
                {hasPlateauRegion
                  ? 'First deposit / first mortgage at the start of the strongest tested range'
                  : 'First deposit / first mortgage for the single strongest tested point'}
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
              <div>
                How to read the charts below: each dot is one fully tested housing setup. The first two charts show all {robustnessEligibleStrategies.length.toLocaleString()} eligible setups in the selected path view after the {robustnessApplyFilterDescription} filter, with only the current top {Math.min(5, robustnessDisplayedStrategies.length)} labeled. The third chart shows just the current top {topStrategyPlotPoints.length} setups, with every dot labeled so you can compare the shortlisted winners directly.
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
                      ? `${formatProbability(plateauRegion?.twoHomeShare ?? 0)} of this recommended range resolves to a two-home path.`
                      : 'This is a single strongest tested point, not a broad stable range.'}
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
              Switching this changes the winner cards, the table ranking, and the charts below.
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
                {robustnessApplyFilterDescription === 'no deterministic apply filter' ? (
                  <div>
                    For this private-school ranking, displayed winners are not filtered through a separate deterministic baseline. The table and cards show the best available school-on robustness options from the tested set.
                  </div>
                ) : (
                  <div>
                    Displayed winners are filtered to strategies that pass the {robustnessApplyFilterDescription} hard rules, including the post-2032 {formatCurrency(POST_2032_MIN_TOTAL_SAVINGS)} liquid-savings floor.
                  </div>
                )}
                {robustnessObjective === 'robust' && robustScoreWeights && (
                  <>
                    <div>
                      All-round score weights in this run: overall success {(robustScoreWeights.overallFeasibility * 100).toFixed(0)}%, school-on/off flexibility {(robustScoreWeights.schoolToggleFlexibility * 100).toFixed(0)}%, downside protection {(robustScoreWeights.inverseRegretCvar * 100).toFixed(0)}%, expected wealth {(robustScoreWeights.meanNetWorth * 100).toFixed(0)}%.
                    </div>
                    <div>
                      The school-on/off flexibility term uses the weaker of the two success rates, not the average. So a setup that works well only with private school off is penalized.
                    </div>
                  </>
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
              <div className="optimizer-result-title">All eligible setups: Cash End vs Likelihood</div>
              <div className="robustness-chart-badge">Decision use: High</div>
              <div className="optimizer-result-sub">
                This chart shows {robustnessEligibleStrategies.length} dots: one for each fully tested setup in the selected path view after the {robustnessApplyFilterDescription} filter. The labeled dots are the current top {Math.min(5, robustnessDisplayedStrategies.length)} strategies for the selected objective.
              </div>
              <RobustnessScatterSvg
                points={robustnessEligibleStrategies}
                title="All eligible setups: Expected Cash End vs Likelihood"
                subtitle={robustnessObjective === 'privateSchoolSuccess'
                  ? 'Higher means better private-school survival across the weighted future paths.'
                  : 'Higher means a larger share of weighted future paths stay feasible.'}
                xAccessor={(strategy) => strategy.metrics.expectedCashEnd}
                yAccessor={cashLikelihoodAccessor}
                xLabel="Expected cash left at end"
                yLabel={cashLikelihoodYAxisLabel}
                xFormatter={formatCurrency}
                yFormatter={formatProbability}
                highlightedIds={scatterHighlightedIds}
              />
            </div>
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">All eligible setups: Cash End vs Downside</div>
              <div className="robustness-chart-badge">Decision use: High</div>
              <div className="optimizer-result-sub">
                This uses the same {robustnessEligibleStrategies.length} eligible setups. Further right means more expected end cash. Lower means smaller downside regret in weak futures.
              </div>
              <RobustnessScatterSvg
                points={robustnessEligibleStrategies}
                title="All eligible setups: Expected Cash End vs Regret CVaR 10%"
                subtitle="Lower on the vertical axis is better. The labeled dots are the current top 5 setups."
                xAccessor={(strategy) => strategy.metrics.expectedCashEnd}
                yAccessor={(strategy) => strategy.metrics.regretCvar10}
                xLabel="Expected cash left at end"
                yLabel="Regret CVaR 10%"
                xFormatter={formatCurrency}
                yFormatter={formatCurrency}
                highlightedIds={scatterHighlightedIds}
              />
            </div>
            <div className="robustness-chart-card">
              <div className="optimizer-result-title">Shortlisted winners: Cash End vs Total End Wealth</div>
              <div className="robustness-chart-badge">Decision use: Medium</div>
              <div className="optimizer-result-sub">
                This chart only shows the current top {topStrategyPlotPoints.length} shortlisted setups from the table. It is useful once you have already narrowed down the field and want to compare the likely cash-versus-wealth trade-off between the leading options.
              </div>
              <RobustnessScatterSvg
                points={topStrategyPlotPoints}
                title="Shortlisted winners: Expected Cash End vs Expected End Net Worth"
                subtitle="Every shortlisted dot is labeled so you can see how the current leaders differ."
                xAccessor={(strategy) => strategy.metrics.expectedCashEnd}
                yAccessor={(strategy) => strategy.metrics.expectedEndNetWorth}
                xLabel="Expected cash left at end"
                yLabel="Expected end net worth"
                xFormatter={formatCurrency}
                yFormatter={formatCurrency}
                highlightedIds={topStrategyIds}
                labelAll
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RobustnessTabSection;
