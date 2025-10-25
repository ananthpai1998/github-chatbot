"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type KeyboardShortcut = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaKeyMatch = shortcut.metaKey
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;

        const ctrlKeyMatch = shortcut.ctrlKey
          ? event.ctrlKey
          : !event.ctrlKey;

        const shiftKeyMatch = shortcut.shiftKey
          ? event.shiftKey
          : !event.shiftKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          metaKeyMatch &&
          ctrlKeyMatch &&
          shiftKeyMatch
        ) {
          event.preventDefault();
          shortcut.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts hook
export function useCommonShortcuts({
  onOpenModelSelector,
  onOpenSettings,
}: {
  onOpenModelSelector?: () => void;
  onOpenSettings?: () => void;
}) {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      metaKey: true,
      action: () => {
        if (onOpenModelSelector) {
          onOpenModelSelector();
        }
      },
      description: "Open model selector",
    },
    {
      key: ",",
      metaKey: true,
      action: () => {
        if (onOpenSettings) {
          onOpenSettings();
        } else {
          router.push("/settings");
        }
      },
      description: "Open settings",
    },
    {
      key: "n",
      metaKey: true,
      action: () => {
        router.push("/chat");
      },
      description: "New chat",
    },
    {
      key: "/",
      metaKey: true,
      action: () => {
        // Focus the chat input
        const input = document.querySelector(
          'textarea[placeholder*="Send a message"]'
        ) as HTMLTextAreaElement;
        if (input) {
          input.focus();
        }
      },
      description: "Focus chat input",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Keyboard shortcuts help dialog data
export const KEYBOARD_SHORTCUTS = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open model selector" },
      { keys: ["⌘", ","], description: "Open settings" },
      { keys: ["⌘", "N"], description: "New chat" },
      { keys: ["⌘", "/"], description: "Focus chat input" },
    ],
  },
  {
    category: "General",
    shortcuts: [
      { keys: ["Esc"], description: "Close dialog/modal" },
      { keys: ["⌘", "Enter"], description: "Send message" },
    ],
  },
];
