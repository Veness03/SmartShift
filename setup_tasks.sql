CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assignee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'To Do',
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated to read tasks" ON tasks;
  DROP POLICY IF EXISTS "Allow admin to manage tasks" ON tasks;
  DROP POLICY IF EXISTS "Allow assignee to update task status" ON tasks;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE POLICY "Allow authenticated to read tasks" ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin to manage tasks" ON tasks FOR ALL TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow assignee to update task status" ON tasks FOR UPDATE TO authenticated USING (true); -- simplify RLS for demo, but can be restricted further
