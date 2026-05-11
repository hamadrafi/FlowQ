import { supabase } from './supabaseClient';

export async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

const BASE_URL = '/api';

export async function fetcher(url: string) {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${url}`, { headers });
  if (!res.ok) throw new Error('An error occurred while fetching data');
  return res.json();
}

export async function poster(url: string, body: any) {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}
