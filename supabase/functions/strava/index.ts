import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getSupabaseClient = (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });
};

const getCurrentUserId = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
};

const exchangeCodeForTokens = async (code: string) => {
  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing Strava client credentials");
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Strava token exchange failed: ${text}`);
  }

  return response.json();
};

const refreshAccessToken = async (refreshToken: string) => {
  const clientId = Deno.env.get("STRAVA_CLIENT_ID");
  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing Strava client credentials");
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Strava token refresh failed: ${text}`);
  }

  return response.json();
};

const fetchActivities = async (accessToken: string, afterEpoch: number) => {
  const activities: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 200;

  while (page <= 5) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", afterEpoch.toString());
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("page", page.toString());

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava activities fetch failed: ${text}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    activities.push(...batch);
    if (batch.length < perPage) {
      break;
    }
    page += 1;
  }

  return activities;
};

const aggregateMonthlyKm = (activities: Array<Record<string, unknown>>) => {
  const totals = new Map<string, number>();

  activities.forEach((activity) => {
    const sportType = String(activity.sport_type ?? activity.type ?? "");
    if (sportType.toLowerCase() !== "run") return;

    const startDate = activity.start_date_local ?? activity.start_date;
    if (!startDate) return;

    const date = new Date(String(startDate));
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const distanceMeters = Number(activity.distance ?? 0);

    totals.set(key, (totals.get(key) ?? 0) + distanceMeters);
  });

  return Array.from(totals.entries()).map(([key, distanceMeters]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      year,
      month,
      total_km: Number((distanceMeters / 1000).toFixed(2)),
    };
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { action, code } = await req.json();

    if (!action) {
      return jsonResponse({ error: "Missing action" }, 400);
    }

    const supabase = getSupabaseClient(req);
    const userId = await getCurrentUserId(supabase);

    if (action === "authorize") {
      if (!code) {
        return jsonResponse({ error: "Missing code" }, 400);
      }

      const tokenData = await exchangeCodeForTokens(String(code));

      const { error } = await supabase.from("strava_tokens").upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      });

      if (error) throw error;

      return jsonResponse({ status: "ok" });
    }

    if (action === "sync") {
      const { data, error } = await supabase
        .from("strava_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return jsonResponse({ error: "No Strava token found" }, 400);
      }

      let accessToken = data.access_token;
      const expiresAt = new Date(data.expires_at).getTime();

      if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
        const refreshed = await refreshAccessToken(data.refresh_token);
        accessToken = refreshed.access_token;

        const { error: refreshError } = await supabase.from("strava_tokens").upsert({
          user_id: userId,
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
        });

        if (refreshError) throw refreshError;
      }

      const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
      const activities = await fetchActivities(accessToken, oneYearAgo);
      const monthlyStats = aggregateMonthlyKm(activities);

      if (monthlyStats.length) {
        const { error: upsertError } = await supabase
          .from("strava_monthly_stats")
          .upsert(monthlyStats.map((stat) => ({ ...stat, user_id: userId })));

        if (upsertError) throw upsertError;
      }

      return jsonResponse({ status: "ok", months: monthlyStats.length });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
