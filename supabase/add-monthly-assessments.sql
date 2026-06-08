CREATE TABLE monthly_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES users(id),
  month_year VARCHAR(7) NOT NULL,
  perkataan INTEGER DEFAULT 0,
  mutabaah INTEGER DEFAULT 0,
  dua_arah INTEGER DEFAULT 0,
  antar INTEGER DEFAULT 0,
  kerjasama INTEGER DEFAULT 0,
  kontribusi INTEGER DEFAULT 0,
  amanah INTEGER DEFAULT 0,
  akademik INTEGER DEFAULT 0,
  penyampaian INTEGER DEFAULT 0,
  diksi INTEGER DEFAULT 0,
  kepekaan INTEGER DEFAULT 0,
  inovasi INTEGER DEFAULT 0,
  rapat INTEGER DEFAULT 0,
  kritis INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE monthly_assessments ADD CONSTRAINT unique_user_month_assessment UNIQUE (user_id, month_year);
