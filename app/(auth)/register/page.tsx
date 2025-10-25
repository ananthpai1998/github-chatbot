"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register, signInWithGithub } from "../actions";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: state.message || "Account already exists!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: state.message || "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created successfully!" });
      setIsSuccessful(true);
      router.push("/chat");
    }
  }, [state.status, state.message, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGithub();
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to sign in with GitHub",
      });
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            Join DevMate
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Your GitHub AI Assistant
          </p>
        </div>

        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <form action={handleGitHubSignIn}>
            <Button
              type="submit"
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <SiGithub className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
            <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
              {"Already have an account? "}
              <Link
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                href="/login"
              >
                Sign in
              </Link>
              {" instead."}
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
