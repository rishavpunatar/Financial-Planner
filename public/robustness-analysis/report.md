# Robustness analysis

Generated: 2026-03-01T21:25:04.126Z

## Setup

- Scenario method: Weighted stratified Monte Carlo
- Scenario count: 1080
- Candidate strategies: 80
- Default medium-case weight: 60%
- Default private-school probability: 30%
- Starting incomes baked into the robustness run: GBP 70k for person 1 and GBP 90k for person 2

## Recommendation

A robust starting region is first deposit GBP 250k to GBP 250k and first mortgage GBP 250k to GBP 250k.

- The plateau contains 1 first-house starting cells that are within 97% of the best robust score and within 2 percentage points of the best feasibility rate.
- 100% of the plateau cells resolve to a two-home path rather than a one-home path.
- Robust ranking uses weighted feasibility first, then regret CVaR, then expected end net worth.

## Top strategies

| Rank | Strategy | Path | Deposit 1 | Mortgage 1 | Expected Net Worth | Regret CVaR 10% | Feasibility | Private School Feasibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | S67 | Two-home | GBP 250k | GBP 250k | GBP 2.48m | GBP 92k | 3.9% | 0.5% |
| 2 | S68 | Two-home | GBP 250k | GBP 250k | GBP 2.47m | GBP 101k | 4.2% | 0.5% |
| 3 | S43 | Two-home | GBP 250k | GBP 250k | GBP 2.45m | GBP 160k | 5.6% | 0.5% |
| 4 | S70 | Two-home | GBP 250k | GBP 250k | GBP 2.43m | GBP 159k | 6.0% | 0.5% |
| 5 | S69 | Two-home | GBP 250k | GBP 250k | GBP 2.43m | GBP 153k | 5.9% | 0.5% |
| 6 | S65 | Two-home | GBP 250k | GBP 250k | GBP 2.42m | GBP 183k | 6.1% | 0.5% |
| 7 | S66 | Two-home | GBP 250k | GBP 250k | GBP 2.41m | GBP 185k | 6.2% | 0.5% |
| 8 | S44 | Two-home | GBP 250k | GBP 250k | GBP 2.40m | GBP 191k | 6.3% | 0.5% |
| 9 | S18 | Two-home | GBP 250k | GBP 250k | GBP 2.40m | GBP 203k | 6.2% | 0.5% |
| 10 | S41 | Two-home | GBP 250k | GBP 250k | GBP 2.39m | GBP 218k | 6.5% | 0.5% |

## Pareto frontier

| Strategy | Expected Net Worth | Regret CVaR 10% | Feasibility | Composite Score |
| --- | --- | --- | --- | --- |
| S67 | GBP 2.48m | GBP 92k | 3.9% | 27.4 |

## Charts

- [Scatter: expected end net worth vs regret CVaR](./scatter-net-worth-vs-regret.svg)
- [CDF: top robust strategies](./cdf-top-robust-strategies.svg)
- [Heatmap: first deposit vs first mortgage](./heatmap-deposit-vs-mortgage.svg)
- [Sensitivity: medium weight vs private-school probability](./sensitivity-medium-weight-vs-private-school.svg)
