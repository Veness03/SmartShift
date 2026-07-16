INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow all operations on documents bucket"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
