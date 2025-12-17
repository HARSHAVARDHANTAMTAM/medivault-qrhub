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

/**
 * Get signed URLs for multiple files (comma-separated)
 * @param fileUrlString - Comma-separated file paths
 * @param expiresIn - URL expiry time in seconds
 * @returns Array of signed URLs
 */
export const getMultipleSignedUrls = async (
  fileUrlString: string | null,
  expiresIn: number = 3600
): Promise<{ url: string; name: string }[]> => {
  if (!fileUrlString) return [];

  const filePaths = fileUrlString.split(',').filter(p => p.trim());
  const results: { url: string; name: string }[] = [];

  for (const filePath of filePaths) {
    const signedUrl = await getSignedFileUrl(filePath.trim(), expiresIn);
    if (signedUrl) {
      // Extract filename from path
      const fileName = filePath.split('/').pop() || 'file';
      results.push({ url: signedUrl, name: fileName });
    }
  }

  return results;
};

/**
 * Check if a file_url contains multiple files
 */
export const hasMultipleFiles = (fileUrl: string | null): boolean => {
  if (!fileUrl) return false;
  return fileUrl.includes(',');
};

/**
 * Count the number of files in a file_url string
 */
export const countFiles = (fileUrl: string | null): number => {
  if (!fileUrl) return 0;
  return fileUrl.split(',').filter(p => p.trim()).length;
};
