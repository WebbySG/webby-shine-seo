// =============================================================================
// Phase 18: Scoring Engine for Priority Ranking
// =============================================================================

export interface ScoringInput {
  // Ranking signals
  position?: number | null;
  positionDelta?: number | null;
  searchVolume?: number | null;
  
  // Traffic / engagement signals
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  
  // Content / asset signals
  contentAge?: number | null; // days
  lastUpdated?: number | null; // days
  wordCount?: number | null;
  
  // Technical signals
  hasTechnicalIssue?: boolean;
  technicalSeverity?: 'critical' | 'warning' | 'info';
  
  // Local SEO signals
  gbpCompletenessScore?: number | null;
  reviewCount?: number | null;
  averageRating?: number | null;
  
  // Ads signals
  adSpend?: number | null;
  adConversions?: number | null;
  adCtr?: number | null;
  
  // Effort indicators
  requiresDeveloper?: boolean;
  requiresDesigner?: boolean;
  requiresContentWriter?: boolean;
  estimatedHours?: number;
}

export interface ScoringWeights {
  rankingOpportunity: number;
  trafficPotential: number;
  ctrOpportunity: number;
  engagementTrends: number;
  localSeoGaps: number;
  adPerformanceGaps: number;
  contentPerformance: number;
  technicalBlockers: number;
  conversionSupport: number;
  effortPenalty: number;
}

export interface ScoringResult {
  priorityScore: number;
  impactScore: number;
  effortScore: number;
  confidenceScore: number;
  explanation: string[];
}

// Default weights (configurable)
const DEFAULT_WEIGHTS: ScoringWeights = {
  rankingOpportunity: 0.20,
  trafficPotential: 0.15,
  ctrOpportunity: 0.10,
  engagementTrends: 0.10,
  localSeoGaps: 0.10,
  adPerformanceGaps: 0.05,
  contentPerformance: 0.10,
  technicalBlockers: 0.10,
  conversionSupport: 0.05,
  effortPenalty: 0.05,
};

