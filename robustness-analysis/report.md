# Robustness analysis

Generated: 2026-03-01T22:28:54.402Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 54000
- Candidate strategies: 173
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2
- House-value rule: one-home first house at least GBP 850k in 2027; two-home second purchase at least GBP 900k

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 250k to GBP 250k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 100% of the plateau cells resolve to a two-home path rather than a one-home path.
- One-home strategies must buy at least GBP 850k in 2027. Two-home strategies must reach at least GBP 900k on the second house purchase value.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S08 | Two-home | GBP 250k | GBP 250k | GBP 2.25m | GBP 486k | 64.3% | 3.3% |
| 2 | S74 | Two-home | GBP 250k | GBP 250k | GBP 2.40m | GBP 395k | 53.3% | 0.3% |
| 3 | S77 | Two-home | GBP 250k | GBP 250k | GBP 2.39m | GBP 402k | 53.9% | 0.2% |
| 4 | S02 | Two-home | GBP 250k | GBP 250k | GBP 2.27m | GBP 460k | 61.0% | 4.3% |
| 5 | S01 | Two-home | GBP 250k | GBP 250k | GBP 2.27m | GBP 457k | 61.0% | 3.3% |
| 6 | S13 | Two-home | GBP 250k | GBP 250k | GBP 2.24m | GBP 503k | 63.9% | 4.5% |
| 7 | S71 | Two-home | GBP 250k | GBP 250k | GBP 2.40m | GBP 389k | 51.9% | 0.3% |
| 8 | S72 | Two-home | GBP 250k | GBP 250k | GBP 2.40m | GBP 408k | 52.2% | 0.2% |
| 9 | S03 | Two-home | GBP 250k | GBP 250k | GBP 2.26m | GBP 474k | 60.4% | 4.5% |
| 10 | S04 | Two-home | GBP 250k | GBP 250k | GBP 2.26m | GBP 478k | 59.4% | 5.6% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S104 | GBP 2.50m | GBP 142k | 8.8% | 30.1 |
| S103 | GBP 2.51m | GBP 142k | 8.6% | 30.1 |
| S169 | GBP 2.52m | GBP 144k | 5.3% | 28.4 |
| S140 | GBP 2.52m | GBP 184k | 9.0% | 29.5 |

## Charts

- [Scatter: expected end net worth vs regret CVaR](./scatter-net-worth-vs-regret.svg)
- [CDF: top robust strategies](./cdf-top-robust-strategies.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
