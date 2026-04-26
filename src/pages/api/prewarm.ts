import type { APIRoute } from "astro";
import { getUncachedReleaseIds } from "../../utils/db";

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const db = env.DB;

  try {
    const ids = await getUncachedReleaseIds(db);
    return new Response(JSON.stringify({ uncached: ids }), {
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
