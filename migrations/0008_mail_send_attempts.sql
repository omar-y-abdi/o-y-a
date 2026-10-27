ALTER TABLE cms_sent_mail ADD COLUMN send_attempts INTEGER NOT NULL DEFAULT 1 CHECK (send_attempts >= 0);
