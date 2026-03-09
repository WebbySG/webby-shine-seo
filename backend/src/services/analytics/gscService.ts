/**
 * Google Search Console Service — provider-ready abstraction.
 * Replace placeholder logic with real OAuth + GSC API calls when credentials are available.
 */

export interface GscCredentials {
  accessToken: string;
  refreshToken: string;
  siteUrl: string;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscKeywordRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function fetchGscPagePerformance(
  creds: GscCredentials,
  startDate: string,
  endDate: string
): Promise<GscPageRow[]> {
  // TODO: Replace with real GSC API call
  // POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
  console.log(`[GSC] Fetching page performance for ${creds.siteUrl} (${startDate} to ${endDate})`);
  return [];
}

export async function fetchGscKeywordPerformance(
  creds: GscCredentials,
  startDate: string,
  endDate: string
): Promise<GscKeywordRow[]> {
  console.log(`[GSC] Fetching keyword performance for ${creds.siteUrl} (${startDate} to ${endDate})`);
  return [];
}

export async function refreshGscToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
  // TODO: Implement OAuth token refresh via Google OAuth2
  console.log("[GSC] Token refresh not yet implemented");
  return null;
}
