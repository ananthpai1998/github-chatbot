import { NextResponse } from "next/server";
import { getPricingLastSynced, syncAllPricing } from "@/lib/admin/pricing-sync";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST - Sync pricing for all models
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const result = await syncAllPricing();
    const lastSynced = await getPricingLastSynced();

    return NextResponse.json({
      success: true,
      ...result,
      lastSynced,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync pricing";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}

// GET - Get last sync time
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const lastSynced = await getPricingLastSynced();

    return NextResponse.json({ lastSynced });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get sync status";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}
