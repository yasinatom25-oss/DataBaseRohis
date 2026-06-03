-- Tambahkan kolom untuk mendukung Amanah Rutin (Recurring Tasks)
ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'terencana' CHECK (task_type IN ('terencana', 'rutin'));
ALTER TABLE tasks ADD COLUMN is_template BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN recurrence_interval TEXT CHECK (recurrence_interval IN ('daily', 'weekly', 'monthly'));
ALTER TABLE tasks ADD COLUMN recurrence_day INTEGER;
ALTER TABLE tasks ADD COLUMN deadline_duration_days INTEGER;
ALTER TABLE tasks ADD COLUMN last_spawned_at DATE;
ALTER TABLE tasks ADD COLUMN parent_template_id UUID REFERENCES tasks(id);
