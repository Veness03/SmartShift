-- Add missing columns for employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 25;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'hourly';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 0;

-- Create payroll records table
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL, 
    total_hours NUMERIC DEFAULT 0,
    base_pay NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_pay NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(employee_id, period)
);

ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid errors, then recreate
DROP POLICY IF EXISTS "Allow all operations for authenticated users on payroll_records" ON payroll_records;
CREATE POLICY "Allow all operations for authenticated users on payroll_records" ON payroll_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_quota NUMERIC DEFAULT 14;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_leave_quota NUMERIC DEFAULT 14;
