import { NextResponse } from "next/server";
import { getAllModels, getModelById, toggleModelEnabled, updateModelConfig } from "@/lib/db/admin-queries";
import { logAdminAction } from "@/lib/db/audit-queries";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all models
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const models = await getAllModels();

    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 });
  }
}

// PATCH - Update model configuration
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Get current state for audit log
    const before = await getModelById(id);

    // Handle toggle action
    if (action === "toggle") {
      if (typeof data.isEnabled !== "boolean") {
        return NextResponse.json({ error: "isEnabled must be a boolean" }, { status: 400 });
      }
      await toggleModelEnabled(id, data.isEnabled);

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "toggle_model",
        resourceType: "model",
        resourceId: id,
        before: { isEnabled: before?.isEnabled },
        after: { isEnabled: data.isEnabled },
      });
    } else {
      // Handle general update
      console.log("[Admin API] Updating model:", id);
      console.log("[Admin API] Update data:", JSON.stringify(data, null, 2));

      await updateModelConfig(id, data);

      console.log("[Admin API] ✓ Model updated successfully");

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "update_model",
        resourceType: "model",
        resourceId: id,
        before: before || undefined,
        after: data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update model";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 });
  }
}
