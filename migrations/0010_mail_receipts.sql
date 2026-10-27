CREATE TABLE cms_mail_receipts (request_id TEXT PRIMARY KEY, resend_id TEXT NOT NULL UNIQUE, sender TEXT NOT NULL, created_at TEXT NOT NULL, scheduled_at TEXT);
INSERT INTO cms_mail_receipts(request_id,resend_id,sender,created_at,scheduled_at) SELECT request_id,resend_id,sender,created_at,scheduled_at FROM cms_sent_mail WHERE resend_id IS NOT NULL;
