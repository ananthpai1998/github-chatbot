"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import type { ToolConfig } from "@/lib/db/schema";

export function ToolsTab() {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState<ToolConfig | null>(null);

  // Fetch tools
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch("/api/admin/tools");
        const data = await response.json();
        if (data.tools) {
          setTools(data.tools);
        }
      } catch (error) {
        toast.error("Failed to fetch tools");
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  // Handle toggle
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle", isEnabled: enabled }),
      });

      if (response.ok) {
        toast.success(`Tool ${enabled ? "enabled" : "disabled"}`);
        // Refresh tools
        const res = await fetch("/api/admin/tools");
        const data = await res.json();
        if (data.tools) setTools(data.tools);
      } else {
        toast.error("Failed to update tool");
      }
    } catch (error) {
      toast.error("Failed to update tool");
    }
  };

  // Handle update
  const handleUpdateTool = async (updates: Partial<ToolConfig>) => {
    if (!editingTool) return;

    try {
      const response = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTool.id, ...updates }),
      });

      if (response.ok) {
        toast.success("Tool updated successfully");
        setEditingTool(null);
        // Refresh tools
        const res = await fetch("/api/admin/tools");
        const data = await res.json();
        if (data.tools) setTools(data.tools);
      } else {
        toast.error("Failed to update tool");
      }
    } catch (error) {
      toast.error("Failed to update tool");
    }
  };

  // Group tools by category
  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolConfig[]>);

  if (loading) {
    return <div className="text-center py-8">Loading tools...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tool Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure parameters, costs, and rate limits for each tool
        </p>
      </div>

      <Accordion type="multiple" defaultValue={Object.keys(groupedTools)} className="w-full">
        {Object.entries(groupedTools).map(([category, categoryTools]) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="text-lg font-medium capitalize">
              {category} Tools ({categoryTools.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {categoryTools.map((tool) => (
                  <Card key={tool.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tool.isEnabled}
                            onCheckedChange={(checked) => handleToggle(tool.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTool(tool)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Cost per Call</Label>
                          <p className="font-mono">${tool.costPerCall}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rate Limit (min)</Label>
                          <p className="font-mono">{tool.rateLimitPerMinute || "—"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rate Limit (hour)</Label>
                          <p className="font-mono">{tool.rateLimitPerHour || "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Edit Dialog */}
      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool: {editingTool?.name}</DialogTitle>
            <DialogDescription>Configure parameters, cost, rate limits, and prompts</DialogDescription>
          </DialogHeader>
          {editingTool && (
            <div className="space-y-4">
              {/* Tool Prompts */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Tool Prompts</h3>
                <p className="text-xs text-muted-foreground">
                  Customize how this tool is presented to the AI model
                </p>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="description">
                    <AccordionTrigger className="text-sm">Description</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="tool-description">Tool Description</Label>
                        <Textarea
                          id="tool-description"
                          placeholder="Describe what this tool does..."
                          defaultValue={editingTool.toolPrompts?.description || editingTool.description || ""}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          How the tool is described to the AI model
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="guidelines">
                    <AccordionTrigger className="text-sm">Usage Guidelines</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="tool-guidelines">Usage Guidelines</Label>
                        <Textarea
                          id="tool-guidelines"
                          placeholder="When and how to use this tool..."
                          defaultValue={editingTool.toolPrompts?.usageGuidelines || ""}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Instructions on when and how the AI should use this tool
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="examples">
                    <AccordionTrigger className="text-sm">Examples</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="tool-examples">Usage Examples</Label>
                        <Textarea
                          id="tool-examples"
                          placeholder="Example usage scenarios..."
                          defaultValue={editingTool.toolPrompts?.examples || ""}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Example scenarios demonstrating proper tool usage
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Cost & Rate Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Cost & Rate Limits</h3>
                <div className="space-y-2">
                  <Label>Cost per Call (USD)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    defaultValue={editingTool.costPerCall}
                    id="cost-per-call"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Limit (per minute)</Label>
                    <Input
                      type="number"
                      defaultValue={editingTool.rateLimitPerMinute || ""}
                      id="rate-limit-minute"
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate Limit (per hour)</Label>
                    <Input
                      type="number"
                      defaultValue={editingTool.rateLimitPerHour || ""}
                      id="rate-limit-hour"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTool(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const costPerCall = (
                  document.getElementById("cost-per-call") as HTMLInputElement
                )?.value;
                const rateLimitPerMinute = (
                  document.getElementById("rate-limit-minute") as HTMLInputElement
                )?.value;
                const rateLimitPerHour = (
                  document.getElementById("rate-limit-hour") as HTMLInputElement
                )?.value;

                const toolDescription = (
                  document.getElementById("tool-description") as HTMLTextAreaElement
                )?.value;
                const toolGuidelines = (
                  document.getElementById("tool-guidelines") as HTMLTextAreaElement
                )?.value;
                const toolExamples = (
                  document.getElementById("tool-examples") as HTMLTextAreaElement
                )?.value;

                handleUpdateTool({
                  costPerCall,
                  rateLimitPerMinute: rateLimitPerMinute ? parseInt(rateLimitPerMinute) : null,
                  rateLimitPerHour: rateLimitPerHour ? parseInt(rateLimitPerHour) : null,
                  toolPrompts: {
                    description: toolDescription || undefined,
                    usageGuidelines: toolGuidelines || undefined,
                    examples: toolExamples || undefined,
                  },
                });
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
