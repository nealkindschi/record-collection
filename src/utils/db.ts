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
  vinyl_size: string | null;
}

function getVinylSize(descriptions: string[]): string | null {
  const set = new Set(descriptions);
  if (set.has('7"')) return '7"';
  if (set.has('12"')) return '12"';
  if (set.has('10"')) return '10"';
  if (set.has("LP")) return '12"';
  if (set.has("Maxi-Single")) return '12"';
  if (set.has("EP")) return '12"';
  if (set.has("Single")) return '7"';
  return '12"';
}

export function normalizeArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)$/, "");
}

export function mapDiscogsToRelease(item: DiscogsCollectionItem): Release {
  const basic = item.basic_information;
  const firstFormat = basic.formats?.[0];
  const descriptions = firstFormat?.descriptions ?? [];
  return {
    release_id: item.id,
    instance_id: item.instance_id,
    title: basic.title,
    artist:
      basic.artists?.map((a) => normalizeArtistName(a.name)).join(", ") ??
      "Unknown",
    year: basic.year || null,
    format: firstFormat?.name ?? null,
    genre: basic.genres?.[0] ?? null,
    thumb_url: basic.thumb || null,
    cover_image_url: basic.cover_image || null,
    vinyl_size: firstFormat?.name === "Vinyl" ? getVinylSize(descriptions) : null,
  };
}

export async function upsertReleases(
  db: D1Database,
  releases: Release[]
): Promise<void> {
  if (releases.length === 0) return;

  const stmt = db.prepare(
    `INSERT INTO releases (release_id, instance_id, title, artist, year, format, genre, thumb_url, cover_image_url, tracklist, vinyl_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(release_id) DO UPDATE SET
       instance_id = excluded.instance_id,
       title = excluded.title,
       artist = excluded.artist,
       year = excluded.year,
       format = excluded.format,
       genre = excluded.genre,
       thumb_url = excluded.thumb_url,
       cover_image_url = excluded.cover_image_url,
       vinyl_size = excluded.vinyl_size,
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
      r.tracklist ? JSON.stringify(r.tracklist) : null,
      r.vinyl_size
    )
  );

  await db.batch(batch);
}

export interface SearchOptions {
  q?: string;
  format?: string;
  vinyl_size?: string;
  genre?: string;
  year?: number;
  artist?: string;
  limit?: number;
  offset?: number;
  sort?: string;
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
  if (options.vinyl_size) {
    conditions.push("vinyl_size = ?");
    params.push(options.vinyl_size);
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

  let orderBy = "ORDER BY artist, title";
  if (options.sort === "title") orderBy = "ORDER BY title";
  else if (options.sort === "year_desc") orderBy = "ORDER BY year DESC, artist, title";
  else if (options.sort === "year_asc") orderBy = "ORDER BY year ASC, artist, title";

  const results = await db
    .prepare(`SELECT * FROM releases ${where} ${orderBy} LIMIT ? OFFSET ?`)
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
    vinyl_size: row.vinyl_size as string | null,
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

export async function getUncachedReleaseIds(
  db: D1Database
): Promise<number[]> {
  const result = await db
    .prepare(
      "SELECT release_id FROM releases WHERE tracklist IS NULL ORDER BY artist, title"
    )
    .all<{ release_id: number }>();
  return result.results.map((r) => r.release_id);
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
