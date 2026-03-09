/**
 * Google Business Profile Service — provider-ready abstraction.
 * Currently uses placeholder data; swap in real GBP API calls when OAuth is configured.
 */
import pool from "../../db.js";

interface GbpCredentials {
  accessToken: string;
  refreshToken: string | null;
  accountId: string;
  locationId: string;
}

// ---------- Profile Snapshot ----------
export interface GbpProfileData {
  businessName: string;
  primaryCategory: string;
  additionalCategories: string[];
  address: string;
  phone: string;
  websiteUrl: string;
  businessDescription: string;
  openingHours: Record<string, string> | null;
  servicesCount: number;
  productsCount: number;
  photosCount: number;
  postsCount: number;
  reviewsCount: number;
  averageRating: number;
  qnaCount: number;
}

export async function fetchGbpProfile(creds: GbpCredentials): Promise<GbpProfileData> {
  // TODO: Replace with real Google My Business API call
  // GET https://mybusinessbusinessinformation.googleapis.com/v1/{name}
  console.log(`[GBP] Fetching profile for location ${creds.locationId} (placeholder)`);
  return {
    businessName: "Sample Business",
    primaryCategory: "General Contractor",
    additionalCategories: [],
    address: "123 Main St",
    phone: "+65 1234 5678",
    websiteUrl: "https://example.com",
    businessDescription: "",
    openingHours: null,
    servicesCount: 0,
    productsCount: 0,
    photosCount: 2,
    postsCount: 0,
    reviewsCount: 5,
    averageRating: 4.2,
    qnaCount: 0,
  };
}

// ---------- Completeness Scoring ----------
export interface CompletenessResult {
  score: number;
  missingItems: string[];
  priorityActions: string[];
}

