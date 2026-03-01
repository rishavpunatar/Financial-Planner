# Robustness analysis

Generated: 2026-03-01T21:56:18.258Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 1080
- Candidate strategies: 80
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 300k to GBP 300k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 100% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S80 | Two-home | GBP 250k | GBP 300k | GBP 2.20m | GBP 502k | 50.0% | 6.0% |
| 2 | S76 | Two-home | GBP 250k | GBP 300k | GBP 2.19m | GBP 533k | 44.4% | 7.5% |
| 3 | S75 | Two-home | GBP 250k | GBP 250k | GBP 2.23m | GBP 468k | 36.4% | 3.9% |
| 4 | S72 | Two-home | GBP 250k | GBP 300k | GBP 2.19m | GBP 565k | 37.5% | 9.3% |
| 5 | S78 | Two-home | GBP 250k | GBP 350k | GBP 2.16m | GBP 588k | 34.4% | 8.5% |
| 6 | S34 | Two-home | GBP 250k | GBP 500k | GBP 1.86m | GBP 922k | 50.2% | 0.0% |
| 7 | S27 | Two-home | GBP 250k | GBP 500k | GBP 1.85m | GBP 920k | 47.4% | 0.0% |
| 8 | S77 | Two-home | GBP 250k | GBP 250k | GBP 2.20m | GBP 519k | 24.1% | 4.3% |
| 9 | S36 | Two-home | GBP 250k | GBP 500k | GBP 1.83m | GBP 951k | 44.7% | 0.0% |
| 10 | S28 | Two-home | GBP 250k | GBP 500k | GBP 1.88m | GBP 886k | 41.6% | 0.0% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S67 | GBP 2.48m | GBP 92k | 0.2% | 25.1 |

## Charts

- [Scatter: expected end net worth vs regret CVaR](./scatter-net-worth-vs-regret.svg)
- [CDF: top robust strategies](./cdf-top-robust-strategies.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
