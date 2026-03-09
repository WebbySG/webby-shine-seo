/**
 * Image Generation Provider Abstraction.
 * Supports OpenAI-compatible image generation APIs.
 * Swap providers by changing IMAGE_PROVIDER env var.
 */

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  thumbnailUrl?: string;
  provider: string;
  metadata: Record<string, any>;
}

export interface ImageProvider {
  name: string;
  generate(req: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

// ---------- OpenAI-compatible provider ----------
class OpenAIImageProvider implements ImageProvider {
  name = "openai";

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_IMAGE_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey) {
      console.warn("[ImageProvider] No OPENAI_API_KEY configured, using placeholder");
      return this.placeholder(req);
    }

    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
          prompt: req.prompt,
          n: 1,
          size: `${req.width || 1024}x${req.height || 1024}`,
          quality: "standard",
          response_format: "url",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[ImageProvider] OpenAI error:", err);
        return this.placeholder(req);
      }

      const data = await res.json();
      const imageUrl = data.data?.[0]?.url || "";
      return { imageUrl, provider: "openai", metadata: { model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3", revised_prompt: data.data?.[0]?.revised_prompt } };
    } catch (err: any) {
      console.error("[ImageProvider] OpenAI request failed:", err.message);
      return this.placeholder(req);
    }
  }

  private placeholder(req: ImageGenerationRequest): ImageGenerationResult {
    return {
      imageUrl: `https://placehold.co/${req.width || 1024}x${req.height || 1024}/1a1a2e/e0e0e0?text=AI+Generated`,
      provider: "placeholder",
      metadata: { prompt: req.prompt },
    };
  }
}

// ---------- Placeholder provider ----------
class PlaceholderImageProvider implements ImageProvider {
  name = "placeholder";

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return {
      imageUrl: `https://placehold.co/${req.width || 1024}x${req.height || 1024}/1a1a2e/e0e0e0?text=AI+Image`,
      provider: "placeholder",
      metadata: { prompt: req.prompt },
    };
  }
}

// ---------- Factory ----------
export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER || "openai";
  switch (provider) {
    case "openai": return new OpenAIImageProvider();
    default: return new PlaceholderImageProvider();
  }
}
