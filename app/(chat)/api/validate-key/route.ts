import { createClient } from "@/lib/supabase/server";
import { ChatSDKError } from "@/lib/errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return new ChatSDKError(
        "bad_request:api",
        "Provider and API key are required"
      ).toResponse();
    }

    // For now, just validate the API key format
    // Real validation would require making an API call which costs money
    let isValid = false;
    let errorMessage = "";

    try {
      switch (provider) {
        case "anthropic":
          // Anthropic keys start with "sk-ant-"
          isValid = apiKey.startsWith("sk-ant-");
          if (!isValid) {
            errorMessage = "Anthropic API keys should start with 'sk-ant-'";
          }
          break;

        case "google":
          // Google AI keys typically start with "AIza"
          isValid = apiKey.startsWith("AIza") || apiKey.length > 30;
          if (!isValid) {
            errorMessage = "Google API keys typically start with 'AIza'";
          }
          break;

        case "openai":
          // OpenAI keys start with "sk-proj-" or "sk-"
          isValid = apiKey.startsWith("sk-");
          if (!isValid) {
            errorMessage = "OpenAI API keys should start with 'sk-'";
          }
          break;

        default:
          return new ChatSDKError(
            "bad_request:api",
            "Invalid provider"
          ).toResponse();
      }
    } catch (error: any) {
      isValid = false;
      errorMessage = error.message || "Invalid API key format";
    }

    return Response.json({ isValid, errorMessage }, { status: 200 });
  } catch (error) {
    return new ChatSDKError("bad_request:api").toResponse();
  }
}
