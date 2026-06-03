-- Tambahkan role baru
INSERT INTO roles (name) VALUES 
  ('ketua_umum'), 
  ('wakil_ketum'), 
  ('sekretaris_umum'), 
  ('wakil_sekretaris'), 
  ('bendahara_umum'), 
  ('wakil_bendahara'), 
  ('ketua_departemen'), 
  ('sekretaris_departemen')
ON CONFLICT DO NOTHING;

-- Tambahkan departemen baru
INSERT INTO departments (name) VALUES 
  ('BPH'), 
  ('Tarbiyah Islamiyah'), 
  ('Syiar dan Dakwah'), 
  ('Fundrising'), 
  ('Human Resource')
ON CONFLICT DO NOTHING;

-- Opsional: Update role user yang sudah ada (contoh: mengubah Satya menjadi ketua_umum)
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'ketua_umum') 
WHERE email = 'satya@rohis.id';

UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'ketua_departemen'),
    department_id = (SELECT id FROM departments WHERE name = 'Tarbiyah Islamiyah')
WHERE email = 'yasin@rohis.id';
