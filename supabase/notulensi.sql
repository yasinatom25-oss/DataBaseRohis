-- Tambahkan kolom detail lokasi dan notulensi ke tabel attendances
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('Offline', 'Online')),
ADD COLUMN IF NOT EXISTS location_detail TEXT,
ADD COLUMN IF NOT EXISTS notetaker_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes_content TEXT;
