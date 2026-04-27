import type { APIRoute } from "astro";
import { normalizeArtistName } from "../../utils/db";

export const POST: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;

  try {
    const result = await db
      .prepare("SELECT DISTINCT artist FROM releases")
      .all<{ artist: string }>();

    const updates: { oldName: string; newName: string }[] = [];

    for (const row of result.results) {
      const normalized = normalizeArtistName(row.artist);
      if (normalized !== row.artist) {
        updates.push({ oldName: row.artist, newName: normalized });
      }
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: "No artists needed normalization" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const stmt = db.prepare(
      "UPDATE releases SET artist = ?, updated_at = datetime('now') WHERE artist = ?"
    );
    const batch = updates.map((u) => stmt.bind(u.newName, u.oldName));
    await db.batch(batch);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updates.length,
        changes: updates.map((u) => `${u.oldName} -> ${u.newName}`),
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
