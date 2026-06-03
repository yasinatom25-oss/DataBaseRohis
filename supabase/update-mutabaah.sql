-- 1. Tambahkan kolom ke-13 untuk log ibadah
ALTER TABLE mutabaah_logs ADD COLUMN IF NOT EXISTS param_13_val INTEGER DEFAULT 0;

-- 2. Bersihkan target ibadah yang lama
DELETE FROM mutabaah_targets;

-- 3. Masukkan target Ikhwan
INSERT INTO mutabaah_targets (gender, param_name, target_value) VALUES
('ikhwan', 'Shalat Tepat Waktu', 100),
('ikhwan', 'Shalat Tahajud', 12),
('ikhwan', 'Shalat Duha', 16),
('ikhwan', 'Shalat Rawatib', 84),
('ikhwan', 'Saum Sunnah', 8),
('ikhwan', 'Tilawah', 280),
('ikhwan', 'Tambahan Hafalan', 28),
('ikhwan', 'Capaian Hafalan', 28),
('ikhwan', 'Al-Matsurat Pagi', 16),
('ikhwan', 'Al-Matsurat Sore', 16),
('ikhwan', 'Birrul Walidain', 28),
('ikhwan', 'Infaq', 8),
('ikhwan', 'Menambah Wawasan Islami', 4);

-- 4. Masukkan target Akhwat
INSERT INTO mutabaah_targets (gender, param_name, target_value) VALUES
('akhwat', 'Shalat Tepat Waktu', 75),
('akhwat', 'Shalat Tahajud', 9),
('akhwat', 'Shalat Duha', 12),
('akhwat', 'Shalat Rawatib', 63),
('akhwat', 'Saum Sunnah', 6),
('akhwat', 'Tilawah', 210),
('akhwat', 'Tambahan Hafalan', 28),
('akhwat', 'Capaian Hafalan', 28),
('akhwat', 'Al-Matsurat Pagi', 16),
('akhwat', 'Al-Matsurat Sore', 16),
('akhwat', 'Birrul Walidain', 28),
('akhwat', 'Infaq', 8),
('akhwat', 'Menambah Wawasan Islami', 4);
