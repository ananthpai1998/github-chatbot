import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSection } from "@/components/settings/account-section";
import { APIKeyManager } from "@/components/settings/api-key-manager";
import { GitHubTokenManager } from "@/components/settings/github-token-manager";

export default async function SettingsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, API keys, and integrations
          </p>
        </div>

        {/* Account Section */}
        <AccountSection user={user} />

        {/* API Keys */}
        <APIKeyManager />

        {/* GitHub Integration */}
        <GitHubTokenManager />

        {/* Footer Note */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Note:</strong> All API keys and tokens are stored locally
            in your browser using localStorage. They are never sent to our servers
            and remain completely private to you.
          </p>
        </div>
      </div>
    </div>
  );
}
