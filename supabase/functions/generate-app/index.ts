import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(candidate.slice(first, last + 1));
    throw new Error("Model did not return valid JSON.");
  }
}

function validPath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 240 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..") &&
    !path.includes("\0")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const projectName = String(body.project_name || "").trim();
  const brief = String(body.brief || "").trim();
  const stackPreferences = String(body.stack_preferences || "").trim();
  const deploymentTarget = String(body.deployment_target || "cloudflare").trim();
  const hfToken = String(body.hf_token || "").trim();
  const model = String(body.model || "Qwen/Qwen3-Coder-480B-A35B-Instruct:fastest").trim();
  const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 10) : [];
  const decisions = Array.isArray(body.decisions) ? body.decisions.slice(0, 10) : [];

  if (projectName.length < 1 || projectName.length > 120) {
    return json({ error: "Project name must be 1-120 characters." }, 400);
  }
  if (brief.length < 10 || brief.length > 12000) {
    return json({ error: "Brief must be 10-12000 characters." }, 400);
  }
  if (!hfToken || hfToken.length < 10) {
    return json({ error: "A Hugging Face token with Inference Providers permission is required." }, 400);
  }
  if (!/^[\w./:-]{3,220}$/.test(model)) {
    return json({ error: "Invalid Hugging Face model identifier." }, 400);
  }

  const researchContext = candidates.map((candidate: any) => ({
    repository_full_name: String(candidate.repository_full_name || ""),
    repository_url: String(candidate.repository_url || ""),
    description: String(candidate.description || ""),
    license_spdx: String(candidate.license_spdx || "UNKNOWN"),
    license_state: String(candidate.license_state || "unknown"),
    maintenance_state: String(candidate.maintenance_state || "unknown"),
    notes: String(candidate.notes || ""),
  }));

  const decisionContext = decisions.map((decision: any) => ({
    repository_full_name: String(decision.repository_full_name || ""),
    decision: String(decision.decision || ""),
    integration_method: String(decision.integration_method || ""),
    rationale: String(decision.rationale || ""),
  }));

  const system = `You are an expert software engineer generating a small but complete application source bundle.

MANDATORY OPEN-SOURCE-FIRST RULES:
1. Inspect the requested feature set and use the supplied OSS research as evidence.
2. Prefer maintained, documented, legally reusable dependencies/components over reimplementing generic functionality.
3. Never paste external repository source code. Reuse through package dependencies, APIs, adapters, components, or architectural reference.
4. Treat unknown, reciprocal, restrictive, and source-available licenses cautiously. Do not incorporate code unless the supplied decision explicitly allows a compatible integration method.
5. Preserve one clear source of truth for auth, users, database, app state, config, storage, and APIs.
6. Do not create fake buttons, fake persistence, fake authentication, or fake API behavior.
7. Never embed secrets. Use environment-variable placeholders where needed.
8. Include OPEN_SOURCE_COMPONENTS.md documenting significant dependencies/references, repository, version if known, license, purpose, integration method, and modifications.
9. Include README.md with setup, architecture, environment variables, build/test commands, and deployment notes.
10. Include a verification plan. Do not claim tests/builds have passed because you cannot execute the generated project here.

Return STRICT JSON only, with this exact top-level shape:
{
  "summary": "short summary",
  "files": [{"path":"relative/path","content":"complete UTF-8 file contents"}],
  "open_source_components": [{"name":"...","repository":"...","license":"...","purpose":"...","integration_method":"..."}],
  "verification_commands": ["..."],
  "limitations": ["..."]
}

Keep the bundle practical and compact: maximum 35 files. Prefer a simple compatible stack over unnecessary complexity. Every interactive feature you include must be implemented in the generated files.`;

  const user = `PROJECT NAME:
${projectName}

APPLICATION BRIEF:
${brief}

STACK PREFERENCES:
${stackPreferences || "No explicit preference. Choose a maintainable stack compatible with the deployment target."}

DEPLOYMENT TARGET:
${deploymentTarget}

OPEN-SOURCE RESEARCH CANDIDATES:
${JSON.stringify(researchContext, null, 2)}

INTEGRATION DECISIONS:
${JSON.stringify(decisionContext, null, 2)}

Generate the complete source bundle. If the selected research is insufficient, implement application-specific code yourself rather than silently copying unverified code. Mark any unverified external assumption in README.md and OPEN_SOURCE_COMPONENTS.md.`;

  const hfResponse = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.2,
      max_tokens: 12000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!hfResponse.ok) {
    const detail = await hfResponse.text();
    return json({
      error: "Hugging Face generation request failed.",
      status: hfResponse.status,
      detail: detail.slice(0, 800),
    }, hfResponse.status === 401 || hfResponse.status === 403 ? 401 : 502);
  }

  const payload = await hfResponse.json();
  const message = payload?.choices?.[0]?.message?.content;
  if (typeof message !== "string" || !message.trim()) {
    return json({ error: "The model returned no usable content." }, 502);
  }

  let bundle: any;
  try {
    bundle = extractJson(message);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid model output." }, 502);
  }

  if (!bundle || typeof bundle !== "object" || !Array.isArray(bundle.files)) {
    return json({ error: "Generated bundle is missing a files array." }, 502);
  }
  if (bundle.files.length < 2 || bundle.files.length > 35) {
    return json({ error: "Generated bundle must contain 2-35 files." }, 502);
  }

  let totalChars = 0;
  let files: Array<{ path: string; content: string }>;
  try {
    files = bundle.files.map((file: any) => {
      const path = String(file?.path || "");
      const content = String(file?.content ?? "");
      if (!validPath(path)) throw new Error(`Unsafe or invalid generated path: ${path}`);
      if (content.length > 100_000) throw new Error(`Generated file is too large: ${path}`);
      totalChars += content.length;
      return { path, content };
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid generated files." }, 502);
  }

  if (totalChars > 700_000) {
    return json({ error: "Generated source bundle is too large." }, 502);
  }

  const required = new Set(files.map((file) => file.path));
  if (!required.has("README.md") || !required.has("OPEN_SOURCE_COMPONENTS.md")) {
    return json({ error: "Generated bundle must include README.md and OPEN_SOURCE_COMPONENTS.md." }, 502);
  }

  return json({
    summary: String(bundle.summary || "Generated application source bundle"),
    files,
    open_source_components: Array.isArray(bundle.open_source_components) ? bundle.open_source_components : [],
    verification_commands: Array.isArray(bundle.verification_commands) ? bundle.verification_commands : [],
    limitations: Array.isArray(bundle.limitations) ? bundle.limitations : [],
    verification_state: "unverified",
    model,
    provider: "huggingface-inference-providers",
  });
});
