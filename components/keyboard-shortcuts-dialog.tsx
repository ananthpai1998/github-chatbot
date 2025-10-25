"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KEYBOARD_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts dialog with Cmd+/ or Ctrl+/
      if ((event.metaKey || event.ctrlKey) && event.key === "?") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="rounded border bg-muted px-2 py-1 text-xs font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
          Press{" "}
          <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
            ⌘
          </kbd>{" "}
          <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
            ?
          </kbd>{" "}
          to toggle this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
