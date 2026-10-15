import { DurableObject } from "cloudflare:workers";
import { runSync, type SyncEnv } from "../../src/utils/sync";

interface Env extends SyncEnv {
  SCHEDULER: DurableObjectNamespace<SyncScheduler>;
  SYNC_SECRET: string;
}

// How often the sync runs. Most runs make one Discogs request and stop when
// nothing changed; a full sync runs when the collection changes or the last
// one is more than 24h old.
const SYNC_INTERVAL_MS = 60 * 60 * 1000;

// The Free plan allows only 5 cron triggers per account, so the schedule is a
// Durable Object alarm instead: each run sets the alarm for the next one.
export class SyncScheduler extends DurableObject<Env> {
  // Starts the schedule if it isn't running (first sync runs immediately).
  // Safe to call repeatedly: an existing alarm is left alone.
  async ensureScheduled(): Promise<number> {
    const existing = await this.ctx.storage.getAlarm();
    if (existing !== null) return existing;
    const now = Date.now();
    await this.ctx.storage.setAlarm(now);
    return now;
  }

  // Pulls the next run forward to now.
  async runNow(): Promise<number> {
    const now = Date.now();
    await this.ctx.storage.setAlarm(now);
    return now;
  }

  async alarm(): Promise<void> {
    // Schedule the next run first so a failed sync can't break the chain.
    await this.ctx.storage.setAlarm(Date.now() + SYNC_INTERVAL_MS);
    try {
      const result = await runSync(this.env);
      console.log(JSON.stringify(result));
    } catch (err) {
      // runSync records the error in KV (last_sync_run); retry next hour.
      console.error(err);
    }
  }
}

// Any request starts the schedule if needed and reports its status.
// POST /run with "Authorization: Bearer <SYNC_SECRET>" syncs right away.
export default {
  async fetch(request, env) {
    const scheduler = env.SCHEDULER.get(env.SCHEDULER.idFromName("discogs"));

    if (new URL(request.url).pathname === "/run") {
      const auth = request.headers.get("Authorization");
      if (
        request.method !== "POST" ||
        !env.SYNC_SECRET ||
        auth !== `Bearer ${env.SYNC_SECRET}`
      ) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const nextRun = await scheduler.runNow();
      return Response.json({ nextRun: new Date(nextRun).toISOString() });
    }

    const nextRun = await scheduler.ensureScheduled();
    const lastRun = await env.SYNC_KV.get("last_sync_run", "json");
    return Response.json({ nextRun: new Date(nextRun).toISOString(), lastRun });
  },
} satisfies ExportedHandler<Env>;
