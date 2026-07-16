-- Table for Appraisals
CREATE TABLE IF NOT EXISTS appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated to read appraisals" ON appraisals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to insert appraisals" ON appraisals FOR INSERT TO authenticated WITH CHECK ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin to update appraisals" ON appraisals FOR UPDATE TO authenticated USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin to delete appraisals" ON appraisals FOR DELETE TO authenticated USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Table for Job Scopes (SOPs)
CREATE TABLE IF NOT EXISTS job_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE job_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read job_scopes" ON job_scopes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to insert job_scopes" ON job_scopes FOR INSERT TO authenticated WITH CHECK ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin to update job_scopes" ON job_scopes FOR UPDATE TO authenticated USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin to delete job_scopes" ON job_scopes FOR DELETE TO authenticated USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
