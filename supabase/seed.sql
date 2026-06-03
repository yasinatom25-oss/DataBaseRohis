-- RESET SEMUA DATA (HATI-HATI)
TRUNCATE TABLE mutabaah_logs CASCADE;
TRUNCATE TABLE attendances CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE roles CASCADE;

-- Daftar Roles (Jabatan)
INSERT INTO roles (name) VALUES 
  ('pembina'), 
  ('ketua_umum'), 
  ('wakil_ketum'), 
  ('sekretaris_umum'), 
  ('wakil_sekretaris'), 
  ('bendahara_umum'), 
  ('wakil_bendahara'), 
  ('ketua_departemen'), 
  ('sekretaris_departemen'), 
  ('pj_program'), 
  ('anggota')
ON CONFLICT DO NOTHING;

-- Daftar Departments (Divisi)
INSERT INTO departments (name) VALUES 
  ('BPH'), 
  ('Tarbiyah Islamiyah'), 
  ('Syiar dan Dakwah'), 
  ('Fundrising'), 
  ('Human Resource')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  role_pembina UUID;
  role_ketum UUID;
  role_sekum UUID;
  role_bendum UUID;
  role_kadiv UUID;
  role_sekdiv UUID;
  role_pj UUID;
  role_anggota UUID;

  dept_bph UUID;
  dept_tarbiyah UUID;
  dept_syiar UUID;
  dept_fund UUID;
  dept_hr UUID;

  satya_id UUID;
  pembina_id UUID;
BEGIN
  -- Data di tabel ini akan direlasikan dari roles dan departments yang sudah bersih

  -- Ambil ID Roles
  SELECT id INTO role_pembina FROM roles WHERE name = 'pembina';
  SELECT id INTO role_ketum FROM roles WHERE name = 'ketua_umum';
  SELECT id INTO role_sekum FROM roles WHERE name = 'sekretaris_umum';
  SELECT id INTO role_bendum FROM roles WHERE name = 'bendahara_umum';
  SELECT id INTO role_kadiv FROM roles WHERE name = 'ketua_departemen';
  SELECT id INTO role_sekdiv FROM roles WHERE name = 'sekretaris_departemen';
  SELECT id INTO role_pj FROM roles WHERE name = 'pj_program';
  SELECT id INTO role_anggota FROM roles WHERE name = 'anggota';
  
  -- Ambil ID Departments
  SELECT id INTO dept_bph FROM departments WHERE name = 'BPH';
  SELECT id INTO dept_tarbiyah FROM departments WHERE name = 'Tarbiyah Islamiyah';
  SELECT id INTO dept_syiar FROM departments WHERE name = 'Syiar dan Dakwah';
  SELECT id INTO dept_fund FROM departments WHERE name = 'Fundrising';
  SELECT id INTO dept_hr FROM departments WHERE name = 'Human Resource';

  -- SEED USERS (Hanya Pembina dan Ketua Umum)
  INSERT INTO users (email, name, gender, role_id, department_id) VALUES
    ('pembina@rohis.id', 'Fathimah Hasim', 'akhwat', role_pembina, dept_bph),
    ('satya@rohis.id', 'Satya Ghazi', 'ikhwan', role_ketum, dept_bph)
  ON CONFLICT DO NOTHING;

  -- Simpan UUID User jika dibutuhkan kedepannya
  SELECT id INTO satya_id FROM users WHERE email = 'satya@rohis.id';
  SELECT id INTO pembina_id FROM users WHERE email = 'pembina@rohis.id';

END $$;
