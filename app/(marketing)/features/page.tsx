"use client";

import { motion } from "framer-motion";
import { GithubIcon, CpuIcon, ArrowUpIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="py-24">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">
            Powerful Features for Modern Development
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to supercharge your GitHub workflow with AI
          </p>
        </motion.div>

        {/* Feature Sections */}
        <div className="space-y-32">
          {detailedFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`grid gap-12 md:grid-cols-2 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <div className="mb-4 rounded-full bg-primary/10 p-4 w-fit">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start">
                      <ArrowUpIcon className="h-5 w-5 text-primary mr-2 mt-0.5 rotate-45 flex-shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`rounded-lg border bg-muted/50 p-8 ${
                  index % 2 === 1 ? "md:order-1" : ""
                }`}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-24 w-24 text-primary/30" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to experience the future of development?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Start using DevMate today and transform how you work with GitHub
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
              <ArrowUpIcon className="ml-2 h-5 w-5 rotate-45" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

const detailedFeatures = [
  {
    title: "Natural Language Repository Chat",
    description:
      "Interact with your GitHub repositories using natural language. Ask questions, get insights, and understand complex codebases without searching through files.",
    icon: CpuIcon,
    points: [
      "Ask questions about any file, function, or code pattern",
      "Get instant explanations of complex code logic",
      "Search across multiple repositories simultaneously",
      "Context-aware responses based on your repository structure",
    ],
  },
  {
    title: "Intelligent Issue Management",
    description:
      "Create, update, and manage GitHub issues through conversation. Save time and reduce context switching with AI-powered issue handling.",
    icon: GithubIcon,
    points: [
      "Create detailed issues from simple descriptions",
      "Automatically assign labels and milestones",
      "Search and filter issues with natural language queries",
      "Get AI suggestions for issue resolution",
    ],
  },
  {
    title: "Advanced Code Analysis",
    description:
      "Leverage AI to understand code quality, find potential bugs, and get improvement suggestions across your entire codebase.",
    icon: CpuIcon,
    points: [
      "Identify code smells and anti-patterns",
      "Get refactoring suggestions with explanations",
      "Analyze dependencies and potential security issues",
      "Track code complexity and maintainability metrics",
    ],
  },
  {
    title: "Pull Request Intelligence",
    description:
      "Speed up code reviews with AI-powered pull request analysis and automated suggestions for improvements.",
    icon: GithubIcon,
    points: [
      "Get instant PR summaries and impact analysis",
      "Automated code review comments and suggestions",
      "Identify breaking changes and compatibility issues",
      "Generate comprehensive PR descriptions automatically",
    ],
  },
  {
    title: "Multi-Model AI Support",
    description:
      "Choose from the best AI models available. Use Anthropic Claude, Google Gemini, or OpenAI GPT with your own API keys for maximum flexibility.",
    icon: CpuIcon,
    points: [
      "Support for Claude 3.5 Sonnet, Gemini 2.0 Flash, and GPT-4",
      "Switch between models based on your needs",
      "Bring your own API keys - no markup pricing",
      "Transparent usage and cost tracking",
    ],
  },
  {
    title: "Security & Privacy First",
    description:
      "Your code and data privacy is our top priority. All processing happens in real-time with no persistent storage of your repository data.",
    icon: GithubIcon,
    points: [
      "End-to-end encryption for all communications",
      "No repository data stored on our servers",
      "GitHub token stored securely in your browser",
      "Open source and auditable codebase",
    ],
  },
];
