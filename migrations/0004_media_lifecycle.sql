ALTER TABLE cms_media ADD COLUMN trashed_at TEXT;
ALTER TABLE cms_media ADD COLUMN deleting_at TEXT;
CREATE INDEX cms_media_lifecycle ON cms_media(trashed_at, archived_at, created_at DESC, id DESC);
CREATE TABLE cms_builtin_resource_state (source_path TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0), name TEXT, alt TEXT, archived_at TEXT, trashed_at TEXT, deleted_at TEXT, managed_asset_id TEXT, updated_at TEXT NOT NULL);
CREATE TABLE cms_media_delete_queue (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, snapshot TEXT NOT NULL, created_at TEXT NOT NULL);
