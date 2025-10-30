"use client";

import { useEffect, useState } from "react";
import { Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { AgentConfig, ToolConfig } from "@/lib/db/schema";

export function AgentsTab() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Fetch agents and tools
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, toolsRes] = await Promise.all([
          fetch("/api/admin/agents"),
          fetch("/api/admin/tools"),
        ]);
        const [agentsData, toolsData] = await Promise.all([
          agentsRes.json(),
          toolsRes.json(),
        ]);

        if (agentsData.agents) setAgents(agentsData.agents);
        if (toolsData.tools) setTools(toolsData.tools);
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize selectedTools when editingAgent changes
  useEffect(() => {
    if (editingAgent) {
      setSelectedTools(editingAgent.enabledTools || []);
    }
  }, [editingAgent]);

  // Handle tool toggle
  const handleToolToggle = (toolId: string, checked: boolean) => {
    setSelectedTools(prev => {
      if (checked) {
        return [...prev, toolId];
      } else {
        return prev.filter(id => id !== toolId);
      }
    });
  };

  // Handle update agent
  const handleUpdateAgent = async (updates: Partial<AgentConfig>) => {
    if (!editingAgent) return;

    try {
      const response = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAgent.id, ...updates }),
      });

      if (response.ok) {
        toast.success("Agent updated successfully");
        setEditingAgent(null);
        setSelectedTools([]);
        // Refresh agents
        const res = await fetch("/api/admin/agents");
        const data = await res.json();
        if (data.agents) setAgents(data.agents);
      } else {
        toast.error("Failed to update agent");
      }
    } catch (error) {
      toast.error("Failed to update agent");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading agents...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Agent Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system prompts and tools for different agent types
        </p>
      </div>

      <div className="grid gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className={agent.status === "coming_soon" ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {agent.name}
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                      {agent.status === "active" ? "Active" : "Coming Soon"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
                {agent.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAgent(agent)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Prompt */}
              <Collapsible
                open={expandedPrompts[agent.id]}
                onOpenChange={(open) =>
                  setExpandedPrompts((prev) => ({ ...prev, [agent.id]: open }))
                }
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">System Prompt</Label>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedPrompts[agent.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <pre className="mt-2 rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                    {agent.systemPrompt}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              {/* Enabled Tools */}
              <div>
                <Label className="text-sm font-medium">Enabled Tools</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agent.enabledTools.length > 0 ? (
                    agent.enabledTools.map((toolId) => (
                      <Badge key={toolId} variant="outline">
                        {toolId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tools enabled</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agent: {editingAgent?.name}</DialogTitle>
            <DialogDescription>Update system prompt and enabled tools</DialogDescription>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  defaultValue={editingAgent.systemPrompt}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Enabled Tools</Label>
                <p className="text-xs text-muted-foreground">
                  Select which tools this agent can access. Globally disabled tools are marked and cannot be enabled.
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-auto border rounded-md p-3">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className={`flex items-start space-x-2 p-2 rounded ${
                        !tool.isEnabled ? "bg-muted/50 opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        id={`tool-${tool.id}`}
                        checked={selectedTools.includes(tool.id)}
                        onCheckedChange={(checked) => handleToolToggle(tool.id, checked as boolean)}
                        disabled={!tool.isEnabled}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`tool-${tool.id}`}
                          className={`text-sm font-medium ${
                            tool.isEnabled ? "cursor-pointer" : "cursor-not-allowed"
                          }`}
                        >
                          {tool.name}
                          {!tool.isEnabled && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Globally Disabled
                            </Badge>
                          )}
                        </label>
                        {tool.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAgent(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const systemPrompt = (
                  document.getElementById("system-prompt") as HTMLTextAreaElement
                )?.value;

                handleUpdateAgent({
                  systemPrompt,
                  enabledTools: selectedTools,
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
