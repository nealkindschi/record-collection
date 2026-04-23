const DISCOGS_BASE_URL = "https://api.discogs.com";

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
  const res = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "RecordCollectionApp/1.0",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discogs API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<DiscogsCollectionResponse>;
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
  }

  return totalSynced;
}
