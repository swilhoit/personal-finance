import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return Response.json({ error: 'Failed to get session' }, { status: 401 });
    }

    // Get the session to return the access token
    const { data: sessionData } = await supabase.auth.getSession();
    
    return Response.json({ 
      data: { 
        session: sessionData.session,
        user 
      } 
    });

  } catch (error) {
    console.error('Session error:', error);
    return Response.json({ 
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}