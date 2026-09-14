CREATE TABLE cms_head (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL DEFAULT 0);
INSERT INTO cms_head (id, version) VALUES (1, 0);
CREATE TABLE cms_revisions (version INTEGER PRIMARY KEY CHECK (version > 0), request_id TEXT NOT NULL UNIQUE, base_version INTEGER NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL, payload_hash TEXT NOT NULL, project BLOB NOT NULL, manifest TEXT NOT NULL, summary TEXT NOT NULL, CHECK (base_version = version - 1));
CREATE TABLE cms_rendered (version INTEGER NOT NULL REFERENCES cms_revisions(version), path TEXT NOT NULL, html TEXT NOT NULL, css TEXT NOT NULL DEFAULT '', meta TEXT NOT NULL DEFAULT '{}', PRIMARY KEY (version, path));
CREATE TABLE cms_media (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL CHECK (bytes > 0), width INTEGER, height INTEGER, alt TEXT NOT NULL DEFAULT '', sha256 TEXT NOT NULL, created_at TEXT NOT NULL, published_at TEXT, archived_at TEXT);
