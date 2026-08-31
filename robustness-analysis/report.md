# Robustness analysis

Generated: 2026-03-06T19:36:23.778Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 72000
- Candidate strategies: 225
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 4,000 random path draws per bucket. Inside each bucket, the run perturbs yearly mortgage, ISA, property, and income paths, plus living-cost growth, fiscal-drag tax thresholds, recession timing and severity, and one-or-two age-biased redundancy shocks for person 1.
- Strategy sampling: Housing strategies start from an explicit grid across the allowed deposit, mortgage, year, and salary-payment ranges. A smaller screening run ranks that grid first, then the strongest and most representative candidates are carried into the full 72,000-scenario robustness run.
- Explicit strategy grid before screening: 10191
- Strategies carried into the full robustness run: 225
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 900k in 2027; two-home second purchase at least GBP 900k
- Sampled dimensions: income path shocks, ISA return path shocks, property growth path shocks, mortgage-rate path shocks, living-cost growth regimes, tax-threshold drag regimes, recession timing and severity, age-biased redundancy years, private school on/off
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, mortgage-rate, cost-growth, tax-drag, redundancy, and recession shocks are random, there is no finite master list of all possible futures to enumerate.

## Confidence and scope

- Robustness winners are the best strategies inside the screened candidate catalog carried into the full run, not across every theoretical housing strategy.
- Regret is measured against the best tested strategy in that screened catalog for each sampled future, not an unknowable global optimum.
- 72,000 weighted futures were sampled; this is a Monte Carlo estimate, not an exhaustive list of every possible future.
- The plateau heatmap is a balanced-robustness screening view over the explicit first-deposit / first-mortgage grid.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 250k to GBP 250k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 0% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 900k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S035 | Two-home | GBP 250k | GBP 250k | GBP 2.69m | GBP 985k | 68.1% | 22.0% |
| 2 | S005 | One-home | GBP 300k | GBP 600k | GBP 2.70m | GBP 980k | 66.9% | 15.7% |
| 3 | S072 | Two-home | GBP 250k | GBP 300k | GBP 2.58m | GBP 1.08m | 66.3% | 21.0% |
| 4 | S006 | One-home | GBP 300k | GBP 600k | GBP 2.73m | GBP 967k | 65.1% | 15.0% |
| 5 | S004 | One-home | GBP 300k | GBP 600k | GBP 2.67m | GBP 1.00m | 63.6% | 18.5% |
| 6 | S036 | Two-home | GBP 250k | GBP 250k | GBP 2.76m | GBP 963k | 63.3% | 11.8% |
| 7 | S037 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | GBP 950k | 61.5% | 11.9% |
| 8 | S091 | Two-home | GBP 250k | GBP 350k | GBP 2.61m | GBP 1.05m | 60.6% | 20.1% |
| 9 | S003 | One-home | GBP 300k | GBP 600k | GBP 2.64m | GBP 1.05m | 55.3% | 22.6% |
| 10 | S053 | Two-home | GBP 250k | GBP 250k | GBP 2.63m | GBP 1.04m | 58.0% | 15.8% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S163 | GBP 3.29m | GBP 558k | 0.0% | 25.0 |

## Charts

The app renders the decision charts interactively from the full strategy catalog. Open the
**Stress-test it** view to filter the path, change the objective, inspect every eligible setup,
and compare the shortlisted winners.
