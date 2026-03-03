# Robustness analysis

Generated: 2026-03-03T20:53:38.164Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 72000
- Candidate strategies: 257
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 4,000 random path draws per bucket. Inside each bucket, the run perturbs yearly mortgage, ISA, property, and income paths, plus living-cost growth, fiscal-drag tax thresholds, recession timing and severity, and one-or-two age-biased redundancy shocks for person 1.
- Strategy sampling: Housing strategies start from an explicit grid across the allowed deposit, mortgage, year, and salary-payment ranges. A smaller screening run ranks that grid first, then the strongest and most representative candidates are carried into the full 72,000-scenario robustness run.
- Explicit strategy grid before screening: 10221
- Strategies carried into the full robustness run: 257
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k
- Sampled dimensions: income path shocks, ISA return path shocks, property growth path shocks, mortgage-rate path shocks, living-cost growth regimes, tax-threshold drag regimes, recession timing and severity, age-biased redundancy years, private school on/off
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, mortgage-rate, cost-growth, tax-drag, redundancy, and recession shocks are random, there is no finite master list of all possible futures to enumerate.

## Confidence and scope

- Robustness winners are the best strategies inside the screened candidate catalog carried into the full run, not across every theoretical housing strategy.
- Regret is measured against the best tested strategy in that screened catalog for each sampled future, not an unknowable global optimum.
- 72,000 weighted futures were sampled; this is a Monte Carlo estimate, not an exhaustive list of every possible future.
- The plateau heatmap is a balanced-robustness screening view over the explicit first-deposit / first-mortgage grid.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 300k and first mortgage GBP 550k to GBP 600k.

- The plateau contains 2 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 0% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S019 | One-home | GBP 300k | GBP 550k | GBP 2.26m | GBP 964k | 45.9% | 1.3% |
| 2 | S005 | One-home | GBP 250k | GBP 600k | GBP 2.24m | GBP 980k | 46.1% | 1.5% |
| 3 | S018 | One-home | GBP 300k | GBP 550k | GBP 2.20m | GBP 1.04m | 47.8% | 1.6% |
| 4 | S004 | One-home | GBP 250k | GBP 600k | GBP 2.19m | GBP 1.06m | 48.0% | 1.8% |
| 5 | S006 | One-home | GBP 250k | GBP 600k | GBP 2.29m | GBP 938k | 42.6% | 1.4% |
| 6 | S020 | One-home | GBP 300k | GBP 550k | GBP 2.30m | GBP 931k | 42.4% | 1.3% |
| 7 | S068 | Two-home | GBP 250k | GBP 250k | GBP 2.17m | GBP 1.06m | 46.5% | 1.0% |
| 8 | S007 | One-home | GBP 250k | GBP 600k | GBP 2.32m | GBP 921k | 38.8% | 1.4% |
| 9 | S021 | One-home | GBP 300k | GBP 550k | GBP 2.32m | GBP 920k | 37.9% | 1.3% |
| 10 | S003 | One-home | GBP 250k | GBP 600k | GBP 2.15m | GBP 1.15m | 44.5% | 2.8% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S208 | GBP 2.75m | GBP 450k | 0.0% | 25.0 |

## Charts

- [Scatter: balanced robustness, all strategies](./scatter-net-worth-vs-regret-robust-overall.svg)
- [Scatter: balanced robustness, one-home only](./scatter-net-worth-vs-regret-robust-one-home.svg)
- [Scatter: balanced robustness, two-home only](./scatter-net-worth-vs-regret-robust-two-home.svg)
- [CDF: balanced robustness, all strategies](./cdf-top-robust-strategies-robust-overall.svg)
- [CDF: balanced robustness, one-home only](./cdf-top-robust-strategies-robust-one-home.svg)
- [CDF: balanced robustness, two-home only](./cdf-top-robust-strategies-robust-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
