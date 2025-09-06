import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return OpenAI API key for client-side WebSocket connection
    // NOTE: In production, you might want to create temporary tokens or use a proxy
    return Response.json({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ 
      error: 'Failed to authenticate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}