# Daily Pulse

A daily operational dashboard for a Shopify store, built by **Frontleft** for its clients' teams.

Its job is **continuous awareness**: collapse the data Shopify already has (but scatters across
many reports) into one legible view, and push a summary to the team every morning so nobody flies
blind. Built entirely on Shopify's own data — single channel, no GA4, no marketing attribution.

It is the daily twin of a separate monthly [Ecommerce P&L](https://github.com/matthias-frontleft/ecommerce-pnl) module.

## Two faces

- **Live dashboard** — the pull view: open it, see performance, slice to any period.
- **Morning report** — the push view: a realistic preview of the automated 6am Slack post.

## The diagnostic spine

Revenue = **Sessions × Conversion rate × AOV**. Every revenue change decomposes into those three
levers, so the app's signature move is telling you *which one moved* — turning "revenue is down 12%"
into "revenue −12%, driven by traffic; conversion and basket held." (Traffic / conversion / basket
problem.)

> The demo uses the additive approximation `%ΔRevenue ≈ %ΔSessions + %ΔCR + %ΔAOV`. Production would
> use an exact LMDI decomposition.

## Stack

Vite + React + TypeScript + Tailwind. All data is **mocked** in `src/data/mockData.ts`
(one invented brand, ~14 months of internally-consistent daily data) — no real Shopify, Slack,
auth, or backend. The mock layer is cleanly separated so a real Shopify adapter can replace it.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Deploy

Pushed to `main` → GitHub Actions builds and publishes to GitHub Pages.

---

A Frontleft prototype.