export function calculateCompleteness(profile: GbpProfileData): CompletenessResult {
  const checks: { field: string; label: string; ok: boolean; weight: number }[] = [
    { field: "primaryCategory", label: "Primary category", ok: !!profile.primaryCategory, weight: 10 },
    { field: "businessDescription", label: "Business description", ok: !!profile.businessDescription, weight: 10 },
    { field: "openingHours", label: "Opening hours", ok: !!profile.openingHours, weight: 10 },
    { field: "phone", label: "Phone number", ok: !!profile.phone, weight: 8 },
    { field: "address", label: "Address", ok: !!profile.address, weight: 8 },
    { field: "websiteUrl", label: "Website URL", ok: !!profile.websiteUrl, weight: 8 },
    { field: "services", label: "Services listed", ok: profile.servicesCount > 0, weight: 8 },
    { field: "products", label: "Products listed", ok: profile.productsCount > 0, weight: 6 },
    { field: "photos", label: "Photos (5+)", ok: profile.photosCount >= 5, weight: 10 },
    { field: "posts", label: "Recent GBP posts", ok: profile.postsCount > 0, weight: 8 },
    { field: "reviews", label: "Reviews (10+)", ok: profile.reviewsCount >= 10, weight: 8 },
    { field: "qna", label: "Q&A presence", ok: profile.qnaCount > 0, weight: 6 },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter(c => c.ok).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  const missingItems = checks.filter(c => !c.ok).map(c => c.label);
  const priorityActions = checks.filter(c => !c.ok && c.weight >= 8).map(c => `Add ${c.label.toLowerCase()}`);

  return { score, missingItems, priorityActions };
}

// ---------- Reviews ----------
export interface GbpReview {
  reviewId: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
}

export async function fetchGbpReviews(creds: GbpCredentials): Promise<GbpReview[]> {
  // TODO: Replace with real GBP reviews API
  console.log(`[GBP] Fetching reviews for location ${creds.locationId} (placeholder)`);
  return [];
}

// ---------- Q&A ----------
export interface GbpQuestion {
  questionId: string;
  questionText: string;
}

export async function fetchGbpQuestions(creds: GbpCredentials): Promise<GbpQuestion[]> {
  // TODO: Replace with real GBP Q&A API
  console.log(`[GBP] Fetching Q&A for location ${creds.locationId} (placeholder)`);
  return [];
}

// ---------- Post Publishing ----------
export async function publishGbpPost(
  creds: GbpCredentials,
  post: { title: string; content: string; ctaType?: string; ctaUrl?: string }
): Promise<{ externalPostId: string; publishedUrl: string }> {
  // TODO: Replace with real GBP local post API
  console.log(`[GBP] Publishing post "${post.title}" (placeholder)`);
  return {
    externalPostId: `gbp_post_${Date.now()}`,
    publishedUrl: `https://business.google.com/posts/${Date.now()}`,
  };
}

// ---------- Review Response ----------
export async function respondToReview(
  creds: GbpCredentials,
  reviewId: string,
  responseText: string
): Promise<boolean> {
  // TODO: Replace with real GBP review reply API
  console.log(`[GBP] Responding to review ${reviewId} (placeholder)`);
  return true;
}

// ---------- Q&A Response ----------
export async function answerQuestion(
  creds: GbpCredentials,
  questionId: string,
  answerText: string
): Promise<boolean> {
  // TODO: Replace with real GBP Q&A answer API
  console.log(`[GBP] Answering question ${questionId} (placeholder)`);
  return true;
}

// ---------- Local SEO Insight Generation ----------
export async function generateLocalSeoInsights(clientId: string): Promise<number> {
  // Clear old open insights
  await pool.query(
    `DELETE FROM local_seo_insights WHERE client_id = $1 AND status = 'open'`,
    [clientId]
  );

  // Get latest snapshot
  const { rows: snapshots } = await pool.query(
    `SELECT * FROM gbp_profile_snapshots WHERE client_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
    [clientId]
  );

  if (snapshots.length === 0) return 0;
  const s = snapshots[0];

  const insights: { type: string; priority: string; title: string; desc: string; action: string }[] = [];

  // Missing fields
  if (!s.business_description) insights.push({ type: "missing_fields", priority: "high", title: "Missing business description", desc: "Your GBP listing has no business description.", action: "Add a compelling business description with target keywords." });
  if (!s.opening_hours) insights.push({ type: "missing_fields", priority: "high", title: "Missing opening hours", desc: "Opening hours are not set.", action: "Add accurate business hours to your profile." });
  if (s.services_count === 0) insights.push({ type: "missing_fields", priority: "medium", title: "No services listed", desc: "Your profile has no services.", action: "Add your key services to improve local visibility." });

  // Low review velocity
  if (s.reviews_count < 10) insights.push({ type: "low_review_velocity", priority: "high", title: "Low review count", desc: `Only ${s.reviews_count} reviews. Aim for 10+.`, action: "Implement a review generation strategy." });

  // Posting opportunity
  if (s.posts_count === 0) insights.push({ type: "posting_opportunity", priority: "medium", title: "No GBP posts", desc: "No recent Google Business posts found.", action: "Create weekly GBP posts from your published content." });

  // Photo opportunity
  if (s.photos_count < 5) insights.push({ type: "photo_opportunity", priority: "medium", title: "Low photo count", desc: `Only ${s.photos_count} photos. Google favors profiles with 5+.`, action: "Upload quality photos of your business, team, and work." });

  // Q&A opportunity
  if (s.qna_count === 0) insights.push({ type: "qna_opportunity", priority: "low", title: "No Q&A", desc: "Your profile has no questions and answers.", action: "Seed your Q&A section with common customer questions." });

  // Category optimization
  const additionalCats = s.additional_categories || [];
  if (additionalCats.length === 0) insights.push({ type: "category_optimization", priority: "medium", title: "No additional categories", desc: "Only one category set.", action: "Add relevant secondary categories to increase visibility." });

  // Review response opportunity
  const { rows: unresponded } = await pool.query(
    `SELECT COUNT(*) as cnt FROM gbp_review_items WHERE client_id = $1 AND response_status = 'unreviewed'`,
    [clientId]
  );
  if (parseInt(unresponded[0]?.cnt) > 0) {
    insights.push({ type: "review_response_opportunity", priority: "high", title: "Unresponded reviews", desc: `${unresponded[0].cnt} reviews without responses.`, action: "Respond to all reviews to improve engagement signals." });
  }

  for (const i of insights) {
    await pool.query(
      `INSERT INTO local_seo_insights (client_id, insight_type, priority, title, description, recommended_action) VALUES ($1, $2, $3, $4, $5, $6)`,
      [clientId, i.type, i.priority, i.title, i.desc, i.action]
    );
  }

  return insights.length;
}
