# Supabase Storage Setup Guide

This guide will help you set up the `chat-attachments` storage bucket in your Supabase project.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard

## Steps to Create Storage Bucket

### 1. Navigate to Storage

1. Go to your Supabase project dashboard
2. Click on **Storage** in the left sidebar
3. Click **New bucket** button

### 2. Create the Bucket

Configure the bucket with these settings:

- **Name:** `chat-attachments`
- **Public bucket:** ✅ Enabled (so uploaded images can be accessed via public URLs)
- **File size limit:** 5 MB (recommended, matches upload validation)
- **Allowed MIME types:** `image/jpeg, image/png` (optional but recommended)

Click **Create bucket** to save.

### 3. Set Up Row Level Security (RLS) Policies

After creating the bucket, you need to set up policies to control access:

#### Policy 1: Allow authenticated users to upload files

```sql
-- Name: Users can upload their own files
-- Operation: INSERT
-- Policy:
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Allow public read access

```sql
-- Name: Public read access
-- Operation: SELECT
-- Policy:
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
```

#### Policy 3: Allow users to update their own files

```sql
-- Name: Users can update their own files
-- Operation: UPDATE
-- Policy:
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Allow users to delete their own files

```sql
-- Name: Users can delete their own files
-- Operation: DELETE
-- Policy:
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. Apply the Policies

1. In the Storage section, click on your `chat-attachments` bucket
2. Click on **Policies** tab
3. Click **New policy**
4. For each policy above:
   - Give it the name from the comment
   - Select the appropriate operation (INSERT/SELECT/UPDATE/DELETE)
   - Paste the policy SQL
   - Click **Review** then **Save policy**

## Verification

To verify the setup is working:

1. Try uploading an image through the DevMate chat interface
2. Check that the file appears in the Storage bucket under `<user-id>/<timestamp>-<filename>`
3. Verify the public URL is accessible

## File Organization

Files are organized in the bucket as:

```
chat-attachments/
├── <user-id-1>/
│   ├── 1234567890-image1.png
│   └── 1234567891-screenshot.jpg
├── <user-id-2>/
│   └── 1234567892-photo.png
...
```

This ensures:
- Files are organized by user
- File name collisions are avoided (timestamp prefix)
- RLS policies can easily restrict access by folder

## Troubleshooting

### Upload fails with "Upload failed" error

Check:
- Bucket name is exactly `chat-attachments`
- Bucket is set to public
- INSERT policy is created and enabled
- User is authenticated

### Can't access uploaded images

Check:
- SELECT policy for public access is enabled
- Bucket is marked as public
- File path is correct

### Getting 403 Forbidden errors

Check:
- RLS policies are correctly configured
- User ID in the path matches the authenticated user
- Policies are enabled (not just created)

## Security Notes

- Files are prefixed with user ID to prevent unauthorized access via RLS
- Only authenticated users can upload files
- Users can only upload to their own folder
- All files are publicly readable (needed for displaying images in chat)
- Consider adding file scanning for production use
- Monitor storage usage and set up alerts

## Next Steps

After setting up storage:
1. Test file uploads through the application
2. Verify images display correctly in chat
3. Check Supabase Storage dashboard for uploaded files
4. Monitor storage usage in your Supabase dashboard
