import type { DiscogsCollectionItem, DiscogsTrack } from "./discogs";

export interface Track {
  position: string;
  title: string;
  duration: string;
}

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
  tracklist: Track[] | null;
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
    `INSERT INTO releases (release_id, instance_id, title, artist, year, format, genre, thumb_url, cover_image_url, tracklist)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      r.cover_image_url,
      r.tracklist ? JSON.stringify(r.tracklist) : null
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
    .all<Record<string, unknown>>();

  return {
    results: results.results.map(parseReleaseTracklist),
    total: countResult?.total ?? 0,
  };
}

function parseReleaseTracklist(row: Record<string, unknown>): Release {
  const tracklistRaw = row.tracklist as string | null;
  let tracklist: Track[] | null = null;
  if (tracklistRaw) {
    try {
      tracklist = JSON.parse(tracklistRaw) as Track[];
    } catch {
      tracklist = null;
    }
  }
  return {
    release_id: row.release_id as number,
    instance_id: row.instance_id as number,
    title: row.title as string,
    artist: row.artist as string,
    year: row.year as number | null,
    format: row.format as string | null,
    genre: row.genre as string | null,
    thumb_url: row.thumb_url as string | null,
    cover_image_url: row.cover_image_url as string | null,
    tracklist,
  };
}

export async function getReleaseTracklist(
  db: D1Database,
  releaseId: number
): Promise<Track[] | null> {
  const row = await db
    .prepare("SELECT tracklist FROM releases WHERE release_id = ?")
    .bind(releaseId)
    .first<{ tracklist: string | null }>();

  if (!row?.tracklist) return null;

  try {
    return JSON.parse(row.tracklist) as Track[];
  } catch {
    return null;
  }
}

export async function updateReleaseTracklist(
  db: D1Database,
  releaseId: number,
  tracks: DiscogsTrack[]
): Promise<void> {
  await db
    .prepare("UPDATE releases SET tracklist = ? WHERE release_id = ?")
    .bind(JSON.stringify(tracks), releaseId)
    .run();
}

export async function getReleaseById(
  db: D1Database,
  releaseId: number
): Promise<Release | null> {
  const row = await db
    .prepare("SELECT * FROM releases WHERE release_id = ?")
    .bind(releaseId)
    .first<Record<string, unknown>>();

  if (!row) return null;
  return parseReleaseTracklist(row);
}
