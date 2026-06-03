-- Tambahkan kolom param_13_val ke tabel mutabaah_logs
ALTER TABLE mutabaah_logs ADD COLUMN IF NOT EXISTS param_13_val INTEGER DEFAULT 0;
