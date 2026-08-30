import React, { useId, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const MoneyField = ({
  label,
  value,
  onChange,
  help,
  min = 0,
  max = 2000000,
  step = 1000,
}) => {
  const id = useId();

  return (
    <div className="setup-field">
      <label htmlFor={id}>{label}</label>
      <div className="setup-input-wrap">
        <span aria-hidden="true">£</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(clamp(next, min, max));
          }}
          aria-describedby={help ? `${id}-help` : undefined}
        />
      </div>
      {help && <small id={`${id}-help`}>{help}</small>}
    </div>
  );
};

const NumberField = ({
  label,
  value,
  onChange,
  suffix,
  help,
  min,
  max,
  step = 1,
}) => {
  const id = useId();

  return (
    <div className="setup-field">
      <label htmlFor={id}>{label}</label>
      <div className="setup-input-wrap setup-input-plain">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(clamp(next, min, max));
          }}
          aria-describedby={help ? `${id}-help` : undefined}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      {help && <small id={`${id}-help`}>{help}</small>}
    </div>
  );
};

const ToggleCard = ({ checked, onChange, title, description }) => (
  <label className={`setup-toggle-card${checked ? ' setup-toggle-card-on' : ''}`}>
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="setup-switch" aria-hidden="true" />
  </label>
);

const stepMeta = [
  { label: 'Today', title: 'Start with your household today', eyebrow: 'Step 1 of 4' },
  { label: 'Homes', title: 'Describe the home plan', eyebrow: 'Step 2 of 4' },
  { label: 'Life', title: 'Add the life events that matter', eyebrow: 'Step 3 of 4' },
  { label: 'Review', title: 'Choose sensible long-term assumptions', eyebrow: 'Step 4 of 4' },
];

