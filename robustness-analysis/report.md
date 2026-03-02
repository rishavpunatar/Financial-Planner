# Robustness analysis

Generated: 2026-03-02T18:42:48.763Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 54000
- Candidate strategies: 170
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 3,000 random path draws per bucket. Inside each bucket, the run also perturbs yearly mortgage, ISA, property, and income paths, plus living-cost growth, recession timing, and one-or-two redundancy shocks for person 1.
- Strategy sampling: Housing strategies now start from an explicit coarse grid across the allowed deposit, mortgage, year, and salary-payment ranges. A smaller screening run ranks that full grid first, then the strongest and most representative candidates are carried into the full 54,000-scenario robustness run.
- Explicit strategy grid before screening: 3759
- Strategies carried into the full robustness run: 170
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, mortgage-rate, cost-growth, redundancy, and recession-timing shocks are random, there is no finite master list of all possible futures to enumerate.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 300k and first mortgage GBP 550k to GBP 600k.

- The plateau contains 2 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 0% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S001 | One-home | GBP 250k | GBP 600k | GBP 2.17m | GBP 925k | 48.7% | 1.5% |
| 2 | S012 | One-home | GBP 300k | GBP 550k | GBP 2.24m | GBP 860k | 46.5% | 1.1% |
| 3 | S002 | One-home | GBP 250k | GBP 600k | GBP 2.22m | GBP 877k | 46.4% | 1.2% |
| 4 | S013 | One-home | GBP 300k | GBP 550k | GBP 2.28m | GBP 834k | 42.8% | 1.0% |
| 5 | S003 | One-home | GBP 250k | GBP 600k | GBP 2.27m | GBP 845k | 42.9% | 1.2% |
| 6 | S004 | One-home | GBP 250k | GBP 600k | GBP 2.30m | GBP 824k | 39.3% | 1.2% |
| 7 | S014 | One-home | GBP 300k | GBP 550k | GBP 2.30m | GBP 817k | 38.6% | 1.0% |
| 8 | S023 | One-home | GBP 300k | GBP 600k | GBP 2.13m | GBP 970k | 43.1% | 0.5% |
| 9 | S005 | One-home | GBP 250k | GBP 600k | GBP 2.31m | GBP 810k | 34.4% | 1.2% |
| 10 | S024 | One-home | GBP 300k | GBP 600k | GBP 2.19m | GBP 947k | 38.3% | 0.4% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S148 | GBP 2.71m | GBP 360k | 0.0% | 25.0 |

## Charts

- [Scatter: balanced robustness, all strategies](./scatter-net-worth-vs-regret-robust-overall.svg)
- [Scatter: balanced robustness, one-home only](./scatter-net-worth-vs-regret-robust-one-home.svg)
- [Scatter: balanced robustness, two-home only](./scatter-net-worth-vs-regret-robust-two-home.svg)
- [CDF: balanced robustness, all strategies](./cdf-top-robust-strategies-robust-overall.svg)
- [CDF: balanced robustness, one-home only](./cdf-top-robust-strategies-robust-one-home.svg)
- [CDF: balanced robustness, two-home only](./cdf-top-robust-strategies-robust-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
