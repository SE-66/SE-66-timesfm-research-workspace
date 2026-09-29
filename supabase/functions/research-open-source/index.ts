import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const permissive = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense"
]);
const reciprocal = new Set([
  "GPL-2.0", "GPL-2.0-only", "GPL-2.0-or-later",
  "GPL-3.0", "GPL-3.0-only", "GPL-3.0-or-later",
  "AGPL-3.0", "AGPL-3.0-only", "AGPL-3.0-or-later",
  "LGPL-2.1", "LGPL-2.1-only", "LGPL-2.1-or-later",
  "LGPL-3.0", "LGPL-3.0-only", "LGPL-3.0-or-later",
  "MPL-2.0"
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function classifyLicense(spdx: string | null | undefined) {
  const id = (spdx || "UNKNOWN").trim();
  if (permissive.has(id)) return "permissive";
  if (reciprocal.has(id)) return "reciprocal";
  if (id === "NOASSERTION" || id === "OTHER" || id === "UNKNOWN") return "unknown";
  if (/BUSL|SSPL|Commons-Clause|Elastic|PolyForm|FSL/i.test(id)) return "restricted";
  return "review";
}

function maintenanceState(pushedAt: string | null | undefined, archived: boolean) {
  if (archived) return "archived";
  if (!pushedAt) return "unknown";
  const ageMs = Date.now() - new Date(pushedAt).getTime();
  const days = ageMs / 86_400_000;
  if (days <= 365) return "active";
  if (days > 730) return "stale";
  return "unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { query?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const query = String(body.query || "").trim();
  const limit = Math.min(Math.max(Number(body.limit || 8), 3), 12);
  if (query.length < 2 || query.length > 180) {
    return json({ error: "Query must be between 2 and 180 characters." }, 400);
  }

  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "open-source-app-builder",
  };
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  const response = await fetch(url, { headers });
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  if (!response.ok) {
    const detail = await response.text();
    return json({
      error: "GitHub repository search failed.",
      status: response.status,
      detail: detail.slice(0, 500),
      rate_limit_remaining: remaining,
      rate_limit_reset: reset,
    }, response.status === 403 ? 429 : 502);
  }

  const data = await response.json();
  const candidates = (Array.isArray(data.items) ? data.items : []).map((item: any) => {
    const licenseSpdx = item.license?.spdx_id || "UNKNOWN";
    const licenseState = classifyLicense(licenseSpdx);
    const maintenance = maintenanceState(item.pushed_at, Boolean(item.archived));
    const notes: string[] = [];
    if (item.archived) notes.push("Repository is archived; avoid new dependency adoption.");
    if (maintenance === "stale") notes.push("No recent push activity; maintenance review required.");
    if (licenseState === "permissive") notes.push("Permissive SPDX license detected; still review LICENSE/NOTICE before reuse.");
    if (licenseState === "reciprocal") notes.push("Reciprocal/copyleft license detected; review obligations before integration.");
    if (licenseState === "restricted") notes.push("Potentially restrictive/source-available license detected; legal review required.");
    if (licenseState === "unknown" || licenseState === "review") notes.push("License is not conclusively reusable from search metadata; inspect the repository license file.");

    return {
      repository_full_name: item.full_name,
      repository_url: item.html_url,
      description: item.description || "",
      license_spdx: licenseSpdx,
      stars: Number(item.stargazers_count || 0),
      primary_language: item.language || "",
      pushed_at: item.pushed_at || null,
      archived: Boolean(item.archived),
      maintenance_state: maintenance,
      license_state: licenseState,
      notes: notes.join(" "),
      raw_metadata: {
        default_branch: item.default_branch,
        forks_count: item.forks_count,
        open_issues_count: item.open_issues_count,
        topics: item.topics || [],
        owner: item.owner?.login || "",
      },
    };
  });

  return json({
    query,
    total_count: Number(data.total_count || 0),
    candidates,
    rate_limit_remaining: remaining,
    rate_limit_reset: reset,
    caveat: "Search metadata is discovery evidence only. Verify repository LICENSE/NOTICE, dependencies, security posture, compatibility, and relevant source before reuse.",
  });
});
