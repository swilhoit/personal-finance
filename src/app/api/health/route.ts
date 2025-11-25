import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasTeller: !!process.env.TELLER_APPLICATION_ID,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasFinnhub: !!process.env.FINNHUB_API_KEY,
    }
  });
}