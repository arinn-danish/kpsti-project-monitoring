import express from "express";
import dotenv from "dotenv";

dotenv.config();

export const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Server-side route for AI Document & Minutes Extraction
app.post("/api/extract-document", async (req, res) => {
  try {
    const documentText = req.body?.text || "";
    const fileName = req.body?.fileName || "Dokumen_KPSTI.pdf";

    if (!documentText || typeof documentText !== "string" || !documentText.trim()) {
      return res.status(400).json({ error: "Tiada teks dokumen dibekalkan untuk pengekstrakan." });
    }

    // 6 Official KPSTI Departments
    const officialDepts = [
      "Bahagian Pendidikan (BP)",
      "Bahagian Inovasi dan Digital (BID)",
      "Bahagian Infrastruktur ICT dan EGS (BIIE)",
      "Bahagian TVET dan Pemantauan Projek (BTPP)",
      "Bahagian Pengurusan Sumber Manusia dan Pentadbiran (BPSMP)",
      "Bahagian Akaun (BA)"
    ];

    let extractedData: any = null;

    // Attempt Gemini AI extraction if GEMINI_API_KEY exists
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Anda adalah Ejen AI Eksekutif bagi Kementerian Pendidikan, Sains, Teknologi dan Inovasi Sabah (KPSTI).
Analisis teks dokumen / minit mesyuarat berikut dan ekstrak maklumat projek pembangunan ke dalam format JSON yang tepat:

Teks Dokumen:
"""
${documentText.slice(0, 15000)}
"""

Pastikan medan berikut diekstrak dengan tepat:
- title: Tajuk penuh projek yang dibincangkan
- description: Ringkasan objektif projek
- department: MESTI dipilih daripada salah satu daripada 6 bahagian rasmi KPSTI berikut:
  1. "Bahagian Pendidikan (BP)"
  2. "Bahagian Inovasi dan Digital (BID)"
  3. "Bahagian Infrastruktur ICT dan EGS (BIIE)"
  4. "Bahagian TVET dan Pemantauan Projek (BTPP)"
  5. "Bahagian Pengurusan Sumber Manusia dan Pentadbiran (BPSMP)"
  6. "Bahagian Akaun (BA)"
- officer: Nama pegawai bertanggungjawab atau pegawai meja
- year: Tahun pelaksanaan (cth: 2026 atau integer)
- ceiling: Nilai siling projek dalam angka (RM)
- annualAllocation: Peruntukan tahunan diluluskan (RM)
- projectedSpend: Unjuran belanja semasa (RM)
- actualSpend: Belanja sebenar terkini (RM)
- physicalProgress: Kemajuan fizikal dalam peratusan 0-100 (angka integer)
- status: Status projek ("Dalam Pelaksanaan", "Tertangguh/Lewat", "Selesai", atau "Dalam Perancangan")
- startDate: Tarikh mula format YYYY-MM-DD (jika tidak dinyatakan, anggap 2026-01-15)
- endDate: Tarikh tamat format YYYY-MM-DD (jika tidak dinyatakan, anggap 2026-12-31)
- issues: Isu atau kekangan pelaksanaan yang dinyatakan
- remarks: Catatan tindakan susulan atau ulasan mesyuarat

Balas HANYA dengan JSON objek yang sah tanpa markdown atau format lain.`;

        const aiResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const rawText = aiResp.text?.trim();
        if (rawText) {
          extractedData = JSON.parse(rawText);
        }
      } catch (geminiErr) {
        console.warn("[Document Extraction] Gemini API extraction fallback:", geminiErr);
      }
    }

    // Fallback: Comprehensive Government Document NLP Parser
    if (!extractedData) {
      const text = documentText;

      // Title Extraction
      let title = "Projek Pembangunan KPSTI";
      const titleMatch = text.match(/(?:Nama Projek|Tajuk Projek|Projek|Agenda\s*[\d.]*\s*:?)\s*[:\-]\s*([^\n\r]+)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim().replace(/^[-–—]\s*/, "");
      } else {
        const firstMeaningfulLine = text.split("\n").find(l => l.trim().length > 15 && !l.toLowerCase().includes("minit mesyuarat") && !l.toLowerCase().includes("tarikh:"));
        if (firstMeaningfulLine) title = firstMeaningfulLine.trim();
      }

      // Department Matching
      let department = officialDepts[1]; // Default BID
      const lower = text.toLowerCase();
      if (lower.includes("pendidikan") || lower.includes("(bp)") || lower.includes("sekolah")) {
        department = officialDepts[0];
      } else if (lower.includes("inovasi") || lower.includes("digital") || lower.includes("(bid)") || lower.includes("ai") || lower.includes("robotik")) {
        department = officialDepts[1];
      } else if (lower.includes("infrastruktur") || lower.includes("ict") || lower.includes("egs") || lower.includes("(biie)") || lower.includes("rangkaian") || lower.includes("pusat data")) {
        department = officialDepts[2];
      } else if (lower.includes("tvet") || lower.includes("pemantauan projek") || lower.includes("(btpp)") || lower.includes("kemahiran")) {
        department = officialDepts[3];
      } else if (lower.includes("sumber manusia") || lower.includes("pentadbiran") || lower.includes("(bpsmp)") || lower.includes("latihan staf")) {
        department = officialDepts[4];
      } else if (lower.includes("akaun") || lower.includes("(ba)") || lower.includes("kewangan") || lower.includes("rekonsiliasi")) {
        department = officialDepts[5];
      }

      // Officer Extraction
      let officer = "Puan Noor Azlina binti Rashid";
      const officerMatch = text.match(/(?:Pegawai Meja|Pegawai Bertanggungjawab|Pegawai|Disediakan oleh|Pelapor)\s*[:\-]\s*([^\n\r,]+)/i);
      if (officerMatch && officerMatch[1]) {
        officer = officerMatch[1].trim();
      }

      // Year Extraction
      let year = 2026;
      const yearMatch = text.match(/\b(202[3-9])\b/);
      if (yearMatch) year = parseInt(yearMatch[1]);

      // Monetary Extraction helper
      const parseMoney = (regex: RegExp, fallback: number) => {
        const match = text.match(regex);
        if (match && match[1]) {
          const clean = match[1].replace(/,/g, "").trim();
          const num = parseFloat(clean);
          if (!isNaN(num)) return num;
        }
        return fallback;
      };

      const ceiling = parseMoney(/(?:Siling(?:\s*Projek)?)\s*[:\-]?\s*(?:RM)?\s*([\d,]+(?:\.\d{2})?)/i, 2500000);
      const annualAllocation = parseMoney(/(?:Peruntukan(?:\s*Tahunan)?(?:\s*Diluluskan)?)\s*[:\-]?\s*(?:RM)?\s*([\d,]+(?:\.\d{2})?)/i, 1000000);
      const projectedSpend = parseMoney(/(?:Unjuran(?:\s*Perbelanjaan)?)\s*[:\-]?\s*(?:RM)?\s*([\d,]+(?:\.\d{2})?)/i, 950000);
      const actualSpend = parseMoney(/(?:Perbelanjaan\s*Sebenar|Belanja\s*Sebenar)\s*[:\-]?\s*(?:RM)?\s*([\d,]+(?:\.\d{2})?)/i, 820000);

      // Progress Extraction
      let physicalProgress = 75;
      const progressMatch = text.match(/(?:Kemajuan\s*Fizikal|Fizikal)\s*[:\-]?\s*(\d{1,3})\s*%/i);
      if (progressMatch) {
        physicalProgress = Math.min(100, Math.max(0, parseInt(progressMatch[1])));
      }

      // Status Extraction
      let status = "Dalam Pelaksanaan";
      if (lower.includes("selesai") || lower.includes("siap sepenuhnya")) {
        status = "Selesai";
      } else if (lower.includes("tertangguh") || lower.includes("lewat") || lower.includes("tergendala")) {
        status = "Tertangguh/Lewat";
      } else if (lower.includes("perancangan") || lower.includes("draf")) {
        status = "Dalam Perancangan";
      }

      // Issues Extraction
      let issues = "Tiada isu kritikal dilaporkan.";
      const issuesMatch = text.match(/(?:Isu(?:\s*dan\s*Kekangan)?|Kekangan|Halangan)\s*[:\-]\s*([^\n\r]+)/i);
      if (issuesMatch && issuesMatch[1]) {
        issues = issuesMatch[1].trim();
      }

      // Remarks Extraction
      let remarks = "Pelaksanaan mengikut perancangan dan garis panduan KPSTI.";
      const remarksMatch = text.match(/(?:Catatan(?:\s*Penyelarasan)?|Ulasan|Tindakan Susulan)\s*[:\-]\s*([^\n\r]+)/i);
      if (remarksMatch && remarksMatch[1]) {
        remarks = remarksMatch[1].trim();
      }

      extractedData = {
        title,
        description: text.slice(0, 300).trim(),
        department,
        officer,
        year,
        ceiling,
        annualAllocation,
        projectedSpend,
        actualSpend,
        physicalProgress,
        status,
        startDate: `${year}-01-15`,
        endDate: `${year}-12-15`,
        issues,
        remarks
      };
    }

    // Enforce valid department
    if (!officialDepts.includes(extractedData.department)) {
      extractedData.department = officialDepts[1];
    }

    return res.json({
      success: true,
      fileName,
      extracted: extractedData
    });
  } catch (err: any) {
    console.error("[Server Error /api/extract-document]:", err);
    return res.status(500).json({ error: err?.message || "Ralat memproses pengekstrakan dokumen." });
  }
});

// Server-side route to proxy Gemini Enterprise / Discovery Engine Agent
app.post("/api/agent/stream", async (req, res) => {
  try {
    const question = req.body?.question || req.body?.query || "";
    const history = req.body?.history;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Sila masukkan soalan yang sah." });
    }

    // Read credentials from server-side environment secrets
    const clientId = process.env.oauth_client_id || process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.oauth_client_secret || process.env.OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.oauth_refresh_token || process.env.OAUTH_REFRESH_TOKEN;
    const projectNumber = process.env.PROJECT_NUMBER || process.env.project_number;
    const engineId = process.env.ENGINE_ID || process.env.engine_id;
    const assistantId = process.env.ASSISTANT_ID || process.env.assistant_id;
    const agentId = process.env.AGENT_ID || process.env.agent_id;

    if (!clientId || !clientSecret || !refreshToken) {
      console.error("[OAuth Error] Missing OAuth credentials in server environment");
      return res.status(500).json({
        error: "Konfigurasi OAuth (oauth_client_id, oauth_client_secret, oauth_refresh_token) tiada dalam Secrets."
      });
    }

    if (!projectNumber || !engineId || !assistantId || !agentId) {
      console.error("[Discovery Engine Error] Missing engine/agent parameters in server environment");
      return res.status(500).json({
        error: "Konfigurasi Discovery Engine (PROJECT_NUMBER, ENGINE_ID, ASSISTANT_ID, AGENT_ID) tiada dalam Secrets."
      });
    }

    // Step 1: Exchange refresh token for a fresh OAuth2 access token via Google's token endpoint
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
      const tokenErr = await tokenResponse.text();
      console.error("[Token Exchange Error]:", tokenResponse.status, tokenErr);
      return res.status(401).json({
        error: "Your access token has expired — ask your facilitator for a new one.",
        details: tokenErr
      });
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(401).json({
        error: "Your access token has expired — ask your facilitator for a new one."
      });
    }

    // Step 2: Call the streamAssist endpoint with the fresh access token
    const endpoint = `https://discoveryengine.googleapis.com/v1alpha/projects/${projectNumber}/locations/global/collections/default_collection/engines/${engineId}/assistants/${assistantId}:streamAssist`;

    let promptWithContext = question.trim();
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

    const attachedFiles = req.body?.attachedFiles;
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
      agentsSpec: {
        agentSpecs: [{ agentId: agentId }]
      }
    };

    const sessionCandidate = req.body?.discoverySession || req.body?.session;
    if (
      sessionCandidate &&
      typeof sessionCandidate === "string" &&
      sessionCandidate.startsWith("projects/") &&
      sessionCandidate.includes("/sessions/")
    ) {
      assistPayload.session = sessionCandidate.trim();
    }

    const discoveryResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(assistPayload)
    });

    if (!discoveryResponse.ok) {
      const discErr = await discoveryResponse.text();
      console.error("[Discovery Engine Error]:", discoveryResponse.status, discErr);
      if (discoveryResponse.status === 401 || discoveryResponse.status === 403) {
        return res.status(discoveryResponse.status).json({
          error: "Your access token has expired — ask your facilitator for a new one."
        });
      }
      return res.status(discoveryResponse.status).json({
        error: "No response was generated. Try rephrasing your question.",
        details: discErr
      });
    }

    // Step 3: Stream response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    if (discoveryResponse.body) {
      const reader = discoveryResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("[Server Error /api/agent/stream]:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal Server Error" });
    } else {
      res.end();
    }
  }
});
