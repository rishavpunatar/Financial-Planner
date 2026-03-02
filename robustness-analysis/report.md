# Robustness analysis

Generated: 2026-03-02T21:18:34.284Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 54000
- Candidate strategies: 171
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 3,000 random path draws per bucket. Inside each bucket, the run perturbs yearly mortgage, ISA, property, and income paths, plus living-cost growth, fiscal-drag tax thresholds, recession timing and severity, and one-or-two age-biased redundancy shocks for person 1.
- Strategy sampling: Housing strategies start from an explicit grid across the allowed deposit, mortgage, year, and salary-payment ranges. A smaller screening run ranks that grid first, then the strongest and most representative candidates are carried into the full 54,000-scenario robustness run.
- Explicit strategy grid before screening: 3759
- Strategies carried into the full robustness run: 171
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k
- Sampled dimensions: income path shocks, ISA return path shocks, property growth path shocks, mortgage-rate path shocks, living-cost growth regimes, tax-threshold drag regimes, recession timing and severity, age-biased redundancy years, private school on/off
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, mortgage-rate, cost-growth, tax-drag, redundancy, and recession shocks are random, there is no finite master list of all possible futures to enumerate.

## Confidence and scope

- Robustness winners are the best strategies inside the screened candidate catalog carried into the full run, not across every theoretical housing strategy.
- Regret is measured against the best tested strategy in that screened catalog for each sampled future, not an unknowable global optimum.
- 54,000 weighted futures were sampled; this is a Monte Carlo estimate, not an exhaustive list of every possible future.
- The plateau heatmap is a balanced-robustness screening view over the explicit first-deposit / first-mortgage grid.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 600k to GBP 600k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 0% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S001 | One-home | GBP 250k | GBP 600k | GBP 2.19m | GBP 917k | 48.1% | 1.9% |
| 2 | S012 | One-home | GBP 300k | GBP 550k | GBP 2.26m | GBP 854k | 45.8% | 1.3% |
| 3 | S002 | One-home | GBP 250k | GBP 600k | GBP 2.24m | GBP 872k | 45.9% | 1.5% |
| 4 | S013 | One-home | GBP 300k | GBP 550k | GBP 2.30m | GBP 826k | 42.4% | 1.3% |
| 5 | S003 | One-home | GBP 250k | GBP 600k | GBP 2.29m | GBP 838k | 42.5% | 1.4% |
| 6 | S004 | One-home | GBP 250k | GBP 600k | GBP 2.32m | GBP 814k | 38.7% | 1.4% |
| 7 | S014 | One-home | GBP 300k | GBP 550k | GBP 2.32m | GBP 807k | 37.8% | 1.3% |
| 8 | S023 | One-home | GBP 300k | GBP 600k | GBP 2.15m | GBP 968k | 42.1% | 0.7% |
| 9 | S005 | One-home | GBP 250k | GBP 600k | GBP 2.33m | GBP 798k | 34.4% | 1.4% |
| 10 | S024 | One-home | GBP 300k | GBP 600k | GBP 2.21m | GBP 947k | 37.8% | 0.5% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S138 | GBP 2.72m | GBP 333k | 0.0% | 25.0 |

## Charts

- [Scatter: balanced robustness, all strategies](./scatter-net-worth-vs-regret-robust-overall.svg)
- [Scatter: balanced robustness, one-home only](./scatter-net-worth-vs-regret-robust-one-home.svg)
- [Scatter: balanced robustness, two-home only](./scatter-net-worth-vs-regret-robust-two-home.svg)
- [CDF: balanced robustness, all strategies](./cdf-top-robust-strategies-robust-overall.svg)
- [CDF: balanced robustness, one-home only](./cdf-top-robust-strategies-robust-one-home.svg)
- [CDF: balanced robustness, two-home only](./cdf-top-robust-strategies-robust-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
