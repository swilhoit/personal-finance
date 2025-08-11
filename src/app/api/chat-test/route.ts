import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Chat Test - Request body:", JSON.stringify(body, null, 2));
    
    // Return a simple response that mimics the expected format
    return new Response(
      `data: {"text":"Test response received. You sent: ${body.messages?.[0]?.content || body.text || 'unknown'}"}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error("Chat test error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}