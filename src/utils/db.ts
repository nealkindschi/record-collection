import type { DiscogsCollectionItem } from "./discogs";

export interface Release {
  release_id: number;
  instance_id: number;
  title: string;
  artist: string;
  year: number | null;
  format: string | null;
  genre: string | null;
  thumb_url: string | null;
  cover_image_url: string | null;
}

export function mapDiscogsToRelease(item: DiscogsCollectionItem): Release {
  const basic = item.basic_information;
  return {
    release_id: item.id,
    instance_id: item.instance_id,
    title: basic.title,
    artist: basic.artists?.map((a) => a.name).join(", ") ?? "Unknown",
    year: basic.year || null,
    format: basic.formats?.[0]?.name ?? null,
    genre: basic.genres?.[0] ?? null,
    thumb_url: basic.thumb || null,
    cover_image_url: basic.cover_image || null,
  };
}

export async function upsertReleases(
  db: D1Database,
  releases: Release[]
): Promise<void> {
  if (releases.length === 0) return;

  const stmt = db.prepare(
    `INSERT INTO releases (release_id, instance_id, title, artist, year, format, genre, thumb_url, cover_image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(release_id) DO UPDATE SET
       instance_id = excluded.instance_id,
       title = excluded.title,
       artist = excluded.artist,
       year = excluded.year,
       format = excluded.format,
       genre = excluded.genre,
       thumb_url = excluded.thumb_url,
       cover_image_url = excluded.cover_image_url,
       updated_at = datetime('now')`
  );

  const batch = releases.map((r) =>
    stmt.bind(
      r.release_id,
      r.instance_id,
      r.title,
      r.artist,
      r.year,
      r.format,
      r.genre,
      r.thumb_url,
      r.cover_image_url
    )
  );

  await db.batch(batch);
}

export interface SearchOptions {
  q?: string;
  format?: string;
  genre?: string;
  year?: number;
  artist?: string;
  limit?: number;
  offset?: number;
}

export async function searchReleases(
  db: D1Database,
  options: SearchOptions
): Promise<{ results: Release[]; total: number }> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.q) {
    conditions.push("(title LIKE ? OR artist LIKE ?)");
    params.push(`%${options.q}%`, `%${options.q}%`);
  }
  if (options.format) {
    conditions.push("format = ?");
    params.push(options.format);
  }
  if (options.genre) {
    conditions.push("genre = ?");
    params.push(options.genre);
  }
  if (options.year) {
    conditions.push("year = ?");
    params.push(options.year);
  }
  if (options.artist) {
    conditions.push("artist LIKE ?");
    params.push(`%${options.artist}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM releases ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const results = await db
    .prepare(
      `SELECT * FROM releases ${where} ORDER BY artist, title LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<Release>();

  return {
    results: results.results,
    total: countResult?.total ?? 0,
  };
}
