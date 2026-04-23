/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  SYNC_KV: KVNamespace;
  DISCOGS_TOKEN: string;
  DISCOGS_USERNAME: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
