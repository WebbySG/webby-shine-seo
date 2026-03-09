/**
 * Video Renderer — Provider abstraction for avatar video rendering.
 * Initial implementation is a placeholder that simulates render jobs.
 * Replace with real providers (Synthesia, HeyGen, D-ID) when ready.
 */

export interface RenderInput {
  videoScript: string;
  sceneBreakdown: { scene_number: number; duration: string; visual: string; voiceover: string }[];
  avatarType: string;
  voiceType: string;
  platform: string;
  captionText: string;
}

export interface RenderResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  provider: string;
}

export interface VideoRenderProvider {
  name: string;
  render(input: RenderInput): Promise<RenderResult>;
  getStatus(externalId: string): Promise<{ status: string; progress: number; videoUrl?: string }>;
}

// ====================================================================
// Placeholder provider — simulates rendering for development
// ====================================================================
export class PlaceholderVideoRenderer implements VideoRenderProvider {
  name = "placeholder";

  async render(input: RenderInput): Promise<RenderResult> {
    // Simulate processing delay
    console.log(`[PlaceholderVideoRenderer] Simulating render for ${input.platform} (${input.avatarType}/${input.voiceType})`);
    return {
      videoUrl: `https://placeholder.video/render/${Date.now()}.mp4`,
      thumbnailUrl: `https://placeholder.video/thumb/${Date.now()}.jpg`,
      duration: input.platform === "tiktok" || input.platform === "instagram_reels" ? 60 : 90,
      provider: this.name,
    };
  }

  async getStatus(_externalId: string) {
    return { status: "completed", progress: 100 };
  }
}

// ====================================================================
// Synthesia-ready stub
// ====================================================================
export class SynthesiaRenderer implements VideoRenderProvider {
  name = "synthesia";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SYNTHESIA_API_KEY || "";
  }

  async render(_input: RenderInput): Promise<RenderResult> {
    if (!this.apiKey) throw new Error("SYNTHESIA_API_KEY not configured");
    // TODO: Implement Synthesia API integration
    throw new Error("Synthesia integration not yet implemented");
  }

  async getStatus(_externalId: string) {
    throw new Error("Synthesia integration not yet implemented");
  }
}

// ====================================================================
// Factory
// ====================================================================
export function createVideoRenderer(): VideoRenderProvider {
  const provider = (process.env.VIDEO_RENDER_PROVIDER || "placeholder").toLowerCase();

  if (provider === "synthesia" && process.env.SYNTHESIA_API_KEY) {
    return new SynthesiaRenderer();
  }

  return new PlaceholderVideoRenderer();
}
