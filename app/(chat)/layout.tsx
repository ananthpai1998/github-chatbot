import { cookies } from "next/headers";
import Script from "next/script";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={user ?? undefined} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
        <KeyboardShortcutsDialog />
      </DataStreamProvider>
    </>
  );
}
