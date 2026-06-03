CREATE TABLE IF NOT EXISTS ikaris_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  status VARCHAR(20) DEFAULT 'Belum Bayar' CHECK (status IN ('Belum Bayar', 'Sudah Bayar')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hapus constraint jika sudah ada untuk menghindari error
ALTER TABLE ikaris_records DROP CONSTRAINT IF EXISTS unique_user_month;
ALTER TABLE ikaris_records ADD CONSTRAINT unique_user_month UNIQUE (user_id, month_year);
