import { NextResponse } from "next/server";

export async function GET() {
  console.log("[Chat Health] Health check requested");
  
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  console.log("[Chat Health] OpenAI API Key configured:", hasOpenAIKey);
  
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    openai_configured: hasOpenAIKey,
    api_version: "1.0.0",
  });
}