/**
 * TTS Provider — Text-to-speech abstraction.
 * Placeholder for now. Ready for ElevenLabs, Google TTS, Azure TTS integration.
 */

export interface TtsInput {
  text: string;
  voiceType: string; // friendly, authoritative, energetic, calm
  language?: string;
}

export interface TtsResult {
  audioUrl: string;
  duration: number;
  provider: string;
}

export interface TtsProvider {
  name: string;
  synthesize(input: TtsInput): Promise<TtsResult>;
}

export class PlaceholderTtsProvider implements TtsProvider {
  name = "placeholder";

  async synthesize(input: TtsInput): Promise<TtsResult> {
    console.log(`[PlaceholderTTS] Simulating TTS for voice=${input.voiceType}, length=${input.text.length} chars`);
    const wordsPerSecond = 2.5;
    const words = input.text.split(/\s+/).length;
    return {
      audioUrl: `https://placeholder.audio/tts/${Date.now()}.mp3`,
      duration: Math.ceil(words / wordsPerSecond),
      provider: this.name,
    };
  }
}

export function createTtsProvider(): TtsProvider {
  const provider = (process.env.TTS_PROVIDER || "placeholder").toLowerCase();

  // Ready for: elevenlabs, google, azure
  if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    // TODO: Implement ElevenLabs TTS
    console.log("ElevenLabs TTS not yet implemented, using placeholder");
  }

  return new PlaceholderTtsProvider();
}
