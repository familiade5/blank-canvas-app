-- Create storage bucket for user uploads (screenshots and CSVs)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-uploads', 'user-uploads', false, 10485760);

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view their files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all files
CREATE POLICY "Admins can view all files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'user-uploads' 
  AND public.has_role(auth.uid(), 'admin')
);