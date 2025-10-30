import { tool } from "ai";
import { z } from "zod";

/**
 * Create image generation tool for OpenAI DALL-E 3
 * This tool allows models to generate images from text descriptions
 */
export const createImageGenerationTool = (apiKey: string) => {
  return tool({
    description:
      "Generate images from detailed text descriptions using DALL-E 3. Returns a URL to the generated image.",
    inputSchema: z.object({
      prompt: z
        .string()
        .describe(
          "Detailed description of the image to generate. Be specific about style, composition, colors, mood, and subject matter."
        ),
      size: z
        .enum(["1024x1024", "1024x1792", "1792x1024"])
        .optional()
        .default("1024x1024")
        .describe("Image dimensions - square, portrait, or landscape"),
      quality: z
        .enum(["standard", "hd"])
        .optional()
        .default("standard")
        .describe("Image quality - standard or HD (higher cost)"),
    }),
    execute: async ({ prompt, size, quality }) => {
      try {
        console.log("[Image Generation] Generating image:", {
          prompt: prompt.substring(0, 100),
          size,
          quality,
        });

        // Make direct API call to OpenAI
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            size,
            quality,
            n: 1,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Image generation failed");
        }

        const data = await response.json();
        const imageUrl = data.data[0].url;
        const revisedPrompt = data.data[0].revised_prompt;

        console.log("[Image Generation] ✓ Image generated successfully");

        return `Image generated successfully!\n\nImage URL: ${imageUrl}\n\nRevised prompt: "${revisedPrompt}"`;
      } catch (error: any) {
        console.error("[Image Generation] ✗ Failed:", error.message);
        return `Failed to generate image: ${error.message}`;
      }
    },
  });
};
