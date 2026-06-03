-- Users and RBAC
CREATE TABLE roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE departments (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  gender        TEXT CHECK (gender IN ('ikhwan','akhwat')),
  role_id       UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mutabaah targets (static lookup)
CREATE TABLE mutabaah_targets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender       TEXT CHECK (gender IN ('ikhwan','akhwat')),
  param_name   TEXT NOT NULL,
  target_value INTEGER NOT NULL
);

-- Mutabaah logs per user per day
CREATE TABLE mutabaah_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  log_date    DATE NOT NULL,
  param_1_val INTEGER DEFAULT 0,
  param_2_val INTEGER DEFAULT 0,
  param_3_val INTEGER DEFAULT 0,
  param_4_val INTEGER DEFAULT 0,
  param_5_val INTEGER DEFAULT 0,
  param_6_val INTEGER DEFAULT 0,
  param_7_val INTEGER DEFAULT 0,
  param_8_val INTEGER DEFAULT 0,
  param_9_val INTEGER DEFAULT 0,
  param_10_val INTEGER DEFAULT 0,
  param_11_val INTEGER DEFAULT 0,
  param_12_val INTEGER DEFAULT 0,
  hafalan_text TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Amanah (tasks)
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  assignee_id  UUID REFERENCES users(id),
  assigner_id  UUID REFERENCES users(id),
  committee_id UUID,
  status       TEXT CHECK (status IN ('pending','waiting_approval','completed')) DEFAULT 'pending',
  deadline     DATE,
  task_type    TEXT DEFAULT 'terencana' CHECK (task_type IN ('terencana', 'rutin')),
  is_template  BOOLEAN DEFAULT false,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('daily', 'weekly', 'monthly')),
  recurrence_day INTEGER,
  deadline_duration_days INTEGER,
  last_spawned_at DATE,
  parent_template_id UUID REFERENCES tasks(id),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attendance events and records
CREATE TABLE attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  event_name  TEXT NOT NULL,
  event_date  DATE NOT NULL,
  creator_id  UUID REFERENCES users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE attendance_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES attendances(id),
  user_id       UUID REFERENCES users(id),
  status        TEXT CHECK (status IN ('Hadir','Izin','Sakit','Alpa')),
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);
