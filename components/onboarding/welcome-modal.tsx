"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpIcon, CpuIcon, GithubIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

    if (!hasSeenOnboarding) {
      // Small delay before showing modal
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    router.push("/settings");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Welcome to DevMate! 👋
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your AI-powered GitHub assistant is ready. Let's get you set up
                  in just a few steps.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <CpuIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Add Your AI API Key</h3>
                      <p className="text-sm text-muted-foreground">
                        DevMate works with Anthropic Claude, Google Gemini, or
                        OpenAI GPT. You'll need an API key from at least one
                        provider.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <GithubIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        Connect GitHub (Optional)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add a GitHub Personal Access Token to unlock repository
                        chat, issue management, and code analysis features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button onClick={() => setStep(1)}>
                  Next
                  <ArrowUpIcon className="ml-2 h-4 w-4 rotate-45" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Choose Your AI Provider
                </DialogTitle>
                <DialogDescription className="text-base">
                  DevMate uses a bring-your-own-key (BYOK) model. You pay AI
                  providers directly at their cost, with no markup.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.name}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{provider.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {provider.price}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {provider.description}
                    </p>
                    <a
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Get API Key →
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next
                  <ArrowUpIcon className="ml-2 h-4 w-4 rotate-45" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Ready to Configure!
                </DialogTitle>
                <DialogDescription className="text-base">
                  Let's add your API keys and get you started with DevMate.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <div className="rounded-lg border p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                  <h3 className="font-semibold text-lg mb-4">What's Next?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <ArrowUpIcon className="h-5 w-5 text-primary mr-2 mt-0.5 rotate-45 flex-shrink-0" />
                      <span className="text-sm">
                        Add your AI provider API key in Settings
                      </span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUpIcon className="h-5 w-5 text-primary mr-2 mt-0.5 rotate-45 flex-shrink-0" />
                      <span className="text-sm">
                        Optionally add GitHub token for repository features
                      </span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUpIcon className="h-5 w-5 text-primary mr-2 mt-0.5 rotate-45 flex-shrink-0" />
                      <span className="text-sm">
                        Start chatting with AI or your repositories!
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleComplete}>
                  Go to Settings
                  <ArrowUpIcon className="ml-2 h-4 w-4 rotate-45" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-8 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const providers = [
  {
    name: "Anthropic Claude",
    price: "From $0.80/1M tokens",
    description: "Most capable for code analysis and complex reasoning",
    link: "https://console.anthropic.com/",
  },
  {
    name: "Google Gemini",
    price: "From $0.075/1M tokens",
    description: "Best value - excellent performance at low cost",
    link: "https://ai.google.dev/",
  },
  {
    name: "OpenAI GPT",
    price: "From $0.15/1M tokens",
    description: "Popular choice with strong general capabilities",
    link: "https://platform.openai.com/",
  },
];
