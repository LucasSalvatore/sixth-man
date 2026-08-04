# sixth-man
Swapping benches between NBA rosters to measure depth's impact on wins

## deep-bench

A static Next.js app with no backend. All data is read at build time from
[`data/deep-bench-data.json`](./data/deep-bench-data.json) — nothing is
computed, fetched, or modified at runtime.

This stage ships the main view: a sortable table of all 30 teams plus a
methodology & limitations section sourced from the data file's
`meta.disclosures`.

### Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

### Build

```
npm run build
```

### Deploy

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Done — Vercel auto-detects Next.js. No environment variables, database,
   or other backend services are required.
