/**
 * AI Provider Abstraction Layer
 * Provides a unified interface for AI text generation with swappable providers.
 */

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiProvider {
  name: string;
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
}

// ====================================================================
// OpenAI-compatible provider
// ====================================================================
export class OpenAiProvider implements AiProvider {
  name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || "";
    this.model = config?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const body: any = {
      model: this.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };
    if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model,
      usage: data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : undefined,
    };
  }
}

// ====================================================================
// Gemini-compatible provider
// ====================================================================
export class GeminiProvider implements AiProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(config?: { apiKey?: string; model?: string }) {
    this.apiKey = config?.apiKey || process.env.GEMINI_API_KEY || "";
    this.model = config?.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMsgs = options.messages.filter((m) => m.role !== "system");

    const contents = userMsgs.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    if (options.jsonMode) {
      body.generationConfig.responseMimeType = "application/json";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      content,
      model: this.model,
      usage: data.usageMetadata
        ? { promptTokens: data.usageMetadata.promptTokenCount, completionTokens: data.usageMetadata.candidatesTokenCount }
        : undefined,
    };
  }
}

// ====================================================================
// Template fallback provider (no API key needed)
// ====================================================================
export class TemplateFallbackProvider implements AiProvider {
  name = "template";
  async complete(_options: AiCompletionOptions): Promise<AiCompletionResult> {
    // Returns empty — callers use their own template logic as fallback
    return { content: "", model: "template-fallback" };
  }
}

// ====================================================================
// Factory
// ====================================================================
export function createAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "template").toLowerCase();

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAiProvider();
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }

  console.log("ℹ️  No AI provider configured — using template fallback");
  return new TemplateFallbackProvider();
}
