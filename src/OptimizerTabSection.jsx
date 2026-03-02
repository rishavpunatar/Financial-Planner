import RangeSlider from './RangeSlider.jsx';

const OptimizerTabSection = ({
  constants,
  formatCurrency,
  showOptimizerIntro,
  setShowOptimizerIntro,
  optimizerModeLabel,
  optimizerModeDescription,
  displayOptimizerSearchMeta,
  optimizerCoverageNotes,
  optimizerPropertyMode,
  setOptimizerPropertyMode,
  optimizerObjectiveDefinitions,
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
}) => {
  const {
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
  } = constants;
  const optimizerCaseCount = displayOptimizerResultsByIncome.reduce(
    (count, group) => count + group.caseResults.length,
    0,
  );

  return (
    <div className="chart-card">
      <h2 className="panel-title">Housing Optimizer</h2>
      <div className="advanced-box">
        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowOptimizerIntro((prev) => !prev)}
        >
          {showOptimizerIntro ? 'Hide optimizer intro' : 'Show optimizer intro'}
        </button>

        {showOptimizerIntro && (
          <div className="optimizer-copy-block">
            <p className="helper-text">
              This tab keeps the planner assumptions fixed, resets starting income to £70k for person 1 and £90k for person 2, and searches housing choices against three real income-growth paths for corporate careers.
            </p>
            <p className="helper-text">
              You can switch the optimizer between private school off and private school on. That changes only the optimizer assumption set until you apply a selected result back into the planner.
            </p>
            <p className="helper-text">
              This optimizer now tests a 9-case matrix: income growth 2.0% / 3.5% / 5.0%, crossed with correlated market growth cases where ISA/property move together at 2.5%/0.5%, 4.0%/1.5%, and 5.5%/2.5% in real terms.
            </p>
            <p className="helper-text">
              The first house is fixed to {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}. Housing inputs searched here are explicit deposit and mortgage ranges. For upgrade paths, house 1 value is deposit plus mortgage and can start from {formatCurrency(OPTIMIZER_MIN_FIRST_PROPERTY_VALUE)}, or from {formatCurrency(OPTIMIZER_EARLY_UPGRADE_MIN_FIRST_PROPERTY_VALUE)} if the second move happens by {OPTIMIZER_EARLY_UPGRADE_YEAR_CUTOFF}. One-home paths are later filtered by the stricter {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} first-house rule. The first-house mortgage cannot exceed {formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)}. In the upgrade path, the extra deposit plus extra mortgage must be between {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} and {formatCurrency(OPTIMIZER_MAX_UPGRADE_VALUE)}.
            </p>
            <p className="helper-text">
              If the first house total is below {formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}, the upgrade must happen by {OPTIMIZER_FAST_UPGRADE_YEAR_MAX}. Otherwise the latest upgrade year is {OPTIMIZER_LATE_UPGRADE_YEAR_MAX}. House move costs include stamp duty, purchase legal fees, and first-home sale costs.
            </p>
            <p className="helper-text">
              {`Results are only kept if liquid cash before the age-${END_AGE} mortgage payoff stays positive, `}
              one-home plans buy at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} in {OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}, two-home plans reach at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} on the second purchase value, there is no funding gap, cumulative shortfall, or capitalised interest, and total mortgage outstanding never goes above {formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)}. The default objective is balanced end net worth, but you can switch the objective buttons below to optimize for cash end, property value, or a big first house.
            </p>
            <p className="helper-text">
              Mode selected: {optimizerModeLabel}. {optimizerModeDescription}
            </p>
            <p className="helper-text">
              Search type: {displayOptimizerSearchMeta?.isExhaustive ? 'full stepped search across every value in the active ranges' : 'sampled browser preview across the active ranges'}.
              {displayOptimizerSearchMeta && !displayOptimizerSearchMeta.isExhaustive
                ? ` The full stepped grid would require ${displayOptimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations, so the browser preview only samples the range to stay responsive.`
                : displayOptimizerSearchMeta
                  ? ` The current browser run covers ${displayOptimizerSearchMeta.exactScenarioCount.toLocaleString()} assumption-path combinations exactly.`
                  : ''}
            </p>
            <p className="helper-text">
              {`"Tested" means the number of housing combinations the optimizer actually ran for that assumption case. "Success rate" means the share that passed every hard rule: positive liquid cash before the age-${END_AGE} mortgage payoff, `}
              one-home plans needing at least {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} on the first house, two-home plans needing at least {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)} on the second purchase value, no funding gap, no cumulative shortfall, no capitalised interest, and mortgage balances within the caps.
            </p>
            <div className="robustness-explainer-grid">
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">How combinations were identified</div>
                <div className="optimizer-result-sub">
                  The optimizer builds a stepped grid from the active deposit, mortgage, year, and mortgage-budget ranges on this page. Each housing combination is then crossed with {optimizerCaseCount} fixed assumption cases from the income-growth and market-growth matrix.
                </div>
              </div>
              <div className="robustness-explainer-card">
                <div className="optimizer-result-title">How many were tested</div>
                <div className="optimizer-result-sub">
                  {displayOptimizerSearchMeta
                    ? `${displayOptimizerSearchMeta.testedScenarioCount.toLocaleString()} assumption-path combinations were tested in this ${displayOptimizerSearchMeta.isExhaustive ? 'exact' : 'preview'} run. ${displayOptimizerSearchMeta.feasibleScenarioCount != null ? `${displayOptimizerSearchMeta.feasibleScenarioCount.toLocaleString()} passed all hard rules.` : ''}`
                    : 'Search counts are not available yet.'}
                </div>
              </div>
              {precomputedStoredResults.length > 0 && (
                <div className="robustness-explainer-card">
                  <div className="optimizer-result-title">Why only some are shown</div>
                  <div className="optimizer-result-sub">
                    The terminal run stores a curated top slice on the page rather than every passing combination, so the UI stays responsive. You are seeing {precomputedStoredResults.length.toLocaleString()} stored examples from {precomputedOptimizerSearchMeta?.feasibleScenarioCount?.toLocaleString() ?? '0'} passing combinations.
                  </div>
                </div>
              )}
            </div>
            <div className="optimizer-detail-list">
              {optimizerCoverageNotes.map((note) => (
                <div key={note}>{note}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="optimizer-mode-row">
        <button
          type="button"
          className={`view-tab${optimizerPropertyMode === 'both' ? ' view-tab-active' : ''}`}
          onClick={() => setOptimizerPropertyMode('both')}
        >
          Let optimizer choose
        </button>
        <button
          type="button"
          className={`view-tab${optimizerPropertyMode === 'one' ? ' view-tab-active' : ''}`}
          onClick={() => setOptimizerPropertyMode('one')}
        >
          Keep one home
        </button>
        <button
          type="button"
          className={`view-tab${optimizerPropertyMode === 'two' ? ' view-tab-active' : ''}`}
          onClick={() => setOptimizerPropertyMode('two')}
        >
          Buy then upgrade
        </button>
      </div>

      <div className="optimizer-mode-row">
        {optimizerObjectiveDefinitions.map((objective) => (
          <button
            key={objective.id}
            type="button"
            className={`view-tab${selectedOptimizerObjective === objective.id ? ' view-tab-active' : ''}`}
            onClick={() => setSelectedOptimizerObjective(objective.id)}
          >
            {objective.label}
          </button>
        ))}
      </div>

      <div className="helper-text">
        Optimize for: {selectedOptimizerObjectiveDefinition.label}. {selectedOptimizerObjectiveDefinition.description} Use the private school buttons below to rerun the same objective under school-off or school-on assumptions.
      </div>

      <div className="optimizer-mode-row">
        <button
          type="button"
          className={`view-tab${!optimizerUsePrivateSchool ? ' view-tab-active' : ''}`}
          onClick={() => setOptimizerUsePrivateSchool(false)}
        >
          Private school off
        </button>
        <button
          type="button"
          className={`view-tab${optimizerUsePrivateSchool ? ' view-tab-active' : ''}`}
          onClick={() => setOptimizerUsePrivateSchool(true)}
        >
          Private school on
        </button>
      </div>

      <div className="assumptions-box">
        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowOptimizerAssumptions((prev) => !prev)}
        >
          {showOptimizerAssumptions ? 'Hide frozen assumptions' : 'Show frozen assumptions'}
        </button>
        {showOptimizerAssumptions && (
          <>
            <h3 className="assumptions-title">Frozen assumptions during search</h3>
            <div className="assumptions-list">
              {optimizerFrozenAssumptions.map((assumption) => (
                <div key={assumption} className="assumption-item">
                  {assumption}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="optimizer-range-summary">
        <div className="summary-card summary-accent-blue">
          <div className="summary-label">First House Year</div>
          <div className="summary-value">{OPTIMIZER_FIXED_FIRST_HOUSE_YEAR}</div>
          <div className="summary-sub">
            Fixed requirement for every optimizer result
          </div>
        </div>
        <div className="summary-card summary-accent-blue">
          <div className="summary-label">First House Total Range</div>
          <div className="summary-value">
            {formatCurrency(optimizerFirstHouseTotalMin)} to {formatCurrency(optimizerFirstHouseTotalMax)}
          </div>
          <div className="summary-sub">
            Deposit + mortgage search range; one-home feasibility later needs {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)}
          </div>
        </div>
        <div className="summary-card summary-accent-green">
          <div className="summary-label">Upgrade Year Rule</div>
          <div className="summary-value">{optimizerUpgradeYearRuleText}</div>
          <div className="summary-sub">
            Based on whether the first house total is below or above {formatCurrency(OPTIMIZER_FIRST_HOUSE_FAST_UPGRADE_THRESHOLD)}
          </div>
        </div>
        <div className="summary-card summary-accent-green">
          <div className="summary-label">Mortgage Caps</div>
          <div className="summary-value">
            {formatCurrency(OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE)} / {formatCurrency(OPTIMIZER_MAX_TOTAL_MORTGAGE)}
          </div>
          <div className="summary-sub">
            First-house mortgage max / peak total mortgage max at any point
          </div>
        </div>
        {showOptimizerSecondHouseControls && (
          <div className="summary-card summary-accent-green">
            <div className="summary-label">Upgrade Total Range</div>
            <div className="summary-value">
              {formatCurrency(optimizerUpgradeTotalMin)} to {formatCurrency(optimizerUpgradeTotalMax)}
            </div>
            <div className="summary-sub">
              Extra deposit + extra mortgage, kept between {formatCurrency(OPTIMIZER_MIN_UPGRADE_VALUE)} and {formatCurrency(OPTIMIZER_MAX_UPGRADE_VALUE)}
            </div>
          </div>
        )}
        <div className="summary-card summary-accent-cyan">
          <div className="summary-label">House Value Rule</div>
          <div className="summary-value">
            {formatCurrency(OPTIMIZER_MIN_ONE_HOME_FIRST_PROPERTY_VALUE)} / {formatCurrency(OPTIMIZER_MIN_SECOND_HOME_PURCHASE_VALUE)}
          </div>
          <div className="summary-sub">
            One-home first house minimum / two-home second purchase minimum
          </div>
        </div>
        <div className="summary-card summary-accent-cyan">
          <div className="summary-label">Fixed Legal Fees</div>
          <div className="summary-value">
            {formatCurrency(FIRST_HOUSE_LEGAL_FEES)} / {formatCurrency(SECOND_HOUSE_LEGAL_FEES)}
          </div>
          <div className="summary-sub">
            First purchase / upgrade purchase, plus sale costs of {FIRST_HOME_SALE_AGENT_FEE_PCT.toFixed(1)}% + {formatCurrency(FIRST_HOME_SALE_LEGAL_FEES)}
          </div>
        </div>
      </div>

      <div className="advanced-grid optimizer-grid">
        <RangeSlider
          label="First Deposit Min"
          value={optimizerFirstHouseDepositMin}
          min={0}
          max={1500000}
          step={50000}
          onChange={setOptimizerFirstHouseDepositMin}
          formatValue={formatCurrency}
        />
        <RangeSlider
          label="First Deposit Max"
          value={optimizerFirstHouseDepositMax}
          min={0}
          max={1500000}
          step={50000}
          onChange={setOptimizerFirstHouseDepositMax}
          formatValue={formatCurrency}
        />
        <RangeSlider
          label="First Mortgage Min"
          value={optimizerFirstHouseMortgageMin}
          min={0}
          max={OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE}
          step={50000}
          onChange={setOptimizerFirstHouseMortgageMin}
          formatValue={formatCurrency}
        />
        <RangeSlider
          label="First Mortgage Max"
          value={optimizerFirstHouseMortgageMax}
          min={0}
          max={OPTIMIZER_MAX_FIRST_HOUSE_MORTGAGE}
          step={50000}
          onChange={setOptimizerFirstHouseMortgageMax}
          formatValue={formatCurrency}
        />
        <RangeSlider
          label="Mortgage % Early Range Start"
          value={optimizerEarlyMortgagePctMin}
          min={5}
          max={35}
          step={1}
          onChange={setOptimizerEarlyMortgagePctMin}
          formatValue={(value) => `${value}%`}
        />
        <RangeSlider
          label="Mortgage % Early Range End"
          value={optimizerEarlyMortgagePctMax}
          min={5}
          max={35}
          step={1}
          onChange={setOptimizerEarlyMortgagePctMax}
          formatValue={(value) => `${value}%`}
        />
        {showOptimizerSecondHouseControls && (
          <>
            <RangeSlider
              label="Upgrade Deposit Min"
              value={optimizerSecondHouseDepositMin}
              min={0}
              max={1000000}
              step={50000}
              onChange={setOptimizerSecondHouseDepositMin}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="Upgrade Deposit Max"
              value={optimizerSecondHouseDepositMax}
              min={0}
              max={1000000}
              step={50000}
              onChange={setOptimizerSecondHouseDepositMax}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="Upgrade Mortgage Min"
              value={optimizerSecondHouseMortgageMin}
              min={0}
              max={OPTIMIZER_MAX_TOTAL_MORTGAGE}
              step={50000}
              onChange={setOptimizerSecondHouseMortgageMin}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="Upgrade Mortgage Max"
              value={optimizerSecondHouseMortgageMax}
              min={0}
              max={OPTIMIZER_MAX_TOTAL_MORTGAGE}
              step={50000}
              onChange={setOptimizerSecondHouseMortgageMax}
              formatValue={formatCurrency}
            />
            <RangeSlider
              label="Second House Year Min"
              value={optimizerSecondHouseYearMin}
              min={startYear + 1}
              max={OPTIMIZER_LATE_UPGRADE_YEAR_MAX}
              step={1}
              onChange={setOptimizerSecondHouseYearMin}
              formatValue={(value) => value}
            />
            <RangeSlider
              label="Second House Year Max"
              value={optimizerSecondHouseYearMax}
              min={startYear + 1}
              max={OPTIMIZER_LATE_UPGRADE_YEAR_MAX}
              step={1}
              onChange={setOptimizerSecondHouseYearMax}
              formatValue={(value) => value}
            />
            <RangeSlider
              label="Mortgage % Later Range Start"
              value={optimizerLaterMortgagePctMin}
              min={5}
              max={50}
              step={1}
              onChange={setOptimizerLaterMortgagePctMin}
              formatValue={(value) => `${value}%`}
            />
            <RangeSlider
              label="Mortgage % Later Range End"
              value={optimizerLaterMortgagePctMax}
              min={5}
              max={50}
              step={1}
              onChange={setOptimizerLaterMortgagePctMax}
              formatValue={(value) => `${value}%`}
            />
          </>
        )}
      </div>

      {selectedOptimizerResult && (
        <div className="optimizer-selected-card">
          <div className="optimizer-result-header">
            <div>
              <div className="optimizer-result-title">
                {precomputedStoredResults.length
                  ? 'Selected full-search combination'
                  : 'Selected preview combination'}
              </div>
              <div className="optimizer-result-sub">
                {precomputedStoredResults.length
                  ? `The buttons below switch between the best combination from each income-growth and market-growth case for the "${selectedOptimizerObjectiveDefinition.label}" objective using the terminal-side full search.`
                  : `The buttons below switch between the best combinations from the browser-side preview for the "${selectedOptimizerObjectiveDefinition.label}" objective.`}
              </div>
            </div>
            <div className="optimizer-result-meta">
              {precomputedStoredResults.length
                ? `${precomputedStoredResults.length.toLocaleString()} stored examples / ${precomputedOptimizerSearchMeta ? precomputedOptimizerSearchMeta.testedScenarioCount.toLocaleString() : '0'} tested`
                : `${optimizerRecommendedResults.length.toLocaleString()} preview winners`}
            </div>
          </div>

          <div className="optimizer-choice-row">
            {displayOptimizerRecommendedResults.map((result, index) => {
              const resultKey = getOptimizerResultKey(result);
              return (
                <button
                  key={resultKey}
                  type="button"
                  className={`optimizer-choice-button${resultKey === getOptimizerResultKey(selectedOptimizerResult) ? ' optimizer-choice-active' : ''}`}
                  onClick={() => setSelectedOptimizerResultKey(resultKey)}
                >
                  #{index + 1} {result.assumptionCase.incomeCase.shortLabel} income / {result.assumptionCase.marketCase.shortLabel} market · {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'}
                </button>
              );
            })}
          </div>

          <div className="optimizer-metric-grid">
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">End Net Worth</div>
              <div className="summary-value">{formatCurrency(getOptimizerNetWorth(selectedOptimizerResult))}</div>
              <div className="summary-sub">Post-payoff cash plus home equity</div>
            </div>
            <div className="summary-card summary-accent-cyan">
              <div className="summary-label">Cash End After Payoff</div>
              <div className="summary-value">{formatCurrency(selectedOptimizerResult.cashEnd)}</div>
              <div className="summary-sub">{`Liquid cash left after the age-${END_AGE} mortgage payoff`}</div>
            </div>
            <div className="summary-card summary-accent-green">
              <div className="summary-label">{getOptimizerHousingEndLabel(selectedOptimizerResult)}</div>
              <div className="summary-value">{formatCurrency(getOptimizerHousingEndValue(selectedOptimizerResult))}</div>
              <div className="summary-sub">{getOptimizerHousingEndSub(selectedOptimizerResult)}</div>
            </div>
            <div className="summary-card summary-accent-blue">
              <div className="summary-label">Lifetime Interest</div>
              <div className="summary-value">{formatCurrency(selectedOptimizerResult.lifetimeInterestPaid)}</div>
              <div className="summary-sub">{selectedOptimizerResult.enableSecondHouse ? 'Upgrade path' : 'One-home path'}</div>
            </div>
          </div>

          <div className="optimizer-detail-list">
            <div>Assumption case: {selectedOptimizerResult.assumptionCase.incomeCase.label} {selectedOptimizerResult.assumptionCase.incomeGrowth}% | {selectedOptimizerResult.assumptionCase.marketCase.label} | ISA {selectedOptimizerResult.assumptionCase.isaGrowth}% | property {selectedOptimizerResult.assumptionCase.propertyGrowth}%</div>
            <div>Starting cash split: deposit {formatCurrency(selectedOptimizerResult.initialDeposit)} | ISA seed {formatCurrency(selectedOptimizerResult.optimizerIsaSeed)}</div>
            <div>First house: {selectedOptimizerResult.firstHousePurchaseYear} | value {formatCurrency(selectedOptimizerResult.firstHouseValue)} | deposit {formatCurrency(selectedOptimizerResult.initialDeposit)} | mortgage {formatCurrency(selectedOptimizerResult.initialMortgage)}</div>
            <div>Mortgage budget: {selectedOptimizerResult.salaryMortgageEarly}% early{selectedOptimizerResult.enableSecondHouse ? `, ${selectedOptimizerResult.salaryMortgageLater}% after the move` : ''}</div>
            {selectedOptimizerResult.enableSecondHouse ? (
              <div>Upgrade step: {selectedOptimizerResult.secondHouseYear} | extra value {formatCurrency(selectedOptimizerResult.secondUpgradeValue)} | extra deposit {formatCurrency(selectedOptimizerResult.secondHouseDeposit)} | extra mortgage {formatCurrency(selectedOptimizerResult.secondMortgage)}</div>
            ) : (
              <div>Housing path: one property only with no later move</div>
            )}
            <div>{`Age-${END_AGE} mortgage payoff from savings: `}{formatCurrency(selectedOptimizerResult.terminalMortgagePaydown)} | cash before payoff: {formatCurrency(selectedOptimizerResult.cashBeforeTerminalMortgagePayoff)}</div>
            {selectedOptimizerResult.finalMortgageBalance > 0.01 ? (
              <div>End property value: {formatCurrency(selectedOptimizerResult.finalPropertyValue)} | remaining mortgage after payoff: {formatCurrency(selectedOptimizerResult.finalMortgageBalance)}</div>
            ) : (
              <div>End property value after payoff: {formatCurrency(selectedOptimizerResult.finalPropertyValue)} | mortgage fully cleared</div>
            )}
            <div>Lifetime interest paid: {formatCurrency(selectedOptimizerResult.lifetimeInterestPaid)}</div>
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

          <button
            type="button"
            className="preset-button"
            onClick={() => handleApplyOptimizerResult(selectedOptimizerResult)}
          >
            Apply selected combination to planner
          </button>
          <button
            type="button"
            className="preset-button preset-button-secondary"
            onClick={handleDownloadOptimizerSummary}
          >
            Download selected summary
          </button>
        </div>
      )}

      {precomputedStoredResults.length > 0 && (
        <div className="optimizer-selected-card">
          <div className="optimizer-result-header">
            <div>
              <div className="optimizer-result-title">Top combinations from terminal run</div>
              <div className="optimizer-result-sub">
                {`A curated stored set from the last terminal-side full search for the "${selectedOptimizerObjectiveDefinition.label}" objective. This keeps the page light while preserving the strongest scenarios across the tested cases.`}
              </div>
            </div>
            <div className="optimizer-result-meta">
              {precomputedStoredResults.length.toLocaleString()} stored / {precomputedOptimizerSearchMeta ? precomputedOptimizerSearchMeta.feasibleScenarioCount.toLocaleString() : '0'} passing total
            </div>
          </div>

          {precomputedOptimizerGeneratedAt && (
            <div className="optimizer-result-sub">
              Generated: {new Date(precomputedOptimizerGeneratedAt).toLocaleString()}
            </div>
          )}

          <div className="optimizer-pager-row">
            <button
              type="button"
              className="preset-button preset-button-secondary"
              onClick={() => setShowAllFeasibleResults((prev) => !prev)}
            >
              {showAllFeasibleResults ? 'Hide full list' : 'Show full list'}
            </button>
            {showAllFeasibleResults && (
              <>
                <button
                  type="button"
                  className="preset-button preset-button-secondary"
                  onClick={() => setAllFeasiblePage((page) => Math.max(1, page - 1))}
                  disabled={allFeasiblePage === 1}
                >
                  Previous
                </button>
                <div className="optimizer-result-meta">
                  Page {allFeasiblePage} of {allFeasiblePageCount}
                </div>
                <button
                  type="button"
                  className="preset-button preset-button-secondary"
                  onClick={() => setAllFeasiblePage((page) => Math.min(allFeasiblePageCount, page + 1))}
                  disabled={allFeasiblePage === allFeasiblePageCount}
                >
                  Next
                </button>
              </>
            )}
          </div>

          {showAllFeasibleResults && (
            <div className="optimizer-feasible-list">
              {pagedFeasibleResults.map((result, index) => {
                const resultKey = getOptimizerResultKey(result);
                const isSelected = resultKey === getOptimizerResultKey(selectedOptimizerResult);
                const overallIndex = (allFeasiblePage - 1) * allFeasiblePageSize + index + 1;

                return (
                  <button
                    key={resultKey}
                    type="button"
                    className={`optimizer-top-item${isSelected ? ' optimizer-choice-active' : ''}`}
                    onClick={() => setSelectedOptimizerResultKey(resultKey)}
                  >
                    {overallIndex}. {result.assumptionCase.incomeCase.shortLabel} income / {result.assumptionCase.marketCase.shortLabel} market | {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | first {formatCurrency(result.firstHouseValue)} ({formatCurrency(result.initialDeposit)} deposit + {formatCurrency(result.initialMortgage)} mortgage){result.enableSecondHouse ? ` | upgrade ${result.secondHouseYear} +${formatCurrency(result.secondUpgradeValue)}` : ''} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | {getOptimizerHousingEndInlineLabel(result)} {formatCurrency(getOptimizerHousingEndValue(result))} | interest {formatCurrency(result.lifetimeInterestPaid)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!precomputedStoredResults.length && precomputedOptimizerError && (
        <div className="optimizer-empty">
          Full terminal results could not be loaded: {precomputedOptimizerError}
        </div>
      )}

      {displayOptimizerResultsByIncome.map(({ incomeCase, caseResults }) => (
        <div key={incomeCase.id} className="optimizer-income-section">
          <button
            type="button"
            className={`optimizer-income-header optimizer-income-toggle${expandedOptimizerIncomeId === incomeCase.id ? ' optimizer-income-toggle-open' : ''}`}
            onClick={() => setExpandedOptimizerIncomeId(
              expandedOptimizerIncomeId === incomeCase.id ? '' : incomeCase.id,
            )}
          >
            <div>
              <div className="optimizer-result-title">{incomeCase.label}</div>
              <div className="optimizer-result-sub">
                Real income growth {incomeCase.growth}% | {incomeCase.description}
              </div>
            </div>
            <div className="optimizer-income-chevron">
              {expandedOptimizerIncomeId === incomeCase.id ? 'Hide' : 'Show'}
            </div>
          </button>

          {expandedOptimizerIncomeId === incomeCase.id && (
            <div className="optimizer-results-grid">
              {caseResults.map((caseResult) => {
                const {
                  assumptionCase,
                  scenariosTested,
                  feasibleCount,
                  failureSummary = [],
                } = caseResult;
                const {
                  bestResult,
                  topResults = [],
                } = getOptimizerCaseObjectiveBundle(caseResult);

                return (
                  <div key={assumptionCase.id} className="optimizer-result-card">
                    <div className="optimizer-result-header">
                      <div>
                        <div className="optimizer-result-title">
                          {assumptionCase.marketCase.label}
                        </div>
                        <div className="optimizer-result-sub">
                          ISA {assumptionCase.isaGrowth}% | property {assumptionCase.propertyGrowth}% | {assumptionCase.description}
                        </div>
                      </div>
                      <div className="optimizer-result-meta">
                        {`${((feasibleCount / Math.max(1, scenariosTested)) * 100).toFixed(1)}% success rate`}
                      </div>
                    </div>

                    {bestResult ? (
                      <>
                        <div className="optimizer-metric-grid">
                          <div className="summary-card summary-accent-cyan">
                            <div className="summary-label">End Net Worth</div>
                            <div className="summary-value">{formatCurrency(getOptimizerNetWorth(bestResult))}</div>
                            <div className="summary-sub">Post-payoff cash plus home equity</div>
                          </div>
                          <div className="summary-card summary-accent-cyan">
                            <div className="summary-label">Cash End After Payoff</div>
                            <div className="summary-value">{formatCurrency(bestResult.cashEnd)}</div>
                            <div className="summary-sub">{`Liquid cash left after the age-${END_AGE} mortgage payoff`}</div>
                          </div>
                          <div className="summary-card summary-accent-green">
                            <div className="summary-label">{getOptimizerHousingEndLabel(bestResult)}</div>
                            <div className="summary-value">{formatCurrency(getOptimizerHousingEndValue(bestResult))}</div>
                            <div className="summary-sub">{getOptimizerHousingEndSub(bestResult)}</div>
                          </div>
                          <div className="summary-card summary-accent-blue">
                            <div className="summary-label">Lifetime Interest</div>
                            <div className="summary-value">{formatCurrency(bestResult.lifetimeInterestPaid)}</div>
                            <div className="summary-sub">{bestResult.enableSecondHouse ? 'Two-property path' : 'One-property path'}</div>
                          </div>
                        </div>

                        <div className="optimizer-detail-list">
                          <div>Quick preview options in this case: {topResults.length}</div>
                        </div>

                        <div className="optimizer-top-list">
                          {topResults.map((result, index) => {
                            const resultKey = getOptimizerResultKey(result);
                            const isSelected = resultKey === getOptimizerResultKey(selectedOptimizerResult || bestResult);

                            return (
                              <button
                                key={resultKey}
                                type="button"
                                className={`optimizer-top-item${isSelected ? ' optimizer-choice-active' : ''}`}
                                onClick={() => setSelectedOptimizerResultKey(resultKey)}
                              >
                                Preview {index + 1}: {result.enableSecondHouse ? 'Upgrade path' : 'One-home path'} | net worth {formatCurrency(getOptimizerNetWorth(result))} | cash {formatCurrency(result.cashEnd)} | {getOptimizerHousingEndInlineLabel(result)} {formatCurrency(getOptimizerHousingEndValue(result))} | interest {formatCurrency(result.lifetimeInterestPaid)}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="preset-button preset-button-secondary"
                          onClick={() => setSelectedOptimizerResultKey(getOptimizerResultKey(bestResult))}
                        >
                          Select this case&apos;s best combination
                        </button>
                      </>
                    ) : (
                      <div className="optimizer-empty">
                        <div>No feasible plan found in the current search ranges.</div>
                        {failureSummary.length > 0 && (
                          <div className="optimizer-failure-list">
                            {failureSummary.map((failure) => (
                              <div key={failure.key}>
                                {failure.label} {failure.count}/{scenariosTested} tested ({failure.share.toFixed(0)}%).
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OptimizerTabSection;
