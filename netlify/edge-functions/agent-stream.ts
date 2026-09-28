import type { Context } from "https://edge.netlify.com/v1/index.ts";

// Runs at the edge (Deno runtime, no Lambda buffering / 30s hard timeout) so the
// Discovery Engine response can be piped straight through to the client as it
// streams in, instead of being fully buffered by a classic Netlify Function.
export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Permintaan tidak sah.");
  }

  const question = body?.question || body?.query || "";
  if (!question || typeof question !== "string" || !question.trim()) {
    return jsonError(400, "Sila masukkan soalan yang sah.");
  }

  const clientId = Netlify.env.get("oauth_client_id") || Netlify.env.get("OAUTH_CLIENT_ID");
  const clientSecret = Netlify.env.get("oauth_client_secret") || Netlify.env.get("OAUTH_CLIENT_SECRET");
  const refreshToken = Netlify.env.get("oauth_refresh_token") || Netlify.env.get("OAUTH_REFRESH_TOKEN");
  const projectNumber = Netlify.env.get("PROJECT_NUMBER") || Netlify.env.get("project_number");
  const engineId = Netlify.env.get("ENGINE_ID") || Netlify.env.get("engine_id");
  const assistantId = Netlify.env.get("ASSISTANT_ID") || Netlify.env.get("assistant_id");
  const agentId = Netlify.env.get("AGENT_ID") || Netlify.env.get("agent_id");

  if (!clientId || !clientSecret || !refreshToken) {
    return jsonError(500, "Konfigurasi OAuth (oauth_client_id, oauth_client_secret, oauth_refresh_token) tiada dalam Secrets.");
  }
  if (!projectNumber || !engineId || !assistantId || !agentId) {
    return jsonError(500, "Konfigurasi Discovery Engine (PROJECT_NUMBER, ENGINE_ID, ASSISTANT_ID, AGENT_ID) tiada dalam Secrets.");
  }

  // Step 1: Exchange refresh token for a fresh OAuth2 access token on every request.
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!tokenResponse.ok) {
    console.error("[Token Exchange Error]:", tokenResponse.status, await tokenResponse.text());
    return jsonError(401, "Your access token has expired — ask your facilitator for a new one.");
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return jsonError(401, "Your access token has expired — ask your facilitator for a new one.");
  }

  // Step 2: Build the prompt with history / attached files, same shape as the Node route.
  let promptWithContext = question.trim();
  const history = body?.history;
  if (Array.isArray(history) && history.length > 0) {
    const recentTurns = history.slice(-8);
    const formattedHistory = recentTurns
      .map((m: any) => {
        const roleName = m.role === "user" ? "Pengguna" : "Ejen Gemini Enterprise";
        const textContent = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        return `${roleName}: ${textContent.trim()}`;
      })
      .join("\n\n");
    promptWithContext = `[Konteks Dialog Terdahulu]:\n${formattedHistory}\n\n[Soalan Terkini Pengguna]:\n${question.trim()}`;
  }

  const attachedFiles = body?.attachedFiles;
  if (Array.isArray(attachedFiles) && attachedFiles.length > 0) {
    const filesContext = attachedFiles
      .map((f: any, idx: number) => {
        const fileName = f.name || `Lampiran_${idx + 1}`;
        const fileType = f.type || "Dokumen";
        const fileSize = f.size ? ` (${f.size})` : "";
        const content = f.content ? `\nKandungan Fail:\n${String(f.content).slice(0, 20000)}` : "\n(Lampiran dokumen rujukan)";
        return `--- [Lampiran Fail #${idx + 1}: ${fileName}${fileSize} | Jenis: ${fileType}] ---${content}`;
      })
      .join("\n\n");
    promptWithContext = `${promptWithContext}\n\n[Konteks Dokumen / Fail Yang Dilampirkan Oleh Pengguna]:\n${filesContext}`;
  }

  const assistPayload: Record<string, any> = {
    query: { text: promptWithContext },
    agentsSpec: { agentSpecs: [{ agentId }] }
  };

  const sessionCandidate = body?.discoverySession || body?.session;
  if (
    typeof sessionCandidate === "string" &&
    sessionCandidate.startsWith("projects/") &&
    sessionCandidate.includes("/sessions/")
  ) {
    assistPayload.session = sessionCandidate.trim();
  }

  // Step 3: Call streamAssist and pipe its body straight through to the client.
  const endpoint = `https://discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/global/collections/default_collection/engines/${engineId}/assistants/${assistantId}:streamAssist`;

  const discoveryResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(assistPayload)
  });

  if (!discoveryResponse.ok || !discoveryResponse.body) {
    const discErr = await discoveryResponse.text().catch(() => "");
    console.error("[Discovery Engine Error]:", discoveryResponse.status, discErr);
    if (discoveryResponse.status === 401 || discoveryResponse.status === 403) {
      return jsonError(discoveryResponse.status, "Your access token has expired — ask your facilitator for a new one.");
    }
    return jsonError(discoveryResponse.status || 502, "No response was generated. Try rephrasing your question.");
  }

  return new Response(discoveryResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export const config = {
  path: "/api/agent/stream"
};