export function calculateScores(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoringResult {
  const explanation: string[] = [];
  let impactScore = 0;
  let effortScore = 0;
  let confidenceScore = 0;
  let dataPoints = 0;

  // 1. Ranking Opportunity (positions 11-30 are high opportunity)
  if (input.position !== null && input.position !== undefined) {
    dataPoints++;
    if (input.position >= 11 && input.position <= 20) {
      impactScore += 90 * weights.rankingOpportunity;
      explanation.push(`Near page 1 (position ${input.position}) — high opportunity`);
    } else if (input.position >= 21 && input.position <= 30) {
      impactScore += 60 * weights.rankingOpportunity;
      explanation.push(`Close to page 1 (position ${input.position}) — medium opportunity`);
    } else if (input.position >= 1 && input.position <= 10) {
      impactScore += 30 * weights.rankingOpportunity;
      explanation.push(`Already ranking well (position ${input.position}) — defend/optimize`);
    }
  }

  // 2. Traffic Potential (based on impressions and search volume)
  if (input.impressions !== null && input.impressions !== undefined) {
    dataPoints++;
    if (input.impressions > 10000) {
      impactScore += 100 * weights.trafficPotential;
      explanation.push(`High impression volume (${input.impressions.toLocaleString()}) — strong traffic potential`);
    } else if (input.impressions > 1000) {
      impactScore += 60 * weights.trafficPotential;
      explanation.push(`Moderate impressions (${input.impressions.toLocaleString()})`);
    } else {
      impactScore += 20 * weights.trafficPotential;
    }
  }

  // 3. CTR Opportunity (low CTR with high impressions = opportunity)
  if (input.ctr !== null && input.ctr !== undefined && input.impressions) {
    dataPoints++;
    if (input.ctr < 2 && input.impressions > 1000) {
      impactScore += 80 * weights.ctrOpportunity;
      explanation.push(`Low CTR (${input.ctr.toFixed(1)}%) with high impressions — CTR optimization needed`);
    } else if (input.ctr < 5) {
      impactScore += 40 * weights.ctrOpportunity;
      explanation.push(`CTR can be improved (${input.ctr.toFixed(1)}%)`);
    }
  }

  // 4. Content Performance (age and freshness)
  if (input.contentAge !== null && input.contentAge !== undefined) {
    dataPoints++;
    if (input.contentAge > 365) {
      impactScore += 70 * weights.contentPerformance;
      explanation.push(`Content is over 1 year old — refresh recommended`);
    } else if (input.contentAge > 180) {
      impactScore += 40 * weights.contentPerformance;
      explanation.push(`Content aging (${Math.round(input.contentAge / 30)} months old)`);
    }
  }

  // 5. Technical Blockers
  if (input.hasTechnicalIssue) {
    dataPoints++;
    if (input.technicalSeverity === 'critical') {
      impactScore += 100 * weights.technicalBlockers;
      explanation.push(`Critical technical issue blocking performance`);
    } else if (input.technicalSeverity === 'warning') {
      impactScore += 60 * weights.technicalBlockers;
      explanation.push(`Technical warning affecting performance`);
    } else {
      impactScore += 30 * weights.technicalBlockers;
    }
  }

  // 6. Local SEO Gaps
  if (input.gbpCompletenessScore !== null && input.gbpCompletenessScore !== undefined) {
    dataPoints++;
    if (input.gbpCompletenessScore < 50) {
      impactScore += 80 * weights.localSeoGaps;
      explanation.push(`GBP profile incomplete (${input.gbpCompletenessScore}%) — local visibility at risk`);
    } else if (input.gbpCompletenessScore < 80) {
      impactScore += 40 * weights.localSeoGaps;
      explanation.push(`GBP profile needs improvement (${input.gbpCompletenessScore}%)`);
    }
  }

  // 7. Ads Performance Gaps
  if (input.adSpend && input.adConversions !== null && input.adConversions !== undefined) {
    dataPoints++;
    const costPerConversion = input.adConversions > 0 ? input.adSpend / input.adConversions : Infinity;
    if (costPerConversion > 100) {
      impactScore += 70 * weights.adPerformanceGaps;
      explanation.push(`High ad cost per conversion ($${costPerConversion.toFixed(0)}) — optimization needed`);
    }
  }

  // 8. Calculate Effort Score (lower is easier)
  effortScore = 30; // base effort
  if (input.requiresDeveloper) {
    effortScore += 30;
    explanation.push(`Requires developer involvement`);
  }
  if (input.requiresDesigner) {
    effortScore += 20;
    explanation.push(`Requires designer involvement`);
  }
  if (input.requiresContentWriter) {
    effortScore += 15;
  }
  if (input.estimatedHours) {
    effortScore += Math.min(input.estimatedHours * 5, 50);
  }
  effortScore = Math.min(effortScore, 100);

  // 9. Calculate Confidence Score (based on data completeness)
  confidenceScore = Math.min((dataPoints / 6) * 100, 100);
  if (dataPoints < 2) {
    explanation.push(`Limited data available — confidence is low`);
  }

  // 10. Calculate final Priority Score
  // Priority = Impact - (Effort penalty) + Confidence bonus
  const priorityScore = Math.min(
    Math.max(
      impactScore - (effortScore * weights.effortPenalty) + (confidenceScore * 0.1),
      0
    ),
    100
  );

  return {
    priorityScore: Math.round(priorityScore),
    impactScore: Math.round(impactScore),
    effortScore: Math.round(effortScore),
    confidenceScore: Math.round(confidenceScore),
    explanation,
  };
}

// Quick scoring for common priority types
export function scoreNearWin(position: number, impressions: number): ScoringResult {
  return calculateScores({
    position,
    impressions,
    ctr: impressions > 0 ? Math.random() * 5 : null,
  });
}

export function scoreTechnicalFix(severity: 'critical' | 'warning' | 'info'): ScoringResult {
  return calculateScores({
    hasTechnicalIssue: true,
    technicalSeverity: severity,
    requiresDeveloper: severity === 'critical',
  });
}

export function scoreContentRefresh(ageInDays: number, clicks: number): ScoringResult {
  return calculateScores({
    contentAge: ageInDays,
    clicks,
    requiresContentWriter: true,
  });
}

export function scoreLocalSeoGap(completenessScore: number, reviewCount: number): ScoringResult {
  return calculateScores({
    gbpCompletenessScore: completenessScore,
    reviewCount,
  });
}
