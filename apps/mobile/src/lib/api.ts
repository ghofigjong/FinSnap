const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('Image is too large. Please try a lower quality or smaller image.');
    }
    const error = await response.json().catch(() => ({
      error: response.status >= 500
        ? 'Server error — the image may be too large or the request timed out. Try again with a smaller image.'
        : `Request failed (${response.status})`,
    }));
    const err = new Error(error.error || `HTTP error! status: ${response.status}`) as any;
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function uploadImage(
  base64Image: string,
  token: string
): Promise<{ url: string }> {
  return apiRequest('/api/upload', {
    method: 'POST',
    body: { image: base64Image },
    token,
  });
}

export async function scanReceipt(
  imageUrl: string,
  token: string
): Promise<any> {
  return apiRequest('/api/scan', {
    method: 'POST',
    body: { imageUrl },
    token,
  });
}
