"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { logout } from "@/app/(auth)/actions";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export function SidebarUserNav({ user: propUser }: { user: User | undefined }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const { setTheme, resolvedTheme } = useTheme();

  // Use the user from props if available (for SSR), otherwise from hook
  const currentUser = propUser || user;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {loading ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt={currentUser?.email ?? "User Avatar"}
                  className="rounded-full"
                  height={24}
                  src={`https://avatar.vercel.sh/${currentUser?.email}`}
                  width={24}
                />
                <span className="truncate" data-testid="user-email">
                  {currentUser?.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-settings"
              onSelect={() => router.push("/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer"
                onClick={async () => {
                  if (loading) {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });
                    return;
                  }

                  try {
                    await logout();
                    router.push("/login");
                  } catch (error) {
                    toast({
                      type: "error",
                      description: "Failed to sign out. Please try again.",
                    });
                  }
                }}
                type="button"
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
