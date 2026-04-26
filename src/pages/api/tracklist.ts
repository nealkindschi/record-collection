import type { APIRoute } from "astro";
import { fetchReleaseDetails } from "../../utils/discogs";
import {
  getReleaseTracklist,
  updateReleaseTracklist,
  getReleaseById,
} from "../../utils/db";
import type { Track } from "../../utils/db";

export const GET: APIRoute = async ({ locals, url }) => {
  const env = locals.runtime.env;
  const db = env.DB;
  const token = env.DISCOGS_TOKEN;

  const releaseIdParam = url.searchParams.get("release_id");
  if (!releaseIdParam) {
    return new Response(
      JSON.stringify({ error: "Missing release_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const releaseId = parseInt(releaseIdParam, 10);
  if (isNaN(releaseId)) {
    return new Response(
      JSON.stringify({ error: "Invalid release_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const cached = await getReleaseTracklist(db, releaseId);
    if (cached) {
      const release = await getReleaseById(db, releaseId);
      return new Response(
        JSON.stringify({ tracklist: cached, release }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Discogs token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const tracks = await fetchReleaseDetails(releaseId, token);

    await updateReleaseTracklist(db, releaseId, tracks);

    const release = await getReleaseById(db, releaseId);

    return new Response(
      JSON.stringify({ tracklist: tracks as Track[], release }),
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
