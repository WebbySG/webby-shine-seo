import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATAFORSEO_API = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  const login = Deno.env.get("DATAFORSEO_LOGIN");
  const password = Deno.env.get("DATAFORSEO_PASSWORD");
  if (!login || !password) throw new Error("DataForSEO credentials not configured");
  return "Basic " + btoa(`${login}:${password}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { client_id } = body;
    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify client ownership
    const { data: client, error: clientErr } = await supabase
      .from("clients").select("id, domain, user_id").eq("id", client_id).single();
    if (clientErr || !client || client.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active keywords
    const { data: keywords, error: kwErr } = await supabase
      .from("keywords").select("id, keyword, location, locale")
      .eq("client_id", client_id).eq("is_active", true);
    if (kwErr) throw kwErr;
    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ message: "No keywords to track", snapshots: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build DataForSEO tasks (batch up to 100)
    const tasks = keywords.map((kw) => ({
      keyword: kw.keyword,
      location_name: kw.location || "Singapore",
      language_code: (kw.locale || "en-SG").split("-")[0],
      depth: 20,
      tag: kw.id,
    }));

    // Call DataForSEO SERP API
    const dfsResponse = await fetch(`${DATAFORSEO_API}/serp/google/organic/live/advanced`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tasks),
    });

    if (!dfsResponse.ok) {
      const errText = await dfsResponse.text();
      throw new Error(`DataForSEO API error: ${dfsResponse.status} - ${errText}`);
    }

    const dfsData = await dfsResponse.json();
    if (dfsData.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${dfsData.status_message}`);
    }

    const clientDomain = client.domain.replace(/^www\./, "").toLowerCase();
    const snapshots: any[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (const task of dfsData.tasks || []) {
      if (task.status_code !== 20000) {
        console.warn(`Task failed: ${task.data?.keyword}`, task.status_message);
        continue;
      }

      const keywordId = task.data?.tag;
      const keywordText = task.data?.keyword;
      const items = task.result?.[0]?.items || [];

      // Find client's domain position
      const organics = items.filter((item: any) => item.type === "organic");
      let position: number | null = null;
      let rankingUrl: string | null = null;

      for (const item of organics) {
        const itemDomain = (item.domain || "").replace(/^www\./, "").toLowerCase();
        if (itemDomain === clientDomain || itemDomain.endsWith(`.${clientDomain}`)) {
          position = item.rank_absolute;
          rankingUrl = item.url;
          break;
        }
      }

      // Get previous position for delta
      const { data: prevSnap } = await supabase
        .from("rank_snapshots")
        .select("position")
        .eq("keyword_id", keywordId)
        .eq("domain", client.domain)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      const previousPosition = prevSnap?.position ?? null;

      const snapshot = {
        client_id,
        keyword_id: keywordId,
        keyword: keywordText,
        domain: client.domain,
        position,
        previous_position: previousPosition,
        url: rankingUrl,
        snapshot_date: today,
        provider: "dataforseo",
      };

      snapshots.push(snapshot);
    }

    // Upsert snapshots (one per keyword per day)
    if (snapshots.length > 0) {
      for (const snap of snapshots) {
        // Delete existing snapshot for same keyword+domain+date, then insert
        await supabase
          .from("rank_snapshots")
          .delete()
          .eq("keyword_id", snap.keyword_id)
          .eq("domain", snap.domain)
          .eq("snapshot_date", snap.snapshot_date);

        await supabase.from("rank_snapshots").insert(snap);
      }
    }

    return new Response(JSON.stringify({
      message: `Tracked ${snapshots.length} keywords`,
      snapshots_count: snapshots.length,
      snapshots,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("fetch-rankings error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
