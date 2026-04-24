# Implementation Plan: Discogs Sync App

## Stack
- **Astro SSR** on Cloudflare (Workers adapter)
- **Preact** for interactive islands (search, filters, grid)
- **Tailwind CSS** for styling (`@tailwindcss/vite` if `@astrojs/tailwind` proves incompatible with Astro 5)
- **Cloudflare D1** for collection data
- **Discogs PAT** for initial development (OAuth 1.0a deferred to Phase 4)

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
│   │   ├── CollectionApp.tsx       (Preact island — orchestrates state)
│   │   ├── SearchBar.tsx           (Preact island)
│   │   ├── CollectionGrid.tsx      (Preact island)
│   │   ├── ReleaseCard.tsx         (Preact island)
│   │   └── FilterPanel.tsx         (Preact island)
│   ├── pages/
│   │   ├── index.astro             (main collection view)
│   │   └── api/
│   │       ├── search.ts           (GET - D1 search queries)
│   │       ├── sync.ts             (POST - trigger Discogs sync)
│   │       └── filters.ts          (GET - distinct values for filter dropdowns)
│   └── utils/
│       ├── discogs.ts              (Discogs API client w/ PAT)
│       └── db.ts                   (D1 query helpers)
```

## Phase 1: Infrastructure & Scaffold
1. Initialize Astro project in `/users/nealkindschi/record-collection`
2. Install deps: `@astrojs/cloudflare`, `@astrojs/preact`, `preact`, `@astrojs/tailwind`, `tailwindcss`
3. Configure `astro.config.mjs` (Cloudflare adapter + Preact + Tailwind integrations)
   - Verify `@astrojs/tailwind` compatibility with Astro 5; fall back to `@tailwindcss/vite` if needed
4. Create `wrangler.toml` with D1 binding (`DB`), KV binding for sync state, and PAT secret
5. Create `schema.sql` with `releases` table (7 columns from PRD) plus timestamps:
   ```sql
   CREATE TABLE IF NOT EXISTS releases (
     release_id INTEGER PRIMARY KEY,
     instance_id INTEGER,
     title TEXT NOT NULL,
     artist TEXT NOT NULL,
     year INTEGER,
     format TEXT,
     thumb_url TEXT,
     created_at TEXT DEFAULT (datetime('now')),
     updated_at TEXT DEFAULT (datetime('now'))
   );
   ```
6. Provision D1 database via `wrangler d1 create` and execute schema
7. Set Discogs token as a Cloudflare secret: `wrangler secret put DISCOGS_TOKEN`

## Phase 2: Discogs Sync Engine
1. Build `src/utils/discogs.ts` — API client using PAT from env, wraps `fetch` calls
   - Add 1-second delay between paginated requests to stay under Discogs 60 req/min rate limit
   - Handle HTTP 429 responses with `Retry-After` header and exponential backoff
2. Build `src/utils/db.ts` — typed D1 query helpers (upsert, search, count)
3. Build `src/pages/api/sync.ts` — POST endpoint:
   - Require `Authorization: Bearer <SYNC_SECRET>` header; return 401 if missing or invalid
   - Paginate `/users/{username}/collection/folders/0/releases` (50 per page)
   - Map each release JSON → D1 row (extract `release_id`, `instance_id`, `title`, `artist`, `year`, `format`, `thumb_url`)
   - Upsert into D1 with `INSERT ... ON CONFLICT(release_id) DO UPDATE`
   - Store last-sync timestamp in KV
4. Test sync with real Discogs collection

## Phase 3: Frontend & Search UI
1. Create `BaseLayout.astro` with global styles, meta tags, and `<meta name="description">`
2. Build Preact components:
   - **SearchBar** — debounced text input (300ms), fires API calls to `/api/search?q=...`
   - **FilterPanel** — dropdowns for format and year (both populated from `/api/filters`)
   - **CollectionGrid** — responsive grid of results with "Load more" pagination
   - **ReleaseCard** — album art thumbnail, title, artist, year, format
3. Create `src/pages/api/search.ts` — GET endpoint accepting query params (`q`, `format`, `year`, `artist`), builds D1 `SELECT` with `LIKE` and filters
4. Create `src/pages/api/filters.ts` — GET endpoint that returns distinct formats and year range:
   ```ts
   SELECT DISTINCT format FROM releases WHERE format IS NOT NULL ORDER BY format;
   SELECT MIN(year) as min_year, MAX(year) as max_year FROM releases WHERE year IS NOT NULL;
   ```
5. Wire `index.astro` — fetch initial 24 results in Astro frontmatter, pass as serialized props to `<CollectionApp client:load initialResults={...} />` for instant SSR paint before JS hydrates
6. Add sync error feedback — display an error toast/banner when `/api/sync` returns a non-200 response

## Phase 4: Polish & Future Enhancements
1. **Delta sync** — read last-sync timestamp from KV, only fetch pages modified after that date (requires `updated_at` column from Phase 1 schema)
2. **OAuth 1.0a** — replace PAT with proper OAuth flow (request token → authorize → access token)
3. **JSON-LD** — inject `MusicRecording` structured data on release detail pages
4. **Infinite scroll** — replace "Load more" button with intersection observer for seamless browsing
5. **Artist normalization** — add `artist_sort` column or separate `artists` join table for better multi-artist search fidelity
