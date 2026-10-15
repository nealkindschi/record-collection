const DISCOGS_BASE_URL = "https://api.discogs.com";
const MAX_RETRIES = 3;
// Discogs allows 100 items per collection page (the most it will return).
const COLLECTION_PAGE_SIZE = 100;
// Pages fetched at once after page 1. Workers allow 6 open connections.
const PAGE_CONCURRENCY = 4;
// Discogs allows 60 authenticated requests per moving 60s window. When the
// remaining budget drops this low, pause before the next request.
const RATE_LIMIT_FLOOR = 5;
const RATE_LIMIT_PAUSE_MS = 5000;
// Discogs limits by source IP, and Workers share egress IPs with other
// Discogs users, so the budget can be exhausted before we send anything.
// On a 429, wait out a full window; give up after this many attempts.
const RATE_LIMIT_WINDOW_MS = 60_000;
const COLLECTION_MAX_ATTEMPTS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DiscogsCollectionResponse {
  releases: DiscogsCollectionItem[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
}

export interface DiscogsCollectionItem {
  id: number;
  instance_id: number;
  date_added: string;
  basic_information: {
    title: string;
    year: number;
    formats: { name: string; qty: string; descriptions: string[] }[];
    thumb: string;
    cover_image: string;
    artists: { name: string; join: string }[];
    genres?: string[];
  };
}

async function throttleIfNearLimit(res: Response): Promise<void> {
  const remaining = parseInt(
    res.headers.get("X-Discogs-Ratelimit-Remaining") ?? "",
    10
  );
  if (!isNaN(remaining) && remaining <= RATE_LIMIT_FLOOR) {
    await sleep(RATE_LIMIT_PAUSE_MS);
  }
}

export async function fetchCollectionPage(
  username: string,
  token: string,
  page = 1,
  perPage = COLLECTION_PAGE_SIZE
): Promise<DiscogsCollectionResponse> {
  // Newest additions first, so page 1 doubles as a change fingerprint.
  const url = `${DISCOGS_BASE_URL}/users/${username}/collection/folders/0/releases?page=${page}&per_page=${perPage}&sort=added&sort_order=desc`;

  let lastRateLimit = "";

  for (let attempt = 0; attempt < COLLECTION_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "RecordCollectionApp/1.0",
      },
    });

    if (res.ok) {
      await throttleIfNearLimit(res);
      return res.json() as Promise<DiscogsCollectionResponse>;
    }

    if (res.status === 429) {
      lastRateLimit = `limit ${res.headers.get("X-Discogs-Ratelimit")}, remaining ${res.headers.get("X-Discogs-Ratelimit-Remaining")}`;
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RATE_LIMIT_WINDOW_MS;
      if (attempt < COLLECTION_MAX_ATTEMPTS - 1) await sleep(delayMs);
      continue;
    }

    if (res.status >= 500) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      const body = await res.text();
      throw new Error(
        `Discogs API error ${res.status} after ${MAX_RETRIES} retries: ${body}`
      );
    }

    const body = await res.text();
    throw new Error(`Discogs API error ${res.status}: ${body}`);
  }

  throw new Error(
    `Discogs API rate limited (429) on page ${page} after ${COLLECTION_MAX_ATTEMPTS} attempts (${lastRateLimit})`
  );
}

export interface DiscogsTrack {
  position: string;
  title: string;
  duration: string;
}

interface DiscogsReleaseResponse {
  tracklist: DiscogsTrack[];
}

export async function fetchReleaseDetails(
  releaseId: number,
  token: string
): Promise<DiscogsTrack[]> {
  const url = `${DISCOGS_BASE_URL}/releases/${releaseId}`;
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Discogs token=${token}`,
          "User-Agent": "RecordCollectionApp/1.0",
        },
      });

      lastStatus = res.status;

      if (res.ok) {
        const data = (await res.json()) as DiscogsReleaseResponse;
        return (
          data.tracklist?.filter(
            (t) =>
              (t as { type_?: string }).type_ === "track" ||
              !( "type_" in t)
          ) ?? []
        );
      }

      lastBody = await res.text();

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : 5000;
        await sleep(delayMs);
        continue;
      }

      if (res.status >= 500) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }

      throw new Error(
        `Discogs API error ${res.status} for release ${releaseId}: ${lastBody}`
      );
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Discogs API error")) {
        throw err;
      }
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw new Error(
        `Discogs API fetch failed for release ${releaseId} after ${MAX_RETRIES} attempts (last status ${lastStatus}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(
    `Discogs API: max retries (${MAX_RETRIES}) exceeded for release ${releaseId} (last status ${lastStatus}): ${lastBody}`
  );
}

export interface CollectionSnapshot {
  // Number of items Discogs reports in the whole collection.
  totalItems: number;
  // Instance id of the most recently added item, or null when empty.
  newestInstanceId: number | null;
}

export function snapshotOf(data: DiscogsCollectionResponse): CollectionSnapshot {
  return {
    totalItems: data.pagination.items,
    newestInstanceId: data.releases[0]?.instance_id ?? null,
  };
}

// One request (a single item, newest first) to tell whether the collection
// has gained or lost items since the last sync.
export async function fetchCollectionSnapshot(
  username: string,
  token: string
): Promise<CollectionSnapshot> {
  return snapshotOf(await fetchCollectionPage(username, token, 1, 1));
}

export async function syncAllPages(
  username: string,
  token: string,
  onPage: (items: DiscogsCollectionItem[]) => Promise<void>
): Promise<{ totalSynced: number; snapshot: CollectionSnapshot }> {
  const first = await fetchCollectionPage(username, token, 1);
  await onPage(first.releases);
  let totalSynced = first.releases.length;

  // Page 1 tells us how many pages exist; fetch the rest a few at a time.
  const remaining: number[] = [];
  for (let page = 2; page <= first.pagination.pages; page++) {
    remaining.push(page);
  }

  async function worker() {
    for (let page = remaining.shift(); page; page = remaining.shift()) {
      const data = await fetchCollectionPage(username, token, page);
      await onPage(data.releases);
      totalSynced += data.releases.length;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PAGE_CONCURRENCY, remaining.length) }, worker)
  );

  return { totalSynced, snapshot: snapshotOf(first) };
}
