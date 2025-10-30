import { NextResponse } from "next/server";
import { getAllAgents, getAgentById, updateAgentConfig, updateAgentTools } from "@/lib/db/admin-queries";
import { logAdminAction } from "@/lib/db/audit-queries";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all agents
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const agents = await getAllAgents();

    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch agents";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}

// PATCH - Update agent configuration
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    requireAdmin(user);

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    // Get current state for audit log
    const before = await getAgentById(id);

    // Handle tools update specifically
    if (action === "updateTools") {
      if (!Array.isArray(data.toolIds)) {
        return NextResponse.json({ error: "toolIds must be an array" }, { status: 400 });
      }
      await updateAgentTools(id, data.toolIds);

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "update_agent_tools",
        resourceType: "agent",
        resourceId: id,
        before: { enabledTools: before?.enabledTools },
        after: { enabledTools: data.toolIds },
      });
    } else {
      // Handle general update
      await updateAgentConfig(id, data);

      // Log audit action
      await logAdminAction({
        adminId: user!.id,
        adminEmail: user!.email || "unknown",
        action: "update_agent",
        resourceType: "agent",
        resourceId: id,
        before: before || undefined,
        after: data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update agent";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Admin") ? 403 : 500 }
    );
  }
}