const GuidedSetup = ({ values, actions, formatCurrency, onClose, onFinish }) => {
  const [step, setStep] = useState(0);
  const currentStep = stepMeta[step];
  const firstHomeValue = values.initialDeposit + values.initialMortgage;
  const upgradeAmount = values.secondHouseDeposit + values.secondMortgage;
  const householdIncome = values.income1Start + values.income2Start;

  return (
    <section className="setup-shell" aria-labelledby="setup-title">
      <aside className="setup-aside">
        <div className="setup-aside-brand">
          <span className="setup-kicker">Guided setup</span>
          <h2>Build your first plan in a few minutes.</h2>
          <p>
            Use estimates—you can fine-tune every assumption in the full model afterwards.
          </p>
        </div>

        <ol className="setup-steps" aria-label="Setup progress">
          {stepMeta.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                className={index === step ? 'setup-step-active' : ''}
                onClick={() => setStep(index)}
                aria-current={index === step ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{index < step ? 'Complete' : index === step ? 'In progress' : 'Up next'}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="setup-privacy-note">
          <span className="privacy-dot" />
          <span><strong>Private by design</strong>Your plan runs in this browser.</span>
        </div>
      </aside>

      <div className="setup-main">
        <div className="setup-main-header">
          <div>
            <span className="setup-eyebrow">{currentStep.eyebrow}</span>
            <h2 id="setup-title">{currentStep.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close guided setup">
            ×
          </button>
        </div>

        {step === 0 && (
          <div className="setup-step-content">
            <p className="setup-lead">
              Enter annual gross income and the cash you could use for a deposit or investments.
              The model estimates take-home pay using UK tax rules.
            </p>
            <div className="setup-field-grid">
              <MoneyField
                label="Your annual income"
                value={values.income1Start}
                onChange={actions.setIncome1Start}
                min={0}
                max={500000}
                step={5000}
                help="Gross pay before tax and pension."
              />
              <MoneyField
                label="Partner's annual income"
                value={values.income2Start}
                onChange={actions.setIncome2Start}
                min={0}
                max={500000}
                step={5000}
                help="Enter £0 for a single-income household."
              />
              <MoneyField
                label="Cash available now"
                value={values.initialCash}
                onChange={actions.setInitialCash}
                step={5000}
                help="Cash that can be split between a home deposit and ISA."
              />
              <MoneyField
                label="Annual living costs"
                value={values.baseLivingCost}
                onChange={actions.setBaseLivingCost}
                min={0}
                max={250000}
                step={1000}
                help="Household spending, excluding mortgage payments."
              />
            </div>
            <div className="setup-insight">
              <span>Household starting income</span>
              <strong>{formatCurrency(householdIncome)} a year</strong>
              <small>All future results are shown in today's money, so they remain easy to compare.</small>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="setup-step-content">
            <p className="setup-lead">
              Your first home price is the deposit plus mortgage. If you expect to move later,
              add only the extra deposit and borrowing used for the upgrade.
            </p>
            <div className="setup-section-label">First home</div>
            <div className="setup-field-grid setup-field-grid-3">
              <MoneyField
                label="Deposit"
                value={values.initialDeposit}
                onChange={actions.setInitialDeposit}
                max={values.initialCash}
                step={5000}
                help={`${formatCurrency(values.isaSeed)} stays invested.`}
              />
              <MoneyField
                label="Mortgage"
                value={values.initialMortgage}
                onChange={actions.setInitialMortgage}
                max={1500000}
                step={10000}
              />
              <NumberField
                label="Purchase year"
                value={values.firstHousePurchaseYear}
                onChange={actions.setFirstHousePurchaseYear}
                min={values.startYear}
                max={values.firstHouseYearMax}
                help="When the first purchase completes."
              />
            </div>
            <div className="setup-value-strip">
              <span>Planned first-home value</span>
              <strong>{formatCurrency(firstHomeValue)}</strong>
            </div>

            <ToggleCard
              checked={values.enableSecondHouse}
              onChange={actions.setEnableSecondHouse}
              title="Plan for a later move"
              description="Model selling the first home and upgrading to another property."
            />

            {values.enableSecondHouse && (
              <div className="setup-field-grid setup-field-grid-3 setup-conditional">
                <MoneyField
                  label="Extra deposit at move"
                  value={values.secondHouseDeposit}
                  onChange={actions.setSecondHouseDeposit}
                  max={800000}
                  step={10000}
                />
                <MoneyField
                  label="Extra mortgage at move"
                  value={values.secondMortgage}
                  onChange={actions.setSecondMortgage}
                  max={800000}
                  step={10000}
                />
                <NumberField
                  label="Move year"
                  value={values.secondHouseYear}
                  onChange={actions.setSecondHouseYear}
                  min={values.firstHousePurchaseYear + 1}
                  max={values.secondHouseYearMax}
                  help={`Adds ${formatCurrency(upgradeAmount)} of buying power.`}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="setup-step-content">
            <p className="setup-lead">
              Family choices can change the plan more than market returns. Add the events you want
              included; you can switch them off or adjust costs later.
            </p>
            <div className="setup-field-grid">
              <NumberField
                label="First child's birth year"
                value={values.child1BirthYear}
                onChange={actions.setChild1BirthYear}
                min={2027}
                max={2055}
                help="Includes lower partner income in the birth year."
              />
              <NumberField
                label="Second child's birth year"
                value={values.child2BirthYear}
                onChange={actions.setChild2BirthYear}
                min={2027}
                max={2055}
              />
              <MoneyField
                label="Future gifts to children"
                value={values.combinedGiftAmount}
                onChange={actions.setCombinedGiftAmount}
                max={1000000}
                step={5000}
                help="Split equally and modelled when each child turns 27."
              />
              <MoneyField
                label="Yearly emergency reserve"
                value={values.emergencyFundAnnual}
                onChange={actions.setEmergencyFundAnnual}
                max={50000}
                step={1000}
                help="A recurring buffer held back from spending."
              />
            </div>
            <ToggleCard
              checked={values.usePrivateSchool}
              onChange={actions.setUsePrivateSchool}
              title="Include private school fees"
              description="Adds fees in today's money between ages 11 and 18."
            />
            <div className="setup-context-note">
              <strong>Already included</strong>
              <span>Childcare and child costs by age, a car purchase, three recessions, and future tax-band drag.</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step-content">
            <p className="setup-lead">
              These are real rates—growth after inflation. Conservative estimates usually make a
              more useful base case than optimistic forecasts.
            </p>
            <div className="setup-field-grid">
              <NumberField
                label="Mortgage interest rate"
                value={values.mortgageRate}
                onChange={actions.setMortgageRate}
                suffix="%"
                min={0}
                max={15}
                step={0.1}
                help="Annual borrowing cost after inflation."
              />
              <NumberField
                label="Property growth"
                value={values.realGrowthProperty}
                onChange={actions.setRealGrowthProperty}
                suffix="%"
                min={-5}
                max={10}
                step={0.1}
                help="Annual house-price growth after inflation."
              />
              <NumberField
                label="ISA growth"
                value={values.isaGrowth}
                onChange={actions.setIsaGrowth}
                suffix="%"
                min={-5}
                max={15}
                step={0.1}
                help="Annual investment return after inflation."
              />
              <NumberField
                label="Career income growth"
                value={values.incomeGrowth}
                onChange={actions.setIncomeGrowth}
                suffix="%"
                min={0}
                max={10}
                step={0.1}
                help="Real annual growth before the built-in taper."
              />
            </div>
            <div className="setup-review-card">
              <div>
                <span>Base plan ready</span>
                <strong>{formatCurrency(firstHomeValue)} first home</strong>
              </div>
              <div>
                <span>Starting household income</span>
                <strong>{formatCurrency(householdIncome)}</strong>
              </div>
              <div>
                <span>Cash left invested</span>
                <strong>{formatCurrency(values.isaSeed)}</strong>
              </div>
            </div>
            <p className="setup-final-note">
              Nothing here is a prediction or financial advice. ClearPlan is a scenario tool: use
              it to compare choices, then pressure-test the ones you like.
            </p>
          </div>
        )}

        <div className="setup-footer">
          <button
            type="button"
            className="button-ghost"
            onClick={() => step === 0 ? onClose() : setStep((current) => current - 1)}
          >
            {step === 0 ? 'I’ll explore myself' : 'Back'}
          </button>
          <div className="setup-progress" aria-hidden="true">
            {stepMeta.map((item, index) => (
              <span key={item.label} className={index <= step ? 'setup-progress-on' : ''} />
            ))}
          </div>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              if (step < stepMeta.length - 1) setStep((current) => current + 1);
              else onFinish();
            }}
          >
            {step === stepMeta.length - 1 ? 'See my plan' : 'Continue'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default GuidedSetup;
