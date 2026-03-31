import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

interface ModuleData {
  keywords: any[];
  auditIssues: any[];
  opportunities: any[];
  briefs: any[];
  articles: any[];
  rankSnapshots: any[];
}

async function gatherModuleData(supabase: any, clientId: string): Promise<ModuleData> {
  // First fetch job IDs for this client
  const { data: jobRows } = await supabase.from("keyword_research_jobs").select("id").eq("client_id", clientId);
  const jobIds = (jobRows || []).map((j: any) => j.id);

  const [keywords, auditIssues, opportunities, briefs, articles, rankSnapshots] = await Promise.all([
    jobIds.length > 0
      ? supabase.from("keyword_research_results")
          .select("keyword, search_volume, keyword_difficulty, overall_score, search_intent, mapping_status, recommended_page_type")
          .in("job_id", jobIds)
          .order("overall_score", { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
    supabase.from("audit_issues")
      .select("issue_type, severity, affected_url, status, description")
      .eq("client_id", clientId).eq("status", "open")
      .order("severity").limit(20),
    supabase.from("opportunities")
      .select("type, keyword, current_position, recommended_action, priority, status")
      .eq("client_id", clientId).eq("status", "open")
      .order("priority").limit(15),
    supabase.from("seo_briefs")
      .select("keyword, title, status, priority")
      .eq("client_id", clientId).limit(15),
    supabase.from("seo_articles")
      .select("title, status, target_keyword")
      .eq("client_id", clientId).limit(15),
    supabase.from("rank_snapshots")
      .select("keyword, position, previous_position, snapshot_date")
      .eq("client_id", clientId)
      .order("snapshot_date", { ascending: false }).limit(30),
  ]);

  return {
    keywords: keywords.data || [],
    auditIssues: auditIssues.data || [],
    opportunities: opportunities.data || [],
    briefs: briefs.data || [],
    articles: articles.data || [],
    rankSnapshots: rankSnapshots.data || [],
  };
}

function buildCompactSummary(data: ModuleData): string {
  const lines: string[] = [];
  
  // Keywords summary (compact)
  if (data.keywords.length > 0) {
    const topKw = data.keywords.slice(0, 10).map(k => 
      `${k.keyword}(v:${k.search_volume},kd:${k.keyword_difficulty},s:${k.overall_score},i:${k.search_intent},m:${k.mapping_status})`
    );
    lines.push(`KEYWORDS(${data.keywords.length}):${topKw.join("|")}`);
  }

  // Audit issues (compact)
  if (data.auditIssues.length > 0) {
    const criticals = data.auditIssues.filter(i => i.severity === "critical");
    const warnings = data.auditIssues.filter(i => i.severity === "warning");
    const issueTypes = [...new Set(data.auditIssues.map(i => i.issue_type))].slice(0, 8);
    lines.push(`AUDIT_ISSUES(c:${criticals.length},w:${warnings.length}):${issueTypes.join(",")}`);
  }

  // Opportunities (compact)
  if (data.opportunities.length > 0) {
    const nearWins = data.opportunities.filter(o => o.type === "near_win");
    const gaps = data.opportunities.filter(o => o.type === "content_gap");
    lines.push(`OPPORTUNITIES(near_wins:${nearWins.length},gaps:${gaps.length},total:${data.opportunities.length})`);
  }

  // Content pipeline
  const draftBriefs = data.briefs.filter(b => b.status === "draft").length;
  const draftArticles = data.articles.filter(a => a.status === "draft").length;
  if (data.briefs.length > 0 || data.articles.length > 0) {
    lines.push(`CONTENT(briefs:${data.briefs.length}/draft:${draftBriefs},articles:${data.articles.length}/draft:${draftArticles})`);
  }

  // Rankings movement
  if (data.rankSnapshots.length > 0) {
    const improved = data.rankSnapshots.filter(r => r.previous_position && r.position && r.position < r.previous_position).length;
    const declined = data.rankSnapshots.filter(r => r.previous_position && r.position && r.position > r.previous_position).length;
    const page1 = data.rankSnapshots.filter(r => r.position && r.position <= 10).length;
    lines.push(`RANKINGS(improved:${improved},declined:${declined},page1:${page1})`);
  }

  return lines.join("\n");
}

async function generateAIPlan(dataSummary: string): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = `You are an SEO strategist. Given module data, return a JSON object with exactly this structure:
{
  "summary": "1-sentence weekly focus",
  "top_goal": "Primary goal for the week",
  "priorities": [{"title":"...","description":"...","priority_type":"seo|content|technical","source_module":"keywords|audit|rankings|content","impact_score":1-100,"effort_score":1-100,"confidence_score":1-100,"recommended_action":"...","keyword":"optional","target_url":"optional"}],
  "quick_wins": [{"title":"...","description":"...","module":"seo|content|technical","effort_level":"low","impact_level":"high"}],
  "plan_items": [{"title":"...","description":"...","owner_type":"seo|developer|designer|content|manager","priority":"high|medium|low"}]
}
Rules:
- Generate 5-8 priorities ranked by impact*confidence/effort
- Generate 3-5 quick wins (low effort, high impact)
- Generate 5-10 plan items assigned to specific owner types
- Focus on near-wins (positions 11-20), critical audit fixes, unmapped high-score keywords
- Be specific and actionable, referencing actual keywords and URLs from the data
- Return ONLY valid JSON, no markdown`;

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: dataSummary },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited — please try again later");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up");
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  
  return JSON.parse(jsonStr);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/command-center\/?/, "");

  try {
    const supabase = adminClient();

    // POST /command-center/generate-plan
    if (req.method === "POST" && path === "generate-plan") {
      const { client_id } = await req.json();
      if (!client_id) return new Response(JSON.stringify({ error: "client_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Gather all module data
      const moduleData = await gatherModuleData(supabase, client_id);
      const dataSummary = buildCompactSummary(moduleData);

      if (!dataSummary) {
        return new Response(JSON.stringify({ error: "No data available to generate a plan. Add keywords, run audits, or track rankings first." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate AI plan
      const aiPlan = await generateAIPlan(dataSummary);

      // Store priorities
      if (aiPlan.priorities?.length > 0) {
        const priorityRows = aiPlan.priorities.map((p: any, i: number) => ({
          client_id,
          title: p.title,
          description: p.description,
          priority_type: p.priority_type || "seo",
          source_module: p.source_module || "seo",
          impact_score: p.impact_score || 50,
          effort_score: p.effort_score || 50,
          confidence_score: p.confidence_score || 50,
          priority_score: Math.round((p.impact_score || 50) * (p.confidence_score || 50) / Math.max(p.effort_score || 50, 1)),
          recommended_action: p.recommended_action,
          keyword: p.keyword || null,
          target_url: p.target_url || null,
          status: "open",
        }));
        await supabase.from("marketing_priorities").insert(priorityRows);
      }

      // Store quick wins
      if (aiPlan.quick_wins?.length > 0) {
        const qwRows = aiPlan.quick_wins.map((q: any) => ({
          client_id,
          title: q.title,
          description: q.description,
          module: q.module || "seo",
          effort_level: q.effort_level || "low",
          impact_level: q.impact_level || "high",
          status: "open",
        }));
        await supabase.from("quick_wins").insert(qwRows);
      }

      // Create weekly plan
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      const weekStart = monday.toISOString().split("T")[0];

      const { data: plan, error: planErr } = await supabase
        .from("weekly_action_plans")
        .insert({
          client_id,
          week_start: weekStart,
          summary: aiPlan.summary || "Weekly action plan generated",
          top_goal: aiPlan.top_goal || "Execute priority tasks",
          status: "active",
          ai_model: "gemini-2.5-flash",
        })
        .select()
        .single();

      if (planErr) throw planErr;

      // Store plan items
      if (aiPlan.plan_items?.length > 0) {
        const itemRows = aiPlan.plan_items.map((item: any, i: number) => ({
          plan_id: plan.id,
          title: item.title,
          description: item.description,
          owner_type: item.owner_type || "seo",
          priority: item.priority || "medium",
          status: "todo",
          sort_order: i,
        }));
        await supabase.from("weekly_plan_items").insert(itemRows);
      }

      return new Response(JSON.stringify({
        success: true,
        plan_id: plan.id,
        priorities_generated: aiPlan.priorities?.length || 0,
        quick_wins_generated: aiPlan.quick_wins?.length || 0,
        plan_items_generated: aiPlan.plan_items?.length || 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /command-center/recompute
    if (req.method === "POST" && path === "recompute") {
      const { client_id } = await req.json();
      if (!client_id) return new Response(JSON.stringify({ error: "client_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Clear existing open priorities
      await supabase.from("marketing_priorities").delete().eq("client_id", client_id).eq("status", "open");
      await supabase.from("quick_wins").delete().eq("client_id", client_id).eq("status", "open");

      const moduleData = await gatherModuleData(supabase, client_id);
      const dataSummary = buildCompactSummary(moduleData);

      if (!dataSummary) {
        return new Response(JSON.stringify({ success: true, priorities_generated: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiPlan = await generateAIPlan(dataSummary);

      if (aiPlan.priorities?.length > 0) {
        await supabase.from("marketing_priorities").insert(
          aiPlan.priorities.map((p: any) => ({
            client_id,
            title: p.title,
            description: p.description,
            priority_type: p.priority_type || "seo",
            source_module: p.source_module || "seo",
            impact_score: p.impact_score || 50,
            effort_score: p.effort_score || 50,
            confidence_score: p.confidence_score || 50,
            priority_score: Math.round((p.impact_score || 50) * (p.confidence_score || 50) / Math.max(p.effort_score || 50, 1)),
            recommended_action: p.recommended_action,
            keyword: p.keyword || null,
            target_url: p.target_url || null,
          }))
        );
      }

      if (aiPlan.quick_wins?.length > 0) {
        await supabase.from("quick_wins").insert(
          aiPlan.quick_wins.map((q: any) => ({ client_id, title: q.title, description: q.description, module: q.module || "seo", effort_level: q.effort_level || "low", impact_level: q.impact_level || "high" }))
        );
      }

      return new Response(JSON.stringify({ success: true, priorities_generated: aiPlan.priorities?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /command-center/summary?client_id=xxx
    if (req.method === "GET" && path === "summary") {
      const clientId = url.searchParams.get("client_id");
      if (!clientId) return new Response(JSON.stringify({ error: "client_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const [priorities, quickWins, weeklyPlans] = await Promise.all([
        supabase.from("marketing_priorities").select("id, status, priority_type, priority_score").eq("client_id", clientId),
        supabase.from("quick_wins").select("id, status").eq("client_id", clientId),
        supabase.from("weekly_action_plans").select("id, status").eq("client_id", clientId).eq("status", "active").limit(1),
      ]);

      const allP = priorities.data || [];
      const planItems = weeklyPlans.data?.[0]?.id
        ? (await supabase.from("weekly_plan_items").select("id, status").eq("plan_id", weeklyPlans.data[0].id)).data || []
        : [];

      const nearWins = await supabase.from("opportunities").select("id").eq("client_id", clientId).eq("type", "near_win").eq("status", "open");

      return new Response(JSON.stringify({
        totalPriorities: allP.length,
        highPriorityCount: allP.filter(p => p.priority_score >= 80).length,
        quickWinsCount: (quickWins.data || []).filter(q => q.status === "open").length,
        nearPage1Count: (nearWins.data || []).length,
        weeklyTasksDue: planItems.length,
        weeklyTasksCompleted: planItems.filter(i => i.status === "done").length,
        repurposeCount: 0,
        decliningAssetsCount: 0,
        gbpIssuesCount: 0,
        adsOpportunitiesCount: 0,
        topGrowthChannels: [],
        topUnderperformingChannels: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /command-center/priorities?client_id=xxx
    if (req.method === "GET" && path === "priorities") {
      const clientId = url.searchParams.get("client_id");
      const status = url.searchParams.get("status");
      let query = supabase.from("marketing_priorities").select("*").eq("client_id", clientId).order("priority_score", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PATCH /command-center/priorities/{id}
    const priorityPatch = path.match(/^priorities\/([0-9a-f-]{36})$/);
    if (req.method === "PATCH" && priorityPatch) {
      const { status } = await req.json();
      const { data, error } = await supabase.from("marketing_priorities").update({ status }).eq("id", priorityPatch[1]).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /command-center/weekly-plans?client_id=xxx
    if (req.method === "GET" && path === "weekly-plans") {
      const clientId = url.searchParams.get("client_id");
      const { data, error } = await supabase.from("weekly_action_plans").select("*").eq("client_id", clientId).order("week_start", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /command-center/plan-items?plan_id=xxx
    if (req.method === "GET" && path === "plan-items") {
      const planId = url.searchParams.get("plan_id");
      if (!planId) return new Response(JSON.stringify({ error: "plan_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data, error } = await supabase.from("weekly_plan_items").select("*").eq("plan_id", planId).order("sort_order");
      if (error) throw error;
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PATCH /command-center/plan-items/{id}
    const planItemPatch = path.match(/^plan-items\/([0-9a-f-]{36})$/);
    if (req.method === "PATCH" && planItemPatch) {
      const { status } = await req.json();
      const { data, error } = await supabase.from("weekly_plan_items").update({ status }).eq("id", planItemPatch[1]).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /command-center/quick-wins?client_id=xxx
    if (req.method === "GET" && path === "quick-wins") {
      const clientId = url.searchParams.get("client_id");
      const { data, error } = await supabase.from("quick_wins").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("command-center error:", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = msg.includes("Rate limited") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
