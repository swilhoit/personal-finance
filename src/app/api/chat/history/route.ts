import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id") || req.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("chat_history")
      .select("role, content, created_at, session_id, metadata")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


