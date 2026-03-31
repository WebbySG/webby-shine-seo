import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { client_id, keyword, page_type, search_intent, target_audience, page_goal } = await req.json();
    if (!client_id || !keyword) {
      return new Response(JSON.stringify({ error: "client_id and keyword required" }), { status: 400, headers: corsHeaders });
    }

    // Verify client ownership
    const { data: client, error: clientErr } = await supabase
      .from("clients").select("id, name, domain").eq("id", client_id).eq("user_id", user.id).single();
    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: "Client not found" }), { status: 404, headers: corsHeaders });
    }

    // Build context packet (token-efficient)
    const { data: existingBriefs } = await supabase
      .from("seo_briefs").select("keyword, title, status").eq("client_id", client_id).limit(10);
    
    const { data: recentAudit } = await supabase
      .from("audit_runs").select("score, critical_count, warning_count").eq("client_id", client_id)
      .order("created_at", { ascending: false }).limit(1);

    const contextPacket = {
      domain: client.domain,
      existingContent: (existingBriefs || []).map(b => `${b.keyword} (${b.status})`).join(", "),
      auditScore: recentAudit?.[0]?.score || "N/A",
      criticalIssues: recentAudit?.[0]?.critical_count || 0,
    };

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an SEO brief generator for ${client.domain}. Generate comprehensive SEO briefs. Return structured JSON using the suggest_brief tool.`
          },
          {
            role: "user",
            content: `Generate an SEO brief for keyword: "${keyword}"
Domain: ${contextPacket.domain}
Page type: ${page_type || "blog"}
Search intent: ${search_intent || "informational"}
Target audience: ${target_audience || "general"}
Page goal: ${page_goal || "organic traffic"}
Existing content: ${contextPacket.existingContent || "none"}
Site audit score: ${contextPacket.auditScore}, critical issues: ${contextPacket.criticalIssues}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_brief",
            description: "Return a structured SEO brief",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "SEO-optimized page title" },
                meta_description: { type: "string", description: "Meta description under 160 chars" },
                suggested_h1: { type: "string" },
                recommended_slug: { type: "string" },
                headings: { type: "array", items: { type: "object", properties: { level: { type: "string" }, text: { type: "string" } }, required: ["level", "text"] } },
                faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"] } },
                entities: { type: "array", items: { type: "string" } },
                secondary_keywords: { type: "array", items: { type: "string" } },
                sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, guidance: { type: "string" }, word_count_target: { type: "number" } }, required: ["title", "guidance"] } },
                cta_angle: { type: "string" },
              },
              required: ["title", "meta_description", "headings", "sections"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_brief" } }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: corsHeaders });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings." }), { status: 402, headers: corsHeaders });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured brief");

    const briefData = JSON.parse(toolCall.function.arguments);

    // Save to DB
    const { data: brief, error: insertErr } = await supabase
      .from("seo_briefs")
      .insert({
        client_id,
        keyword,
        title: briefData.title,
        meta_description: briefData.meta_description,
        headings: briefData.headings || [],
        faq: briefData.faq || [],
        entities: briefData.entities || [],
        sections: briefData.sections || [],
        secondary_keywords: briefData.secondary_keywords || [],
        suggested_h1: briefData.suggested_h1,
        recommended_slug: briefData.recommended_slug,
        cta_angle: briefData.cta_angle,
        page_type: page_type || "blog",
        search_intent: search_intent || "informational",
        target_audience,
        page_goal,
        status: "draft",
        priority: "medium",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify(brief), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
