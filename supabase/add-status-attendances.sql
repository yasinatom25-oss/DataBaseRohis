-- Tambahkan kolom status ke tabel attendances untuk memisahkan jadwal dan riwayat
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Scheduled';
