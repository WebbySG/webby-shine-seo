/**
 * Subtitle Generator — Generates subtitle/caption data from scripts.
 */

export interface SubtitleSegment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface SubtitleResult {
  srt: string;
  segments: SubtitleSegment[];
}

export function generateSubtitles(
  sceneBreakdown: { scene_number: number; duration: string; voiceover: string }[]
): SubtitleResult {
  const segments: SubtitleSegment[] = [];
  let srt = "";

  for (let i = 0; i < sceneBreakdown.length; i++) {
    const scene = sceneBreakdown[i];
    const [startStr, endStr] = scene.duration.replace(/s/g, "").split("-");
    const start = parseInt(startStr) || 0;
    const end = parseInt(endStr) || start + 10;

    // Split voiceover into ~8-word chunks for subtitle segments
    const words = scene.voiceover.split(/\s+/);
    const chunkSize = 8;
    const chunks = [];
    for (let j = 0; j < words.length; j += chunkSize) {
      chunks.push(words.slice(j, j + chunkSize).join(" "));
    }

    const chunkDuration = (end - start) / chunks.length;

    for (let j = 0; j < chunks.length; j++) {
      const segStart = start + j * chunkDuration;
      const segEnd = segStart + chunkDuration;
      const segIndex = segments.length + 1;

      segments.push({ start: segStart, end: segEnd, text: chunks[j] });

      srt += `${segIndex}\n`;
      srt += `${formatSrtTime(segStart)} --> ${formatSrtTime(segEnd)}\n`;
      srt += `${chunks[j]}\n\n`;
    }
  }

  return { srt, segments };
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}
