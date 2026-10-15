import {
  fetchCollectionSnapshot,
  syncAllPages,
  type CollectionSnapshot,
} from "./discogs";
import { mapDiscogsToRelease, upsertReleases } from "./db";

export interface SyncEnv {
  DB: D1Database;
  SYNC_KV: KVNamespace;
  DISCOGS_TOKEN: string;
  DISCOGS_USERNAME: string;
}

export interface SyncResult {
  status: "synced" | "unchanged";
  totalSynced: number;
  snapshot: CollectionSnapshot;
}

// Even when the collection looks unchanged, re-sync this often so edits to
// existing releases on Discogs (titles, artwork, etc.) still come through.
const FULL_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SNAPSHOT_KEY = "collection_snapshot";
const LAST_SYNC_KEY = "last_sync";
const LAST_RUN_KEY = "last_sync_run";

function sameSnapshot(a: CollectionSnapshot, b: CollectionSnapshot): boolean {
  return (
    a.totalItems === b.totalItems && a.newestInstanceId === b.newestInstanceId
  );
}

export async function runSync(
  env: SyncEnv,
  options: { force?: boolean } = {}
): Promise<SyncResult> {
  const { DB: db, SYNC_KV: kv, DISCOGS_TOKEN: token } = env;
  const username = env.DISCOGS_USERNAME;

  if (!token || !username) {
    throw new Error("Missing Discogs credentials");
  }

  try {
    if (!options.force) {
      const [stored, lastSync] = await Promise.all([
        kv.get<CollectionSnapshot>(SNAPSHOT_KEY, "json"),
        kv.get(LAST_SYNC_KEY),
      ]);
      const fresh =
        lastSync !== null &&
        Date.now() - Date.parse(lastSync) < FULL_SYNC_MAX_AGE_MS;

      if (stored && fresh) {
        const current = await fetchCollectionSnapshot(username, token);
        if (sameSnapshot(stored, current)) {
          const result: SyncResult = {
            status: "unchanged",
            totalSynced: 0,
            snapshot: current,
          };
          await recordRun(kv, result);
          return result;
        }
      }
    }

    const { totalSynced, snapshot } = await syncAllPages(
      username,
      token,
      async (items) => {
        await upsertReleases(db, items.map(mapDiscogsToRelease));
      }
    );

    await Promise.all([
      kv.put(LAST_SYNC_KEY, new Date().toISOString()),
      kv.put(SNAPSHOT_KEY, JSON.stringify(snapshot)),
    ]);

    const result: SyncResult = { status: "synced", totalSynced, snapshot };
    await recordRun(kv, result);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await kv.put(
      LAST_RUN_KEY,
      JSON.stringify({ at: new Date().toISOString(), error: message })
    );
    throw err;
  }
}

async function recordRun(kv: KVNamespace, result: SyncResult): Promise<void> {
  await kv.put(
    LAST_RUN_KEY,
    JSON.stringify({ at: new Date().toISOString(), ...result })
  );
}
