import { NextRequest } from 'next/server';
import { supabase } from './supabaseClient';

/**
 * Extracts and verifies the user from the request using Supabase Auth.
 * Expects the JWT in the 'Authorization' header as a Bearer token.
 */
export async function getUserFromRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Auth Error:', error?.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ Unexpected Auth Error:', error);
    return null;
  }
}
