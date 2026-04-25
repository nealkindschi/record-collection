const DISCOGS_BASE_URL = "https://api.discogs.com";
const MAX_RETRIES = 3;
const PAGE_DELAY_MS = 1000;

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
  basic_information: {
    title: string;
    year: number;
    formats: { name: string; qty: string; descriptions: string[] }[];
    thumb: string;
    cover_image: string;
    artists: { name: string; join: string }[];
  };
}

export async function fetchCollectionPage(
  username: string,
  token: string,
  page = 1,
  perPage = 50
): Promise<DiscogsCollectionResponse> {
  const url = `${DISCOGS_BASE_URL}/users/${username}/collection/folders/0/releases?page=${page}&per_page=${perPage}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "RecordCollectionApp/1.0",
      },
    });

    if (res.ok) {
      return res.json() as Promise<DiscogsCollectionResponse>;
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.pow(2, attempt) * 2000;
      await sleep(delayMs);
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

  throw new Error(`Discogs API: max retries (${MAX_RETRIES}) exceeded`);
}

export async function syncAllPages(
  username: string,
  token: string,
  onPage: (items: DiscogsCollectionItem[]) => Promise<void>
): Promise<number> {
  let page = 1;
  let totalSynced = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchCollectionPage(username, token, page);
    await onPage(data.releases);
    totalSynced += data.releases.length;
    hasMore = page < data.pagination.pages;
    page++;

    if (hasMore) {
      await sleep(PAGE_DELAY_MS);
    }
  }

  return totalSynced;
}
