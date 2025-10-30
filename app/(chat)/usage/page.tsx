import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground">
            Track your API usage and token consumption
          </p>
        </div>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Billing Cycle</CardTitle>
            <CardDescription>
              Your usage statistics for this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Messages
                </p>
                <p className="text-3xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">
                  Coming soon
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tokens
                </p>
                <p className="text-3xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">
                  Coming soon
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Estimated Cost
                </p>
                <p className="text-3xl font-bold">$--</p>
                <p className="text-xs text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage by Model */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
            <CardDescription>
              Breakdown of your usage across different AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">Claude 3.5 Sonnet</p>
                  <p className="text-sm text-muted-foreground">-- messages</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">-- tokens</p>
                  <p className="text-sm text-muted-foreground">$--</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">Gemini 2.0 Flash</p>
                  <p className="text-sm text-muted-foreground">-- messages</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">-- tokens</p>
                  <p className="text-sm text-muted-foreground">$--</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">GPT-4o</p>
                  <p className="text-sm text-muted-foreground">-- messages</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">-- tokens</p>
                  <p className="text-sm text-muted-foreground">$--</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your most recent conversations and their usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 flex-1">
                  <p className="font-medium">Recent conversation</p>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a placeholder page. Usage tracking features are coming soon.
            Since you use your own API keys, you can monitor detailed usage through your provider's dashboard
            (Google AI Studio, Anthropic Console, or OpenAI Platform).
          </p>
        </div>
      </div>
    </div>
  );
}
