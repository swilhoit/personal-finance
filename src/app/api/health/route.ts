import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasPlaidClient: !!process.env.PLAID_CLIENT_ID,
      hasPlaidSecret: !!process.env.PLAID_SECRET,
    }
  });
}