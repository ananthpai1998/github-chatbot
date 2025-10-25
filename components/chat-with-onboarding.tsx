"use client";

import { Chat } from "@/components/chat";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "@/components/visibility-selector";
import type { AppUsage } from "@/lib/usage";

type ChatWithOnboardingProps = {
  autoResume: boolean;
  id: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  initialLastContext?: AppUsage;
};

export function ChatWithOnboarding(props: ChatWithOnboardingProps) {
  return (
    <>
      <WelcomeModal />
      <Chat {...props} />
    </>
  );
}
