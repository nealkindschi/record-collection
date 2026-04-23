import type { APIRoute } from "astro";
import { syncAllPages } from "../../utils/discogs";
import { mapDiscogsToRelease, upsertReleases } from "../../utils/db";

export const POST: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const db = env.DB;
  const kv = env.SYNC_KV;
  const token = env.DISCOGS_TOKEN;
  const username = env.DISCOGS_USERNAME;

  if (!token || !username) {
    return new Response(
      JSON.stringify({ error: "Missing Discogs credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const totalSynced = await syncAllPages(username, token, async (items) => {
      const releases = items.map(mapDiscogsToRelease);
      await upsertReleases(db, releases);
    });

    await kv.put("last_sync", new Date().toISOString());

    return new Response(JSON.stringify({ success: true, totalSynced }), {
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
