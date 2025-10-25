"use client";

import type { User } from "@supabase/supabase-js";
import { LogOutIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/toast";

export function AccountSection({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const result = await logout();

      if (result.success) {
        toast({
          type: "success",
          description: "Logged out successfully",
        });
        router.push("/login");
      } else {
        toast({
          type: "error",
          description: result.error || "Failed to logout",
        });
      }
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to logout",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Account
        </CardTitle>
        <CardDescription>
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Email</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">User ID</div>
          <div className="font-mono text-xs text-muted-foreground">{user.id}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Account Created</div>
          <div className="text-sm text-muted-foreground">
            {new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
