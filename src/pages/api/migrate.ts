import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;

  try {
    // Add the genre column if it doesn't exist
    await db.exec(`
      ALTER TABLE releases ADD COLUMN genre TEXT;
    `);

    // Create the index
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_releases_genre ON releases(genre);
    `);

    return new Response(JSON.stringify({ success: true, message: "Migration applied" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // If column already exists, it will throw an error, which is fine
    return new Response(JSON.stringify({ error: message }), {
      status: 200, // Returning 200 just to see the message easily
      headers: { "Content-Type": "application/json" },
    });
  }
};
