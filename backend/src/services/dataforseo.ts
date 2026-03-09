import dotenv from "dotenv";
dotenv.config();

interface SerpResult {
  keyword: string;
  items: Array<{
    rank_group: number;
    rank_absolute: number;
    domain: string;
    url: string;
    title: string;
  }>;
}

interface RankingResult {
  keyword_id: string;
  keyword: string;
  domain: string;
  position: number | null;
  ranking_url: string | null;
}

const DATAFORSEO_API = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DataForSEO credentials not configured");
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

export async function fetchSerpResults(
  keywords: Array<{ id: string; keyword: string }>,
  location: string = "Singapore",
  language: string = "en",
  depth: number = 10
): Promise<Map<string, SerpResult>> {
  const results = new Map<string, SerpResult>();

  // DataForSEO allows batching up to 100 tasks per request
  const tasks = keywords.map((kw) => ({
    keyword: kw.keyword,
    location_name: location,
    language_code: language,
    depth,
    tag: kw.id, // Use keyword ID as tag for mapping
  }));

  try {
    const response = await fetch(`${DATAFORSEO_API}/serp/google/organic/live/advanced`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tasks),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DataForSEO API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${data.status_message}`);
    }

    // Process each task result
    for (const task of data.tasks || []) {
      if (task.status_code !== 20000) {
        console.warn(`Task failed for keyword: ${task.data?.keyword}`, task.status_message);
        continue;
      }

      const keywordId = task.data?.tag;
      const keyword = task.data?.keyword;
      const items = task.result?.[0]?.items || [];

      // Extract organic results
      const organicItems = items
        .filter((item: any) => item.type === "organic")
        .map((item: any) => ({
          rank_group: item.rank_group,
          rank_absolute: item.rank_absolute,
          domain: item.domain,
          url: item.url,
          title: item.title,
        }));

      results.set(keywordId, {
        keyword,
        items: organicItems,
      });
    }
  } catch (error) {
    console.error("DataForSEO fetch error:", error);
    throw error;
  }

  return results;
}

export function findDomainPosition(
  serpResult: SerpResult,
  domain: string
): { position: number; url: string } | null {
  // Normalize domain for matching (remove www. prefix)
  const normalizedDomain = domain.replace(/^www\./, "").toLowerCase();

  for (const item of serpResult.items) {
    const itemDomain = item.domain.replace(/^www\./, "").toLowerCase();
    if (itemDomain === normalizedDomain || itemDomain.endsWith(`.${normalizedDomain}`)) {
      return {
        position: item.rank_absolute,
        url: item.url,
      };
    }
  }
  return null;
}
