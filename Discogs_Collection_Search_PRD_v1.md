# Product Requirements Document: Discogs Sync App

| Meta | Details |
| :--- | :--- |
| **Document Version** | 2.0 |
| **Status** | Draft |
| **Target Audience** | Primary User + 1 Authorized Guest (Scalable) |
| **Companion Document** | `IMPLEMENTATION_PLAN.md` — technical architecture, file structure, phasing |

## 1. Executive Summary

This application provides a high-performance, private search interface for a user's Discogs record collection. By synchronizing Discogs API data into a local Cloudflare D1 database, the application circumvents API rate limits and latency, enabling instant, complex querying (e.g., filtering by artist, year, or format) via an Astro-powered frontend.

## 2. User Stories

### Collection Owner
- **US-1** As a collector, I want to sync my entire Discogs collection into the app so that I can search it instantly without hitting the Discogs API every time.
- **US-2** As a collector, I want to search my collection by title or artist so that I can quickly find a specific record.
- **US-3** As a collector, I want to filter by format (Vinyl, CD, Cassette) and year so that I can browse subsets of my collection.
- **US-4** As a collector, I want to see album artwork thumbnails in search results so that I can visually identify releases.
- **US-5** As a collector, I want to re-sync my collection after adding records on Discogs so that the app stays up to date.
- **US-6** As a collector, I want the page to load fast with results visible immediately, even before JavaScript hydrates.

### Authorized Guest
- **US-7** As a guest, I want to search and browse the collection using the same filters as the owner, but not trigger syncs or modify data.

### Future / Public Access
- **US-8** As a public visitor, I want to view a shared collection link so that I can browse someone's records without a Discogs account.

## 3. Feature Priority (MoSCoW)

| Priority | Feature | User Stories |
| :--- | :--- | :--- |
| **Must Have** | Discogs Sync Engine | US-1, US-5 |
| **Must Have** | Local DB Search (title, artist) | US-2 |
| **Must Have** | Format & Year Filters | US-3 |
| **Must Have** | Album Art Thumbnails | US-4 |
| **Must Have** | SSR Initial Render | US-6 |
| **Must Have** | Sync Endpoint Authentication | US-5, US-7 |
| **Should Have** | OAuth 1.0a Auth | US-7, US-8 |
| **Should Have** | Delta Syncing | US-5 |
| **Should Have** | Pagination / Infinite Scroll | US-2, US-3 |
| **Could Have** | JSON-LD Structured Data | US-8 |
| **Could Have** | Public Sharing Links | US-8 |

## 4. Acceptance Criteria

### Sync Engine
- AC-1: Sync paginates through all collection pages (50 per page) without hitting Discogs rate limits (60 req/min authenticated).
- AC-2: Sync handles HTTP 429 responses with retry logic.
- AC-3: Re-running sync upserts existing records without duplicates.
- AC-4: Sync endpoint requires authentication; unauthenticated requests return 401.
- AC-5: Last sync timestamp is recorded after a successful sync.

### Search & Filtering
- AC-6: Search results return in under 200ms for collections up to 5,000 records.
- AC-7: Text search matches partial strings in both title and artist fields.
- AC-8: Format and year filter dropdowns are populated from actual data in the database.
- AC-9: Combining text search with filters returns the intersection of all criteria.
- AC-10: An empty search returns the full collection (paginated).

### Frontend
- AC-11: First 24 results render server-side — visible before JavaScript loads.
- AC-12: Debounced search input (300ms) prevents excessive API calls.
- AC-13: Users can load additional results beyond the initial page.
- AC-14: Sync failures display an error message to the user (not silently swallowed).
- AC-15: Release cards display title, artist, year, format, and artwork thumbnail.

## 5. Constraints & Assumptions

- **Discogs API** — Authenticated rate limit is 60 requests/minute; unauthenticated is 25/minute.
- **Collection size** — Initial design targets collections up to 5,000 records. Larger collections may require pagination optimizations.
- **Data freshness** — Collection data is only as current as the last sync. No real-time Discogs proxying.
- **Privacy** — The app is private by default. OAuth (Phase 4) enables controlled guest access.
- **Edge hosting** — All compute runs on Cloudflare Workers; no persistent server.
- **Authoritative source** — Discogs is the single source of truth. The app never writes back to Discogs.

## 6. Open Questions

| # | Question | Status |
| :--- | :--- | :--- |
| 1 | Should OAuth be Must Have (block launch) or Should Have (post-launch)? | Resolved: Should Have. PAT for v1, OAuth in Phase 4. |
| 2 | Should the app support multiple Discogs users or a single collection? | Open — schema supports it, UI does not yet. |
| 3 | What is the target collection size for acceptable search performance? | Open — assumed 5,000 records. Needs benchmark. |
| 4 | Should deleted Discogs items be removed during sync? | Open — current upsert-only approach never deletes. |
