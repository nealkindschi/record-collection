# Implementation Plan: Discogs Sync App

## Stack
- **Astro SSR** on Cloudflare (Workers adapter)
- **Preact** for interactive islands (search, filters, grid)
- **Tailwind CSS** for styling
- **Cloudflare D1** for collection data
- **Discogs PAT** for initial development

## Project Structure
```
record-collection/
├── Discogs_Collection_Search_PRD_v1.md
├── IMPLEMENTATION_PLAN.md
├── astro.config.mjs
├── wrangler.toml
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
├── schema.sql
├── src/
│   ├── env.d.ts
│   ├── styles/
│   │   └── global.css              (Tailwind directives)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── SearchBar.tsx           (Preact island)
│   │   ├── CollectionGrid.tsx      (Preact island)
│   │   ├── ReleaseCard.tsx         (Preact island)
│   │   └── FilterPanel.tsx         (Preact island)
│   ├── pages/
│   │   ├── index.astro             (main collection view)
│   │   └── api/
│   │       ├── search.ts           (GET - D1 search queries)
│   │       └── sync.ts             (POST - trigger Discogs sync)
│   └── utils/
│       ├── discogs.ts              (Discogs API client w/ PAT)
│       └── db.ts                   (D1 query helpers)
```

## Phase 1: Infrastructure & Scaffold
1. Initialize Astro project in `/users/nealkindschi/record-collection`
2. Install deps: `@astrojs/cloudflare`, `@astrojs/preact`, `preact`, `@astrojs/tailwind`, `tailwindcss`
3. Configure `astro.config.mjs` (Cloudflare adapter + Preact + Tailwind integrations)
4. Create `wrangler.toml` with D1 binding (`DB`), KV binding for sync state, and PAT secret
5. Create `schema.sql` with `releases` table (7 columns from PRD)
6. Provision D1 database via `wrangler d1 create` and execute schema

## Phase 2: Discogs Sync Engine
1. Build `src/utils/discogs.ts` — API client using PAT from env, wraps `fetch` calls
2. Build `src/utils/db.ts` — typed D1 query helpers (upsert, search, count)
3. Build `src/pages/api/sync.ts` — POST endpoint:
   - Paginate `/users/{username}/collection/folders/0/releases` (50 per page)
   - Map each release JSON → D1 row (extract `release_id`, `instance_id`, `title`, `artist`, `year`, `format`, `thumb_url`)
   - Upsert into D1 with `INSERT ... ON CONFLICT(release_id) DO UPDATE`
   - Store last-sync timestamp in KV
4. Test sync with real Discogs collection

## Phase 3: Frontend & Search UI
1. Create `BaseLayout.astro` with global styles, meta tags
2. Build Preact components:
   - **SearchBar** — debounced text input, fires API calls to `/api/search?q=...`
   - **FilterPanel** — dropdowns for format, year range, artist
   - **CollectionGrid** — responsive grid of results
   - **ReleaseCard** — album art thumbnail, title, artist, year, format
3. Create `src/pages/api/search.ts` — GET endpoint accepting query params (`q`, `format`, `year`, `artist`), builds D1 `SELECT` with `LIKE` and filters
4. Wire `index.astro` — renders initial collection (first N results SSR), Preact islands handle interactive search/filter

## Phase 4: Polish & Future Enhancements
1. **Delta sync** — read last-sync timestamp from KV, only fetch pages modified after that date
2. **OAuth 1.0a** — replace PAT with proper OAuth flow (request token → authorize → access token)
3. **JSON-LD** — inject `MusicRecording` structured data on release detail pages
4. **Pagination/infinite scroll** — for large collections
