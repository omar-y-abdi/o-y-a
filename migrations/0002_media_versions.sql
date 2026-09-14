ALTER TABLE cms_media ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
CREATE INDEX cms_media_gallery ON cms_media(created_at DESC, id DESC);
