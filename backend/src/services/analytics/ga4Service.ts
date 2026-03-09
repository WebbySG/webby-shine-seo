/**
 * Google Analytics 4 Service — provider-ready abstraction.
 * Replace placeholder logic with real GA4 Data API calls when credentials are available.
 */

export interface Ga4Credentials {
  accessToken: string;
  refreshToken: string;
  propertyId: string;
}

export interface Ga4PageRow {
  pagePath: string;
  sessions: number;
  users: number;
  engagementRate: number;
}

export async function fetchGa4PagePerformance(
  creds: Ga4Credentials,
  startDate: string,
  endDate: string
): Promise<Ga4PageRow[]> {
  // TODO: Replace with real GA4 Data API call
  // POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
  console.log(`[GA4] Fetching page performance for property ${creds.propertyId} (${startDate} to ${endDate})`);
  return [];
}

export async function refreshGa4Token(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
  console.log("[GA4] Token refresh not yet implemented");
  return null;
}
