ALTER TABLE cms_media ADD COLUMN trashed_at TEXT;
CREATE INDEX cms_media_lifecycle ON cms_media(archived_at, trashed_at, created_at DESC, id DESC);
CREATE TABLE cms_builtin_resource_state (src TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0, name TEXT, alt TEXT, archived_at TEXT, trashed_at TEXT, deleted_at TEXT, replacement_id TEXT, CHECK (version >= 0));
