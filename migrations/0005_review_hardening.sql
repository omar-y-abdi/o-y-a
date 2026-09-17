CREATE TABLE cms_revision_resource_index (version INTEGER NOT NULL REFERENCES cms_revisions(version) ON DELETE CASCADE, src TEXT NOT NULL, reference_count INTEGER NOT NULL CHECK(reference_count > 0), PRIMARY KEY(version, src));
CREATE INDEX cms_revision_resource_src ON cms_revision_resource_index(src, version);
CREATE TABLE cms_revision_resource_indexed (version INTEGER PRIMARY KEY REFERENCES cms_revisions(version) ON DELETE CASCADE);
