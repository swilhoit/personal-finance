import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("[Chat Test API] Request received");
  
  try {
    const body = await req.json();
    console.log("[Chat Test API] Body received:", JSON.stringify(body, null, 2));
    
    // Echo back what we received for debugging
    return NextResponse.json({
      success: true,
      received: body,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries()),
    });
  } catch (error) {
    console.error("[Chat Test API] Error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 400 });
  }
}