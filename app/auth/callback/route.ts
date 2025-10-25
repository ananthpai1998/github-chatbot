import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // GitHub OAuth successful - token is available in session
      // User can optionally save it to localStorage on client-side

      // Check if this is first-time onboarding
      const { data: { user } } = await supabase.auth.getUser();

      // Redirect to chat page after successful authentication
      return NextResponse.redirect(`${origin}/chat`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login`);
}
