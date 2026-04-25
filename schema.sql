CREATE TABLE IF NOT EXISTS releases (
  release_id INTEGER PRIMARY KEY,
  instance_id INTEGER,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INTEGER,
  format TEXT,
  thumb_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist);
CREATE INDEX IF NOT EXISTS idx_releases_year ON releases(year);
CREATE INDEX IF NOT EXISTS idx_releases_format ON releases(format);
CREATE INDEX IF NOT EXISTS idx_releases_title ON releases(title);
