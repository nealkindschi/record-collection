# Product Requirements Document: Discogs Sync App

| Meta | Details |
| :--- | :--- |
| **Document Version** | 1.0 |
| **Status** | Draft |
| **Target Audience** | Primary User + 1 Authorized Guest (Scalable) |

## 1. Executive Summary
This application provides a high-performance, private search interface for a user's Discogs record collection. By synchronizing Discogs API data into a local Cloudflare D1 database, the application circumvents API rate limits and latency, enabling instant, complex querying (e.g., filtering by artist, year, or format) via an Astro-powered frontend.

## 2. Technical Architecture & References

| Component | Technology | Implementation Reference |
| :--- | :--- | :--- |
| **Frontend UI** | Astro (SSR) + Preact/Vue | `docs.astro.build/en/getting-started/` |
| **Backend Logic** | Cloudflare Workers | `developers.cloudflare.com/workers/` |
| **Relational Database** | Cloudflare D1 (SQLite) | `developers.cloudflare.com/d1/` |
| **External Data Source** | Discogs REST API | `discogs.com/developers` |

## 3. Core Features & Requirements (MoSCoW)

| Priority | Feature | Description |
| :--- | :--- | :--- |
| **Must Have** | Discogs Sync Engine | Worker script that paginates through `/users/{username}/collection/folders/0/releases` and upserts records into D1. |
| **Must Have** | Local DB Search | Astro UI executing D1 queries (`LIKE` operations) to filter by title, artist, or format in sub-milliseconds. |
| **Must Have** | OAuth 1.0a Auth | Secure login flow allowing specific users to link their Discogs accounts without sharing hardcoded PATs. |
| **Should Have** | Delta Syncing | Tracking last sync timestamp in KV to only fetch recently added/modified records. |
| **Could Have** | Metadata Optimization | Structured schema markup (JSON-LD) injected into single release pages for AEO/SEO tracking if made public later. |

## 4. Data Model (Cloudflare D1 Schema)
The core table structure to support rapid client-side filtering.

| Column Name | Type | Notes |
| :--- | :--- | :--- |
| `release_id` | INTEGER | Primary Key. Maps to Discogs Release ID. |
| `instance_id` | INTEGER | Specific to the user's collection item. |
| `title` | TEXT | Album/Release title. |
| `artist` | TEXT | Normalized artist name. |
| `year` | INTEGER | Release year. |
| `format` | TEXT | e.g., "Vinyl", "CD", "Cassette". |
| `thumb_url` | TEXT | URL to album artwork. |

## 5. Execution Strategy: AI Agent Implementation
Given the technical stack, the development lifecycle is optimized for architectural direction via LLM agents (Cursor, Windsurf, or OpenCode). The following execution sequence defines the prompt methodology:

> **Phase 1: Infrastructure Initialization**
> Generate `wrangler.toml` and D1 schema execution scripts. Map Discogs JSON responses to D1 SQL inserts.

> **Phase 2: Authentication & Ingestion**
> Implement OAuth 1.0a callback handling in a dedicated Worker route. Build the recursive pagination function to handle collections exceeding 100 items.

> **Phase 3: Frontend & Search**
> Develop an Astro SSR route to render the search UI. Implement debounced input fields that trigger D1 `SELECT` queries.
