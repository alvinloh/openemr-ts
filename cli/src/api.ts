import { getApiUrl, getApiKey } from './config.js';

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  opts?: { noAuth?: boolean },
): Promise<any> {
  const url = `${getApiUrl()}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!opts?.noAuth) {
    headers['x-api-key'] = getApiKey();
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}
