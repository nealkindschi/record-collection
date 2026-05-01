import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;

  try {
    const formats = await db
      .prepare(
        "SELECT DISTINCT format FROM releases WHERE format IS NOT NULL ORDER BY format"
      )
      .all<{ format: string }>();

    const genres = await db
      .prepare(
        "SELECT DISTINCT genre FROM releases WHERE genre IS NOT NULL ORDER BY genre"
      )
      .all<{ genre: string }>();

    const years = await db
      .prepare(
        "SELECT MIN(year) as min_year, MAX(year) as max_year FROM releases WHERE year IS NOT NULL"
      )
      .first<{ min_year: number; max_year: number }>();

    const artists = await db
      .prepare(
        "SELECT DISTINCT artist FROM releases ORDER BY artist"
      )
      .all<{ artist: string }>();

    const vinylSizes = await db
      .prepare(
        `SELECT DISTINCT vinyl_size FROM releases WHERE vinyl_size IS NOT NULL
         ORDER BY CASE vinyl_size
           WHEN '12"' THEN 1
           WHEN '10"' THEN 2
           WHEN '7"' THEN 3
           ELSE 4
         END`
      )
      .all<{ vinyl_size: string }>();

    return new Response(
      JSON.stringify({
        formats: formats.results.map((r) => r.format),
        vinyl_sizes: vinylSizes.results.map((r) => r.vinyl_size),
        genres: genres.results.map((r) => r.genre),
        minYear: years?.min_year ?? null,
        maxYear: years?.max_year ?? null,
        artists: artists.results.map((r) => r.artist),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
