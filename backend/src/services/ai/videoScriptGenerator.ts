import { createAiProvider } from "./provider.js";

const SYSTEM_PROMPT = `You are a short-form video content expert. Generate engaging video scripts optimized for social media platforms. Return a JSON object with keys: video_script (full script text), scene_breakdown (array of {scene_number, duration, visual, voiceover}), caption_text. The script must have a hook in the first 3 seconds and a CTA at the end.`;

export interface VideoScriptInput {
  title: string;
  content: string;
  keyword: string;
  platform: string;
}

export interface SceneBreakdown {
  scene_number: number;
  duration: string;
  visual: string;
  voiceover: string;
}

export interface VideoScriptResult {
  video_script: string;
  scene_breakdown: SceneBreakdown[];
  caption_text: string;
}

export async function generateVideoScriptContent(input: VideoScriptInput): Promise<VideoScriptResult> {
  const provider = createAiProvider();

  if (provider.name === "template") {
    return generateTemplateVideoScript(input);
  }

  const maxDuration = input.platform === "tiktok" || input.platform === "instagram_reels" ? 60 : 90;

  const userPrompt = `Generate a short-form video script for ${input.platform} (max ${maxDuration} seconds):

**Title:** ${input.title}
**Keyword:** ${input.keyword}
**Content:** ${input.content.slice(0, 500)}

Requirements:
- Hook in first 3 seconds
- Keep concise and engaging
- End with strong CTA
- Include caption text with hashtags

Return JSON with: video_script, scene_breakdown (array with scene_number, duration, visual, voiceover), caption_text.`;

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
      if (parsed.video_script && parsed.scene_breakdown && parsed.caption_text) {
        return parsed as VideoScriptResult;
      }
    }
  } catch (err) {
    console.error(`AI video script generation failed (${provider.name}), falling back to template:`, err);
  }

  return generateTemplateVideoScript(input);
}

function generateTemplateVideoScript(input: VideoScriptInput): VideoScriptResult {
  const { title, content, keyword, platform } = input;
  const maxDuration = platform === "tiktok" || platform === "instagram_reels" ? 60 : 90;
  const cleanContent = content.replace(/[#*_`]/g, "").replace(/\n+/g, " ").trim();
  const snippet = cleanContent.slice(0, 200);

  const hooks = [
    `Stop scrolling! Here's what nobody tells you about ${keyword}.`,
    `Did you know this about ${keyword}? Most people don't.`,
    `${keyword} — here's the truth that experts won't share.`,
    `3 things about ${keyword} that will change everything.`,
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const body = `Here's what you need to know: ${snippet}`;
  const ctas = [
    "Follow for more tips like this! Link in bio.",
    "Save this for later and share with someone who needs it!",
    "Comment below if you want a deep dive on this topic!",
    "Follow us for more expert insights every week!",
  ];
  const cta = ctas[Math.floor(Math.random() * ctas.length)];
  const fullScript = `${hook}\n\n${body}\n\n${cta}`;
  const hashKeyword = keyword.replace(/\s+/g, "");

  return {
    video_script: fullScript,
    scene_breakdown: [
      { scene_number: 1, duration: "0-3s", visual: "Avatar appears with animated text overlay showing hook", voiceover: hook },
      { scene_number: 2, duration: `3-${Math.floor(maxDuration * 0.7)}s`, visual: "Avatar speaking with key points highlighted as text overlays", voiceover: body },
      { scene_number: 3, duration: `${Math.floor(maxDuration * 0.7)}-${maxDuration}s`, visual: "Avatar with CTA text and subscribe/follow animation", voiceover: cta },
    ],
    caption_text: `${title}\n\n${hook}\n\n#${hashKeyword} #seo #digitalmarketing #shorts`,
  };
}
