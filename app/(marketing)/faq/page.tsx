"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  return (
    <div className="py-24">
      <div className="container px-4 md:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about DevMate
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center p-8 rounded-lg border bg-muted/50"
        >
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            We're here to help! Reach out to our support team.
          </p>
          <a
            href="mailto:support@devmate.ai"
            className="text-primary hover:underline"
          >
            support@devmate.ai
          </a>
        </motion.div>
      </div>
    </div>
  );
}

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="rounded-lg border bg-card"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
        <div
          className={cn(
            "text-muted-foreground transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        >
          <ChevronDownIcon />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
      </motion.div>
    </motion.div>
  );
}

const faqs = [
  {
    question: "What is DevMate?",
    answer:
      "DevMate is an AI-powered assistant that helps you work with GitHub more efficiently. You can chat with your repositories, manage issues, analyze code, and perform various GitHub operations through natural conversation.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is easy! Sign up for a free account, add your AI provider API key (Anthropic, Google, or OpenAI), and optionally connect your GitHub account with a Personal Access Token. Once set up, you can start chatting with your repositories immediately.",
  },
  {
    question: "Do I need to provide my own API keys?",
    answer:
      "Yes, DevMate uses a bring-your-own-key (BYOK) model. You'll need an API key from at least one AI provider (Anthropic Claude, Google Gemini, or OpenAI GPT). This ensures you have full control over your usage and costs, with no markup from us.",
  },
  {
    question: "Is my code and data secure?",
    answer:
      "Absolutely. We take security seriously. Your GitHub token is stored securely in your browser using local storage. We never store your repository data on our servers - all processing happens in real-time. Your code and conversations are only sent to the AI provider you choose, and we don't persist any of it.",
  },
  {
    question: "What AI models are supported?",
    answer:
      "DevMate supports multiple AI models including Anthropic's Claude 3.5 Sonnet and Haiku, Google's Gemini 2.0 Flash, and OpenAI's GPT-4o and GPT-4o Mini. You can switch between models based on your needs and preferences.",
  },
  {
    question: "Can I use DevMate without a GitHub token?",
    answer:
      "Yes! You can use DevMate for general AI chat without connecting GitHub. However, to access GitHub-specific features like repository chat, issue management, and code analysis, you'll need to provide a GitHub Personal Access Token.",
  },
  {
    question: "How much does it cost?",
    answer:
      "DevMate itself is free to use. You only pay for the AI API usage from your chosen provider (Anthropic, Google, or OpenAI) based on their pricing. There are no hidden fees or markups - you pay exactly what the AI provider charges.",
  },
  {
    question: "What permissions does the GitHub token need?",
    answer:
      "The GitHub Personal Access Token needs 'repo' scope to read repository data, and optionally 'issues' scope if you want to create or modify issues. We recommend creating a token with only the permissions you need.",
  },
  {
    question: "Can I use DevMate with private repositories?",
    answer:
      "Yes! If your GitHub token has access to private repositories, DevMate can work with them just like public repositories. All data remains secure and is never stored on our servers.",
  },
  {
    question: "Is there a usage limit?",
    answer:
      "There are no limits imposed by DevMate itself. Your usage is only limited by your AI provider's API limits and your own API key quotas. We recommend monitoring your usage through your AI provider's dashboard.",
  },
  {
    question: "Can I use multiple AI providers?",
    answer:
      "Yes! You can add API keys for multiple providers and switch between them. This gives you flexibility to use different models for different tasks or as a fallback option.",
  },
  {
    question: "Is DevMate open source?",
    answer:
      "Yes, DevMate is built on open source technologies and the codebase is available for review. We believe in transparency and welcome community contributions.",
  },
];
