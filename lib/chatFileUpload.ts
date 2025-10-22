/**
 * File Upload for Chat
 */

export async function uploadChatFile(file: File, sessionToken: string): Promise<{
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

  const response = await fetch(`${API_BASE}/chat/upload-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

