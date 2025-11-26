/**
 * Investment Holdings API
 * Manage user's portfolio positions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: holdings, error } = await supabase
      .from("user_holdings")
      .select("*")
      .eq("user_id", user.id)
      .order("symbol");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
    }

    return NextResponse.json({ holdings });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, shares, costBasis, purchaseDate, accountName, notes } = body;

    if (!symbol || !shares) {
      return NextResponse.json(
        { error: "Symbol and shares are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_holdings")
      .insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        shares: parseFloat(shares),
        cost_basis: costBasis ? parseFloat(costBasis) : null,
        purchase_date: purchaseDate || null,
        account_name: accountName || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding holding:", error);
      return NextResponse.json({ error: "Failed to add holding" }, { status: 500 });
    }

    return NextResponse.json({ success: true, holding: data });
  } catch (error) {
    console.error("Error adding holding:", error);
    return NextResponse.json({ error: "Failed to add holding" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, shares, costBasis, purchaseDate, accountName, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Holding ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (shares !== undefined) updateData.shares = parseFloat(shares);
    if (costBasis !== undefined) updateData.cost_basis = costBasis ? parseFloat(costBasis) : null;
    if (purchaseDate !== undefined) updateData.purchase_date = purchaseDate || null;
    if (accountName !== undefined) updateData.account_name = accountName || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data, error } = await supabase
      .from("user_holdings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating holding:", error);
      return NextResponse.json({ error: "Failed to update holding" }, { status: 500 });
    }

    return NextResponse.json({ success: true, holding: data });
  } catch (error) {
    console.error("Error updating holding:", error);
    return NextResponse.json({ error: "Failed to update holding" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Holding ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_holdings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting holding:", error);
      return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting holding:", error);
    return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 });
  }
}




