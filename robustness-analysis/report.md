# Robustness analysis

Generated: 2026-03-07T17:52:03.077Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 36
- Candidate strategies: 307815
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 2 random path draws per bucket. Inside each bucket, the run perturbs yearly mortgage, ISA, property, and income paths, plus living-cost growth, fiscal-drag tax thresholds, recession timing and severity, and one-or-two age-biased redundancy shocks for person 1.
- Strategy sampling: Housing strategies are now evaluated across the full explicit grid of allowed deposit, mortgage, year, and salary-payment combinations with no shortlist screening.
- Explicit strategy grid count: 307815
- Fully tested setups in the global run: 307815
- Full simulations run: 11,081,340
- Runtime: 486.4 seconds
- Display setups kept for interactive UI: 5000
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 900k in 2027; two-home second purchase at least GBP 900k
- Sampled dimensions: income path shocks, ISA return path shocks, property growth path shocks, mortgage-rate path shocks, living-cost growth regimes, tax-threshold drag regimes, recession timing and severity, age-biased redundancy years, private school on/off
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, mortgage-rate, cost-growth, tax-drag, redundancy, and recession shocks are random, there is no finite master list of all possible futures to enumerate.

## Confidence and scope

- Robustness winners are now computed across the full explicit strategy grid for this run.
- 36 weighted futures were sampled; this is a Monte Carlo estimate, not an exhaustive list of every possible future.
- The plateau heatmap is a balanced-robustness map over the explicit first-deposit / first-mortgage grid.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 250k to GBP 250k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 100% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 900k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking now prioritises private-school optionality, then private-school-on success, then expected end cash.

- To keep the app responsive, the interactive table/charts include 5,000 setups sampled from 307,815 tested setups (roughly every 61th robust-ranked setup, plus all objective leaders).

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S1143 | Two-home | GBP 250k | GBP 250k | GBP 2.75m | 74.4% | 66.0% |
| 2 | S13068 | Two-home | GBP 250k | GBP 300k | GBP 2.73m | 71.6% | 66.0% |
| 3 | S24993 | Two-home | GBP 250k | GBP 350k | GBP 2.70m | 67.4% | 66.0% |
| 4 | S9228 | Two-home | GBP 250k | GBP 250k | GBP 2.83m | 78.0% | 64.0% |
| 5 | S5178 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | 73.8% | 64.0% |
| 6 | S5222 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | 66.8% | 64.0% |
| 7 | S6302 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | 65.4% | 64.0% |
| 8 | S5193 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | 73.8% | 64.0% |
| 9 | S5237 | Two-home | GBP 250k | GBP 250k | GBP 2.79m | 69.6% | 64.0% |
| 10 | S21153 | Two-home | GBP 250k | GBP 300k | GBP 2.79m | 75.2% | 64.0% |

## Pareto frontier

| Strategy | Expected Net Worth | Feasibility | Composite Score |
| --- | --- | --- | --- |
| S8152 | GBP 3.16m | 0.0% | 19.9 |
| S8138 | GBP 3.17m | 0.0% | 19.9 |
| S8125 | GBP 3.17m | 0.0% | 19.9 |
| S8111 | GBP 3.17m | 0.0% | 19.9 |
| S8109 | GBP 3.17m | 0.0% | 19.9 |
| S8120 | GBP 3.17m | 0.0% | 19.9 |
| S8107 | GBP 3.17m | 0.0% | 19.9 |
| S8106 | GBP 3.17m | 0.0% | 19.9 |
| S8105 | GBP 3.17m | 0.0% | 19.9 |

## Charts

- [Scatter: balanced robustness, all strategies](./scatter-net-worth-vs-feasibility-robust-overall.svg)
- [Scatter: balanced robustness, one-home only](./scatter-net-worth-vs-feasibility-robust-one-home.svg)
- [Scatter: balanced robustness, two-home only](./scatter-net-worth-vs-feasibility-robust-two-home.svg)
- [CDF: balanced robustness, all strategies](./cdf-top-robust-strategies-robust-overall.svg)
- [CDF: balanced robustness, one-home only](./cdf-top-robust-strategies-robust-one-home.svg)
- [CDF: balanced robustness, two-home only](./cdf-top-robust-strategies-robust-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
