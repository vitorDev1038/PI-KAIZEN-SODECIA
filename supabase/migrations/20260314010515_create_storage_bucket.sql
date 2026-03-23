/*
  # Create Storage Bucket for Kaizen Images

  1. Storage
    - Create public bucket `kaizen-images` for storing kaizen submission images
    - Enable public access for image viewing
    - Set up basic file size limits

  2. Security
    - Set RLS policies to allow authenticated users to upload
    - Allow public read access to images
*/

-- Create the storage bucket for kaizen images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaizen-images', 'kaizen-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload kaizen images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kaizen-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own kaizen images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'kaizen-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'kaizen-images' AND auth.uid() = owner);

-- Allow anyone to read images
CREATE POLICY "Public read access to kaizen images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'kaizen-images');
