import type { APIRoute } from "astro";
import { searchReleases } from "../../utils/db";

export const GET: APIRoute = async ({ locals, url }) => {
  const db = locals.runtime.env.DB;
  const q = url.searchParams.get("q") || undefined;
  const format = url.searchParams.get("format") || undefined;
  const genre = url.searchParams.get("genre") || undefined;
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const artist = url.searchParams.get("artist") || undefined;
  const sort = url.searchParams.get("sort") || undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offsetParam = url.searchParams.get("offset");
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  try {
    const { results, total } = await searchReleases(db, {
      q,
      format,
      genre,
      year,
      artist,
      limit,
      offset,
      sort,
    });
    return new Response(JSON.stringify({ results, total }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
