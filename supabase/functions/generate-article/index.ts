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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { client_id, brief_id } = await req.json();
    if (!client_id || !brief_id) {
      return new Response(JSON.stringify({ error: "client_id and brief_id required" }), { status: 400, headers: corsHeaders });
    }

    // Get brief with client ownership check
    const { data: brief, error: briefErr } = await supabase
      .from("seo_briefs")
      .select("*, clients!inner(domain, name, user_id)")
      .eq("id", brief_id)
      .eq("clients.user_id", user.id)
      .single();

    if (briefErr || !brief) {
      return new Response(JSON.stringify({ error: "Brief not found" }), { status: 404, headers: corsHeaders });
    }

    // Build context packet from brief (already summarized — token efficient)
    const headings = (brief.headings || []).map((h: any) => `${h.level}: ${h.text}`).join("\n");
    const sections = (brief.sections || []).map((s: any) => `## ${s.title}\n${s.guidance}`).join("\n\n");
    const faq = (brief.faq || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

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
            content: `You are an expert SEO content writer for ${(brief as any).clients?.domain || "a website"}. Write comprehensive, well-structured articles optimized for search engines. Use proper HTML formatting with h2, h3, p, ul, ol tags. Do NOT use markdown. Write naturally and authoritatively.`
          },
          {
            role: "user",
            content: `Write a complete SEO article based on this brief:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
Meta Description: ${brief.meta_description}
H1: ${brief.suggested_h1 || brief.title}
Search Intent: ${brief.search_intent || "informational"}
Target Audience: ${brief.target_audience || "general"}

Outline:
${headings}

Sections:
${sections}

FAQ to include:
${faq}

Entities to mention: ${(brief.entities || []).join(", ")}
Secondary keywords: ${(brief.secondary_keywords || []).join(", ")}

Write the full article in HTML. Include all sections, FAQ, and entities naturally. Target 1500-2500 words.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: corsHeaders });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: corsHeaders });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI did not return article content");

    // Save article
    const { data: article, error: insertErr } = await supabase
      .from("seo_articles")
      .insert({
        client_id,
        brief_id,
        title: brief.title,
        meta_description: brief.meta_description,
        content,
        target_keyword: brief.keyword,
        slug: brief.recommended_slug || brief.keyword.toLowerCase().replace(/\s+/g, "-"),
        status: "draft",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Update brief status
    await supabase.from("seo_briefs").update({ status: "approved" }).eq("id", brief_id);

    return new Response(JSON.stringify(article), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
