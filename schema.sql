DROP TABLE IF EXISTS releases;

CREATE TABLE releases (
  release_id INTEGER PRIMARY KEY,
  instance_id INTEGER,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INTEGER,
  format TEXT,
  thumb_url TEXT,
  cover_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_releases_artist ON releases(artist);
CREATE INDEX idx_releases_year ON releases(year);
CREATE INDEX idx_releases_format ON releases(format);
CREATE INDEX idx_releases_title ON releases(title);
