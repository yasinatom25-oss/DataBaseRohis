-- Tambahkan kolom waktu pelaksanaan rapat
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS event_time TEXT;
