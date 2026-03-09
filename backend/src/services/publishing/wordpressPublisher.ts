/**
 * WordPress Publisher — Handles WordPress REST API publishing.
 * Extracted from articles route for reuse in async job worker.
 */

export interface WordPressPublishInput {
  title: string;
  content: string; // HTML
  slug: string;
  metaDescription: string;
  scheduleDate?: string; // ISO date
}

export interface WordPressPublishResult {
  postId: string;
  url: string;
  status: string;
}

export interface WordPressConnection {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export async function publishToWordPress(
  connection: WordPressConnection,
  input: WordPressPublishInput
): Promise<WordPressPublishResult> {
  const wpUrl = `${connection.siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`;

  const postData: any = {
    title: input.title,
    content: input.content,
    slug: input.slug.replace(/^\//, ""),
    status: input.scheduleDate ? "future" : "publish",
    excerpt: input.metaDescription,
  };

  if (input.scheduleDate) {
    postData.date = input.scheduleDate;
  }

  const response = await fetch(wpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${connection.username}:${connection.applicationPassword}`).toString("base64")}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress publish failed (${response.status}): ${errorText}`);
  }

  const wpPost = await response.json();
  return {
    postId: String(wpPost.id),
    url: wpPost.link,
    status: wpPost.status,
  };
}

/** Basic markdown to HTML converter */
export function markdownToHtml(markdown: string): string {
  let html = markdown;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^---$/gm, "<hr>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

  const lines = html.split("\n");
  const wrappedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return line;
    if (trimmed.startsWith("<!--")) return line;
    return `<p>${trimmed}</p>`;
  });

  return wrappedLines.filter(Boolean).join("\n");
}
