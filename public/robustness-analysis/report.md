# Robustness analysis

Generated: 2026-03-01T23:43:09.930Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 54000
- Candidate strategies: 179
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 3,000 random path draws per bucket.
- Strategy sampling: Candidate strategies come from the optimizer-ranked housing plans plus a supplemental one-home grid across the full first deposit and first mortgage search range.
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, and mortgage-rate shocks are random, there is no finite master list of all possible futures to enumerate.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 250k to GBP 250k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 100% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S020 | Two-home | GBP 250k | GBP 250k | GBP 2.23m | GBP 1.01m | 59.3% | 2.8% |
| 2 | S019 | Two-home | GBP 250k | GBP 250k | GBP 2.24m | GBP 1.04m | 59.3% | 2.0% |
| 3 | S174 | One-home | GBP 300k | GBP 550k | GBP 2.30m | GBP 1.12m | 53.9% | 0.1% |
| 4 | S008 | Two-home | GBP 250k | GBP 300k | GBP 2.29m | GBP 927k | 47.4% | 4.7% |
| 5 | S050 | Two-home | GBP 250k | GBP 250k | GBP 2.36m | GBP 1.15m | 53.3% | 0.1% |
| 6 | S004 | Two-home | GBP 250k | GBP 250k | GBP 2.30m | GBP 880k | 45.2% | 5.9% |
| 7 | S003 | Two-home | GBP 250k | GBP 250k | GBP 2.31m | GBP 903k | 45.9% | 4.9% |
| 8 | S009 | Two-home | GBP 250k | GBP 300k | GBP 2.28m | GBP 903k | 46.2% | 5.7% |
| 9 | S051 | Two-home | GBP 250k | GBP 250k | GBP 2.34m | GBP 1.15m | 53.1% | 0.1% |
| 10 | S016 | Two-home | GBP 250k | GBP 350k | GBP 2.27m | GBP 992k | 49.7% | 2.4% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S138 | GBP 2.65m | GBP 398k | 0.0% | 22.4 |
| S135 | GBP 2.73m | GBP 400k | 0.0% | 23.6 |
| S137 | GBP 2.75m | GBP 402k | 0.0% | 23.8 |
| S134 | GBP 2.82m | GBP 422k | 0.0% | 24.6 |

## Charts

- [Scatter: all strategies](./scatter-net-worth-vs-regret-overall.svg)
- [Scatter: one-home only](./scatter-net-worth-vs-regret-one-home.svg)
- [Scatter: two-home only](./scatter-net-worth-vs-regret-two-home.svg)
- [CDF: all top strategies](./cdf-top-robust-strategies-overall.svg)
- [CDF: one-home top strategies](./cdf-top-robust-strategies-one-home.svg)
- [CDF: two-home top strategies](./cdf-top-robust-strategies-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
