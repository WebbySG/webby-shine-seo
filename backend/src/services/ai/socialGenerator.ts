import { createAiProvider } from "./provider.js";

const SYSTEM_PROMPT = `You are a social media marketing expert. Generate platform-optimized social media posts from article content. Return a JSON object with keys: facebook, instagram, linkedin, twitter, tiktok. Each value is the post text optimized for that platform. Include relevant hashtags and emojis.`;

export interface SocialGenerationInput {
  title: string;
  content: string;
  keyword: string;
  metaDescription: string;
}

export interface SocialPostsResult {
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  tiktok: string;
}

export async function generateSocialContent(input: SocialGenerationInput): Promise<SocialPostsResult> {
  const provider = createAiProvider();

  if (provider.name === "template") {
    return generateTemplateSocial(input);
  }

  const userPrompt = `Generate social media posts for all platforms from this article:

**Title:** ${input.title}
**Keyword:** ${input.keyword}
**Summary:** ${input.metaDescription}
**Content excerpt:** ${input.content.slice(0, 500)}

Return JSON with keys: facebook, instagram, linkedin, twitter, tiktok. Each post should be optimized for that platform's style, character limits, and audience expectations.`;

  try {
    const result = await provider.complete({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens: 2048,
      jsonMode: true,
    });

    if (result.content) {
      const parsed = JSON.parse(result.content);
      if (parsed.facebook && parsed.instagram && parsed.linkedin && parsed.twitter && parsed.tiktok) {
        return parsed as SocialPostsResult;
      }
    }
  } catch (err) {
    console.error(`AI social generation failed (${provider.name}), falling back to template:`, err);
  }

  return generateTemplateSocial(input);
}

function generateTemplateSocial(input: SocialGenerationInput): SocialPostsResult {
  const { title, keyword, metaDescription, content } = input;
  const year = new Date().getFullYear();
  const lines = content.split("\n").filter((l: string) => {
    const t = l.trim();
    return t && !t.startsWith("#") && !t.startsWith("--") && !t.startsWith("*Internal") && !t.startsWith("<!--");
  });
  const snippet = lines[0]?.replace(/\*\*/g, "").trim() || metaDescription;
  const hashKeyword = keyword.replace(/\s+/g, "");

  return {
    facebook: `📌 ${title}\n\n${snippet}\n\n👉 Read the full guide on our website.\n\n#${hashKeyword} #${keyword.split(" ")[0]} #SEO`,
    instagram: `✨ ${title}\n\n${metaDescription}\n\nSave this post for later! 🔖\n\n.\n.\n.\n#${hashKeyword} #${keyword.split(" ")[0]} #digitalmarketing #seo #contentmarketing #${year}`,
    linkedin: `I just published a comprehensive guide on ${keyword}.\n\n${snippet}\n\nKey takeaways:\n✅ Expert insights and actionable tips\n✅ Updated for ${year}\n✅ Practical strategies you can implement today\n\nRead the full article — link in the comments.\n\n#${hashKeyword} #SEO #ContentMarketing`,
    twitter: `🧵 New guide: ${title}\n\n${metaDescription.slice(0, 180)}\n\nFull article 👇\n\n#${hashKeyword} #SEO`,
    tiktok: `${title} — everything you need to know in 60 seconds ⚡ #${hashKeyword} #seo #learnontiktok #${keyword.split(" ")[0]}`,
  };
}
