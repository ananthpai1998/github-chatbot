"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  GithubIcon,
  CpuIcon,
} from "@/components/icons";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* Hero Section with Parallax */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background"
        />

        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="rounded-full bg-primary/10 p-4"
            >
              <GithubIcon className="h-16 w-16 text-primary" />
            </motion.div>

            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Your AI-Powered{" "}
                <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  GitHub Assistant
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl">
                Chat with your repositories, manage issues, analyze code, and
                boost your development workflow with intelligent AI assistance.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                  <ArrowUpIcon className="ml-2 h-5 w-5 rotate-45" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span>No credit card required</span>
              <span>•</span>
              <span>Free tier available</span>
            </motion.div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
          >
            <ChevronDownIcon size={32} />
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
              Everything you need to supercharge development
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to make working with GitHub easier and
              more productive
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-12 text-center overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
            />

            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Ready to transform your workflow?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of developers using DevMate to streamline their
                GitHub workflow
              </p>
              <Link href="/register">
                <Button size="lg" className="text-lg px-8">
                  Start Free Today
                  <ArrowUpIcon className="ml-2 h-5 w-5 rotate-45" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "Intelligent Chat",
    description:
      "Chat naturally with your repositories. Ask questions about code, get explanations, and understand complex codebases instantly.",
    icon: CpuIcon,
  },
  {
    title: "Issue Management",
    description:
      "Create, update, and manage GitHub issues through natural conversation. No more clicking through multiple screens.",
    icon: GithubIcon,
  },
  {
    title: "Code Analysis",
    description:
      "Get instant insights about your code. Find bugs, suggest improvements, and understand dependencies.",
    icon: CpuIcon,
  },
  {
    title: "Pull Request Assistant",
    description:
      "Review pull requests faster with AI-powered summaries and suggestions for improvements.",
    icon: GithubIcon,
  },
  {
    title: "Multi-Provider Support",
    description:
      "Use your favorite AI models: Anthropic Claude, Google Gemini, or OpenAI GPT. Bring your own API keys.",
    icon: CpuIcon,
  },
  {
    title: "Secure & Private",
    description:
      "Your code stays private. We never store your repository data. All processing happens in real-time.",
    icon: GithubIcon,
  },
];
