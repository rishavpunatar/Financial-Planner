# Robustness analysis

Generated: 2026-03-02T00:28:25.478Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 54000
- Candidate strategies: 167
- Scenario sampling: Scenarios are sampled as 3 income cases x 3 market cases x 2 private-school states x 3,000 random path draws per bucket.
- Strategy sampling: Housing strategies now start from an explicit coarse grid across the allowed deposit, mortgage, year, and salary-payment ranges. A smaller screening run ranks that full grid first, then the strongest and most representative candidates are carried into the full 54,000-scenario robustness run.
- Explicit strategy grid before screening: 3759
- Strategies carried into the full robustness run: 167
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k
- Why not every scenario: The housing grid is finite, but the future-path generator is continuous year by year. Once annual income, ISA, property, and mortgage-rate shocks are random, there is no finite master list of all possible futures to enumerate.

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 300k and first mortgage GBP 250k to GBP 550k.

- The plateau contains 2 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 0% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S037 | Two-home | GBP 250k | GBP 250k | GBP 2.32m | GBP 771k | 54.2% | 0.1% |
| 2 | S012 | One-home | GBP 300k | GBP 550k | GBP 2.29m | GBP 793k | 53.8% | 0.1% |
| 3 | S002 | One-home | GBP 250k | GBP 600k | GBP 2.27m | GBP 815k | 53.4% | 0.2% |
| 4 | S013 | One-home | GBP 300k | GBP 550k | GBP 2.33m | GBP 770k | 50.8% | 0.1% |
| 5 | S063 | Two-home | GBP 250k | GBP 300k | GBP 2.21m | GBP 881k | 54.5% | 0.0% |
| 6 | S085 | Two-home | GBP 250k | GBP 400k | GBP 2.25m | GBP 839k | 52.9% | 0.0% |
| 7 | S003 | One-home | GBP 250k | GBP 600k | GBP 2.32m | GBP 786k | 49.9% | 0.2% |
| 8 | S001 | One-home | GBP 250k | GBP 600k | GBP 2.22m | GBP 863k | 52.3% | 0.2% |
| 9 | S042 | Two-home | GBP 250k | GBP 250k | GBP 2.14m | GBP 944k | 54.2% | 0.0% |
| 10 | S023 | One-home | GBP 300k | GBP 600k | GBP 2.18m | GBP 906k | 50.2% | 0.0% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S147 | GBP 2.75m | GBP 298k | 0.0% | 25.0 |

## Charts

- [Scatter: balanced robustness, all strategies](./scatter-net-worth-vs-regret-robust-overall.svg)
- [Scatter: balanced robustness, one-home only](./scatter-net-worth-vs-regret-robust-one-home.svg)
- [Scatter: balanced robustness, two-home only](./scatter-net-worth-vs-regret-robust-two-home.svg)
- [CDF: balanced robustness, all strategies](./cdf-top-robust-strategies-robust-overall.svg)
- [CDF: balanced robustness, one-home only](./cdf-top-robust-strategies-robust-one-home.svg)
- [CDF: balanced robustness, two-home only](./cdf-top-robust-strategies-robust-two-home.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
