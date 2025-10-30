import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserPreferences,
  toggleUserThinking,
} from "@/lib/db/user-preferences-queries";

/**
 * GET /api/user/preferences
 * Get current user's preferences
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserPreferences(user.id);

    return NextResponse.json({
      preferences: preferences || {
        thinkingEnabled: false,
        preferredAgentType: "chat",
      },
    });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update user preferences
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { thinkingEnabled } = body;

    if (typeof thinkingEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updated = await toggleUserThinking(user.id, thinkingEnabled);

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
