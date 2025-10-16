export interface SessionTokenData {
  client_secret: { value: string; expires_at: string };
  session_id: string;
  model: string;
}

export async function getSessionToken(): Promise<SessionTokenData> {
  const response = await fetch('/api/realtime/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
