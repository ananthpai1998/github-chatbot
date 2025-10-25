"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CpuIcon, GithubIcon } from "@/components/icons";

export function MissingAPIKeyBanner({ provider }: { provider: "anthropic" | "google" | "openai" }) {
  const providerNames = {
    anthropic: "Anthropic Claude",
    google: "Google Gemini",
    openai: "OpenAI GPT",
  };

  const providerLinks = {
    anthropic: "https://console.anthropic.com/",
    google: "https://aistudio.google.com/app/apikey",
    openai: "https://platform.openai.com/api-keys",
  };

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
          <CpuIcon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            {providerNames[provider]} API Key Required
          </h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            The selected model requires a {providerNames[provider]} API key.
            Please add your API key in settings or switch to a different model.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="bg-background">
                Add API Key
              </Button>
            </Link>
            <a href={providerLinks[provider]} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                Get API Key
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoAPIKeyBanner() {
  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
          <CpuIcon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            No AI Provider Configured
          </h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            You need to add an API key for at least one AI provider (Claude,
            Gemini, or GPT) to start chatting.
          </p>
          <Link href="/settings" className="mt-3 inline-block">
            <Button variant="outline" size="sm" className="bg-background">
              Add API Key
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NoGitHubTokenBanner({ dismissible = false }: { dismissible?: boolean }) {
  return (
    <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-500/20 p-2 text-blue-600 dark:text-blue-400">
          <GithubIcon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            GitHub Not Connected
          </h3>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            Connect your GitHub account to unlock repository chat, issue
            management, and code analysis features.
          </p>
          <Link href="/settings" className="mt-3 inline-block">
            <Button variant="outline" size="sm" className="bg-background">
              Connect GitHub
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <GithubIcon size={48} className="text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Welcome to DevMate</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        Your AI-powered GitHub assistant. Ask me anything about your
        repositories, create issues, analyze code, or get help with development
        tasks.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestedPrompts.map((prompt, index) => (
          <button
            key={index}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
          >
            <div className="mb-2 text-sm font-semibold">{prompt.title}</div>
            <div className="text-xs text-muted-foreground">
              {prompt.example}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const suggestedPrompts = [
  {
    title: "Repository Analysis",
    example: "Analyze the structure of my repository",
  },
  {
    title: "Issue Management",
    example: "Create an issue for the bug I found",
  },
  {
    title: "Code Review",
    example: "Review the latest pull request",
  },
  {
    title: "Code Search",
    example: "Find all API endpoints in the codebase",
  },
  {
    title: "Documentation",
    example: "Explain how the authentication works",
  },
  {
    title: "Best Practices",
    example: "Suggest improvements for my code",
  },
];

export function LoadingState({ message = "Thinking..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function ToolExecutionIndicator({ toolName }: { toolName: string }) {
  const friendlyNames: Record<string, string> = {
    get_weather: "Getting weather",
    createDocument: "Creating document",
    updateDocument: "Updating document",
    requestSuggestions: "Generating suggestions",
    // GitHub tools
    get_repository: "Fetching repository",
    list_repositories: "Listing repositories",
    create_issue: "Creating issue",
    get_issue: "Fetching issue",
    search_code: "Searching code",
    get_file_contents: "Reading file",
    create_pull_request: "Creating pull request",
  };

  const displayName = friendlyNames[toolName] || `Running ${toolName}`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs">
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      <span className="text-muted-foreground">{displayName}</span>
    </div>
  );
}
