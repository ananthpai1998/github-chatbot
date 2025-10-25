"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "@/components/icons";

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            DevMate is free. You only pay for the AI API usage from your chosen
            provider.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border-2 border-primary bg-card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold">
              BYOK Model
            </div>

            <div className="text-center mb-8 mt-4">
              <h2 className="text-3xl font-bold mb-2">DevMate Platform</h2>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-6xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <p className="text-muted-foreground">
                Bring Your Own API Key - No Platform Fees
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {platformFeatures.map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-start"
                >
                  <ArrowUpIcon className="h-5 w-5 text-primary mr-3 mt-0.5 rotate-45 flex-shrink-0" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>

            <Link href="/register" className="block">
              <Button size="lg" className="w-full text-lg">
                Get Started Free
                <ArrowUpIcon className="ml-2 h-5 w-5 rotate-45" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* AI Provider Costs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            AI Provider Costs (You Pay Directly)
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {aiProviders.map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg border bg-card p-6"
              >
                <h3 className="font-bold text-xl mb-4">{provider.name}</h3>
                <div className="space-y-4">
                  {provider.models.map((model) => (
                    <div key={model.name} className="border-b pb-3 last:border-0">
                      <div className="font-semibold mb-1">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Input: {model.inputPrice}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Output: {model.outputPrice}
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-4 inline-block"
                >
                  Get API Key →
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-24 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Pricing Questions
          </h2>

          <div className="space-y-6">
            {pricingFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg border bg-card p-6"
              >
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const platformFeatures = [
  "Unlimited GitHub repository access",
  "All AI models supported (Claude, Gemini, GPT)",
  "Full issue management capabilities",
  "Advanced code analysis tools",
  "Pull request intelligence",
  "Secure local storage of credentials",
  "No data retention - complete privacy",
  "Regular feature updates",
  "Community support",
];

const aiProviders = [
  {
    name: "Anthropic Claude",
    link: "https://console.anthropic.com/",
    models: [
      {
        name: "Claude 3.5 Sonnet",
        inputPrice: "$3 / 1M tokens",
        outputPrice: "$15 / 1M tokens",
      },
      {
        name: "Claude 3.5 Haiku",
        inputPrice: "$0.80 / 1M tokens",
        outputPrice: "$4 / 1M tokens",
      },
    ],
  },
  {
    name: "Google Gemini",
    link: "https://ai.google.dev/",
    models: [
      {
        name: "Gemini 2.0 Flash",
        inputPrice: "$0.075 / 1M tokens",
        outputPrice: "$0.30 / 1M tokens",
      },
      {
        name: "Gemini 1.5 Pro",
        inputPrice: "$1.25 / 1M tokens",
        outputPrice: "$5 / 1M tokens",
      },
    ],
  },
  {
    name: "OpenAI",
    link: "https://platform.openai.com/",
    models: [
      {
        name: "GPT-4o",
        inputPrice: "$2.50 / 1M tokens",
        outputPrice: "$10 / 1M tokens",
      },
      {
        name: "GPT-4o Mini",
        inputPrice: "$0.15 / 1M tokens",
        outputPrice: "$0.60 / 1M tokens",
      },
    ],
  },
];

const pricingFaqs = [
  {
    question: "Why is DevMate free?",
    answer:
      "We believe in transparent pricing. By using a bring-your-own-key model, you pay AI providers directly at their cost, with no markup. This gives you full control over your spending and usage.",
  },
  {
    question: "How much will I actually spend?",
    answer:
      "It depends on your usage. Most users spend $5-20/month on AI API costs. You can monitor and control your spending through your AI provider's dashboard and set usage limits.",
  },
  {
    question: "Can I switch between AI providers?",
    answer:
      "Yes! You can add multiple API keys and switch between providers anytime. This gives you flexibility to choose the best model for each task.",
  },
  {
    question: "Are there any hidden fees?",
    answer:
      "No hidden fees whatsoever. DevMate is completely free to use. You only pay the AI providers directly for API usage at their standard rates.",
  },
];
