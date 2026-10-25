ALTER TABLE cms_mail_files ADD COLUMN state TEXT NOT NULL DEFAULT 'ready' CHECK (state IN ('uploading','ready','deleting'));
ALTER TABLE cms_mail_files ADD COLUMN deleting_at TEXT;
CREATE INDEX cms_mail_files_deleting ON cms_mail_files(deleting_at) WHERE state = 'deleting';
CREATE TABLE cms_mail_cleanup (id INTEGER PRIMARY KEY CHECK (id = 1), cursor TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0);
INSERT INTO cms_mail_cleanup(id,cursor) VALUES(1,'');
