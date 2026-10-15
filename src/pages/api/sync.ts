import type { APIRoute } from "astro";
import { runSync } from "../../utils/sync";

// Manual full sync. The scheduled Worker in workers/sync runs this hourly;
// this endpoint is for forcing one, and requires the SYNC_SECRET bearer token.
export const POST: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime.env;

  const auth = request.headers.get("Authorization");
  if (!env.SYNC_SECRET || auth !== `Bearer ${env.SYNC_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runSync(env, { force: true });
    return new Response(JSON.stringify({ success: true, ...result }), {
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
