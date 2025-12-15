import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for secure file access
 * @param fileUrl - The file URL or path stored in the database
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 * @returns The signed URL or null if generation fails
 */
export const getSignedFileUrl = async (
  fileUrl: string | null,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!fileUrl) return null;

  // Extract the file path from the URL if it's a full URL
  let filePath = fileUrl;
  
  // If it's a full Supabase storage URL, extract just the path
  if (fileUrl.includes('/storage/v1/object/')) {
    const urlParts = fileUrl.split('/medical-files/');
    if (urlParts.length > 1) {
      filePath = urlParts[1];
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from('medical-files')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};
