/**
 * Prompt Builder — generates image prompts from content sources.
 */
import pool from "../../db.js";

interface BrandContext {
  brandName?: string;
  primaryColor?: string;
  tone?: string;
  imageStyleNotes?: string;
}

async function getBrandContext(clientId: string): Promise<BrandContext> {
  const { rows } = await pool.query(
    `SELECT brand_name, primary_color, tone, image_style_notes FROM brand_profiles WHERE client_id = $1`,
    [clientId]
  );
  return rows[0] || {};
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  clean_modern: "clean, modern, minimalist design with professional lighting and subtle gradients",
  business_professional: "corporate professional style, polished, trustworthy, with clean typography space",
  local_service: "warm, approachable local business style, community-focused, friendly and inviting",
  bold_promo: "bold, eye-catching promotional design with strong contrast and dynamic composition",
  minimal_editorial: "editorial minimalist style, elegant negative space, sophisticated and refined",
  social_carousel: "vibrant social media carousel style, engaging, colorful with clear visual hierarchy",
  video_thumbnail: "dynamic video thumbnail with bold text overlay area, high contrast, attention-grabbing",
};

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "4:5": { width: 1024, height: 1280 },
};

export function getDimensions(aspectRatio: string) {
  return ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS["16:9"];
}

export async function buildPrompt(params: {
  clientId: string;
  sourceType: string;
  assetType: string;
  platform?: string;
  stylePreset: string;
  title: string;
  content: string;
}): Promise<string> {
  const brand = await getBrandContext(params.clientId);
  const styleDesc = STYLE_DESCRIPTIONS[params.stylePreset] || STYLE_DESCRIPTIONS.clean_modern;

  const parts: string[] = [];

  // Base style
  parts.push(`Create a ${styleDesc} image.`);

  // Content context
  const topic = params.title || params.content.substring(0, 100);
  switch (params.assetType) {
    case "featured_image":
      parts.push(`This is a blog featured image about: "${topic}". Show the concept visually without text.`);
      break;
    case "social_image":
      parts.push(`This is a social media visual for ${params.platform || "general"} about: "${topic}". Make it scroll-stopping and engaging.`);
      break;
    case "gbp_image":
      parts.push(`This is a Google Business Profile promotional image about: "${topic}". Focus on local service, trustworthiness.`);
      break;
    case "video_thumbnail":
      parts.push(`This is a video thumbnail about: "${topic}". Leave space for text overlay. High contrast and dynamic.`);
      break;
    case "infographic":
      parts.push(`This is an infographic layout about: "${topic}". Include visual data sections and clean hierarchy.`);
      break;
    case "carousel_image":
      parts.push(`This is a carousel slide about: "${topic}". Consistent style, clear visual with minimal text area.`);
      break;
  }

  // Brand context
  if (brand.brandName) parts.push(`Brand: ${brand.brandName}.`);
  if (brand.primaryColor) parts.push(`Use ${brand.primaryColor} as accent color.`);
  if (brand.tone) parts.push(`Tone: ${brand.tone}.`);
  if (brand.imageStyleNotes) parts.push(brand.imageStyleNotes);

  // Safety
  parts.push("Professional, business-safe, no text in image unless specifically requested.");

  return parts.join(" ");
}
