import { createAiProvider } from "./provider.js";

const SYSTEM_PROMPT = `You are an expert SEO content writer. Generate comprehensive, well-structured SEO articles in Markdown format. Follow the provided brief structure exactly. Write naturally and include the target keyword naturally throughout. Return ONLY the article content in Markdown.`;

export interface ArticleGenerationInput {
  keyword: string;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  faq: { question: string; answer: string }[];
  entities: string[];
  internalLinks: { from: string; to: string; anchor: string }[];
}

export async function generateArticleContent(input: ArticleGenerationInput): Promise<string> {
  const provider = createAiProvider();

  if (provider.name === "template") {
    return generateTemplateArticle(input);
  }

  const userPrompt = `Generate a comprehensive SEO article based on this brief:

**Target Keyword:** ${input.keyword}
**Title:** ${input.title}
**Meta Description:** ${input.metaDescription}

**Required Headings:**
${input.headings.map((h) => `${h.level}: ${h.text}`).join("\n")}

**FAQ Questions to Answer:**
${input.faq.map((f) => `Q: ${f.question}`).join("\n")}

**Target Entities:** ${input.entities.join(", ")}

**Internal Links to Include:**
${input.internalLinks.map((l) => `Link to ${l.to} with anchor text "${l.anchor}"`).join("\n")}

Write a complete article (1500-2500 words) following the heading structure. Include an engaging introduction, detailed sections, FAQ section, and conclusion. Use Markdown formatting.`;

  try {
    const result = await provider.complete({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (result.content && result.content.length > 200) {
      return result.content;
    }
  } catch (err) {
    console.error(`AI article generation failed (${provider.name}), falling back to template:`, err);
  }

  return generateTemplateArticle(input);
}

function generateTemplateArticle(input: ArticleGenerationInput): string {
  const year = new Date().getFullYear();
  const sections: string[] = [];

  sections.push(`# ${input.title}\n`);
  sections.push(
    `Looking for comprehensive information about **${input.keyword}**? You've come to the right place. ` +
    `In this ${year} guide, we cover everything you need to know — from the basics to expert tips ` +
    `that will help you make informed decisions.\n`
  );

  for (const heading of input.headings) {
    if (heading.level === "H1") continue;
    const prefix = heading.level === "H2" ? "##" : "###";
    sections.push(`${prefix} ${heading.text}\n`);
    sections.push(
      `When it comes to ${heading.text.toLowerCase()}, there are several important aspects to consider. ` +
      `This section covers the essential information you need to know about this topic as it relates to ${input.keyword}.\n`
    );
  }

  if (input.faq.length > 0) {
    sections.push(`## Frequently Asked Questions\n`);
    for (const item of input.faq) {
      sections.push(`### ${item.question}\n`);
      sections.push(`${item.answer}\n`);
    }
  }

  if (input.internalLinks.length > 0) {
    sections.push(`---\n`);
    sections.push(`*Internal linking notes:*\n`);
    for (const link of input.internalLinks) {
      sections.push(`- Link to [${link.anchor}](${link.to}) from relevant sections\n`);
    }
  }

  sections.push(`## Conclusion\n`);
  sections.push(
    `We hope this comprehensive guide to **${input.keyword}** has been helpful. ` +
    `Whether you're just starting your research or ready to take action, ` +
    `the information provided above should give you a solid foundation for making informed decisions.\n`
  );

  if (input.entities.length > 0) {
    sections.push(`\n<!-- Target entities: ${input.entities.join(", ")} -->`);
  }

  return sections.join("\n");
}
