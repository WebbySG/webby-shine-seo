/**
 * Social Publishing — Provider abstraction for social media publishing.
 * Placeholder implementations ready for real API integration.
 */

export interface SocialPublishInput {
  content: string;
  platform: string;
  scheduledTime?: string; // ISO date
  mediaUrls?: string[];
}

export interface SocialPublishResult {
  externalPostId: string;
  publishedUrl: string;
  provider: string;
}

export interface SocialPublishProvider {
  name: string;
  platformId: string;
  publish(input: SocialPublishInput): Promise<SocialPublishResult>;
  isConfigured(): boolean;
}

// ====================================================================
// Base placeholder implementation
// ====================================================================
class PlaceholderPublisher implements SocialPublishProvider {
  name: string;
  platformId: string;

  constructor(platformId: string) {
    this.name = `placeholder-${platformId}`;
    this.platformId = platformId;
  }

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    console.log(`[${this.name}] Simulating publish: ${input.content.slice(0, 50)}...`);
    const postId = `placeholder-${Date.now()}`;
    return {
      externalPostId: postId,
      publishedUrl: `https://${this.platformId}.com/post/${postId}`,
      provider: this.name,
    };
  }

  isConfigured(): boolean {
    return false; // placeholder is never "real"
  }
}

// ====================================================================
// Platform-specific stubs (ready for real API keys)
// ====================================================================
export class FacebookPublisher extends PlaceholderPublisher {
  constructor() {
    super("facebook");
    // TODO: Use process.env.FACEBOOK_ACCESS_TOKEN for Graph API
  }
  isConfigured() { return !!process.env.FACEBOOK_ACCESS_TOKEN; }
}

export class InstagramPublisher extends PlaceholderPublisher {
  constructor() {
    super("instagram");
    // TODO: Use process.env.INSTAGRAM_ACCESS_TOKEN for Graph API
  }
  isConfigured() { return !!process.env.INSTAGRAM_ACCESS_TOKEN; }
}

export class LinkedinPublisher extends PlaceholderPublisher {
  constructor() {
    super("linkedin");
    // TODO: Use process.env.LINKEDIN_ACCESS_TOKEN
  }
  isConfigured() { return !!process.env.LINKEDIN_ACCESS_TOKEN; }
}

export class TiktokPublisher extends PlaceholderPublisher {
  constructor() {
    super("tiktok");
    // TODO: Use process.env.TIKTOK_ACCESS_TOKEN
  }
  isConfigured() { return !!process.env.TIKTOK_ACCESS_TOKEN; }
}

export class YoutubePublisher extends PlaceholderPublisher {
  constructor() {
    super("youtube");
    // TODO: Use process.env.YOUTUBE_API_KEY + OAuth
  }
  isConfigured() { return !!process.env.YOUTUBE_API_KEY; }
}

// ====================================================================
// Factory
// ====================================================================
const publishers: Record<string, () => SocialPublishProvider> = {
  facebook: () => new FacebookPublisher(),
  instagram: () => new InstagramPublisher(),
  linkedin: () => new LinkedinPublisher(),
  twitter: () => new PlaceholderPublisher("twitter"), // X API
  tiktok: () => new TiktokPublisher(),
  youtube: () => new YoutubePublisher(),
  youtube_shorts: () => new YoutubePublisher(),
};

export function createSocialPublisher(platform: string): SocialPublishProvider {
  const factory = publishers[platform];
  if (!factory) {
    return new PlaceholderPublisher(platform);
  }
  return factory();
}

export function getConfiguredPlatforms(): string[] {
  return Object.keys(publishers).filter((p) => {
    const pub = publishers[p]();
    return pub.isConfigured();
  });
}
