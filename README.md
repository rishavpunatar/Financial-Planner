# ClearPlan

ClearPlan is a detailed UK financial-life modelling app designed to be usable without financial-modelling expertise. It connects household income, tax, housing, children, investments, major purchases and adverse events into one long-term scenario.

Everything runs in the browser. There is no account, backend or external analytics service, and the user's scenario is encoded in the page URL only when the app updates the current plan.

## Product journey

1. **Build your plan** — a four-step guided setup covers the essential household, home, family and growth assumptions. The full control surface remains available for detailed changes.
2. **Find a housing path** — the optimizer compares one-home and upgrade strategies across income and market conditions.
3. **Stress-test it** — the robustness view ranks strategies across uncertain futures and explains why a result wins.

The planner presents plain-language outcome cards, liquidity warnings, move costs, a lifetime chart, milestone explanations, model assumptions, shareable scenario links and downloadable Markdown summaries.

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

The terminal will show the local address. Open it in a browser to use the app.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

The automated suite covers deterministic model outcomes, mortgage payoff behaviour, savings-floor logic, negative amortisation, tax/income curves, optimizer payloads, robustness reports, scenario persistence and export summaries.

## Deployment

The app builds to a portable static bundle in `dist/client/` and uses relative asset paths, so it can be hosted on GitHub Pages, Cloudflare Pages, Netlify, Vercel or a conventional static web host. A minimal worker entry in `dist/server/` makes the same build deployable through OpenAI Sites.

```bash
npm run build
```

For the repository's existing GitHub Pages workflow:

```bash
npm run deploy
```

Before using a custom domain, replace the relative Open Graph image URL in `index.html` with the final absolute production URL so social previews work consistently across all crawlers.

## Model scope

- Values are shown in today's money.
- Net pay uses England, Wales and Northern Ireland income-tax and employee National Insurance thresholds identified in the app.
- The model includes fiscal drag, career-income tapering, tiered child costs, stamp duty, legal and estate-agent costs, ISA and surplus savings, capital-gains tax on surplus-pot gains, recessions, optional redundancy, private school and terminal mortgage payoff.
- Mortgage payments are budget-driven rather than a lender-style amortisation schedule.
- Results are scenario estimates, not predictions.

## Important notice

ClearPlan is an educational scenario-modelling tool. It does not provide financial, tax, legal or investment advice. Anyone commercialising the app should arrange independent review of the model assumptions, consumer disclosures, privacy position, accessibility, security, brand clearance and applicable financial-promotion rules.
