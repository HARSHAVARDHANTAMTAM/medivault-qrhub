-- Make the medical-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'medical-files';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Patients can view files linked to their records
CREATE POLICY "Patients can view their medical files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.medical_records
    WHERE file_url LIKE '%' || storage.objects.name || '%'
    AND patient_id = auth.uid()
  )
);

-- Hospitals can view files they uploaded
CREATE POLICY "Hospitals can view files they uploaded"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.medical_records
    WHERE file_url LIKE '%' || storage.objects.name || '%'
    AND hospital_id = auth.uid()
  )
);

-- Admins can view all medical files
CREATE POLICY "Admins can view all medical files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-files'
  AND public.has_role(auth.uid(), 'admin')
);

-- Hospitals can upload medical files
CREATE POLICY "Hospitals can upload medical files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-files'
  AND public.has_role(auth.uid(), 'hospital')
);

-- Hospitals can update files they uploaded
CREATE POLICY "Hospitals can update their uploaded files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'medical-files'
  AND public.has_role(auth.uid(), 'hospital')
);

-- Hospitals can delete files they uploaded
CREATE POLICY "Hospitals can delete their uploaded files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-files'
  AND public.has_role(auth.uid(), 'hospital')
);