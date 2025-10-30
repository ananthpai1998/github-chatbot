import { NextResponse } from "next/server";
import { getAllTools, getToolById, toggleToolEnabled, updateToolConfig } from "@/lib/db/admin-queries";
import { logAdminAction } from "@/lib/db/audit-queries";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all tools
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const tools = await getAllTools();

    return NextResponse.json({ tools });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tools";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}

// PATCH - Update tool configuration
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    // Get current state for audit log
    const before = await getToolById(id);

    // Handle toggle action
    if (action === "toggle") {
      if (typeof data.isEnabled !== "boolean") {
        return NextResponse.json({ error: "isEnabled must be a boolean" }, { status: 400 });
      }
      await toggleToolEnabled(id, data.isEnabled);

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "toggle_tool",
        resourceType: "tool",
        resourceId: id,
        before: { isEnabled: before?.isEnabled },
        after: { isEnabled: data.isEnabled },
      });
    } else {
      // Handle general update
      await updateToolConfig(id, data);

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "update_tool",
        resourceType: "tool",
        resourceId: id,
        before: before || undefined,
        after: data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tool";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}
