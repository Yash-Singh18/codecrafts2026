import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const GROQ_LARGE_MODEL = "llama-3.3-70b-versatile";

function buildPrompt(selection) {
  if (selection.kind === "edge") {
    return [
      `Cross-domain career link: "${selection.sourceLabel}" → "${selection.targetLabel}"`,
      `Link name: ${selection.label}`,
      selection.description ? `Context: ${selection.description}` : "",
      "Instructions:",
      "1. In 2-3 sentences, explain how mastering the SOURCE subject makes students significantly more effective in the TARGET field.",
      "2. Give one specific real-world example of a professional who leveraged this exact cross-domain skill.",
      "3. Give one actionable step a student can take TODAY to start building this bridge.",
      "Keep it motivating, concrete, and under 120 words total."
    ].filter(Boolean).join("\n");
  }

  return [
    `Career node: "${selection.label}"`,
    selection.level ? `Stage in roadmap: ${selection.level === "basics" ? "Foundation (early stage)" : selection.level === "core" ? "Core Path (mid stage)" : "Advanced (peak specialisation)"}` : "",
    selection.duration ? `Typical duration: ${selection.duration}` : "",
    selection.description ? `Description: ${selection.description}` : "",
    selection.connectedLabels?.length ? `Leads to or connects with: ${selection.connectedLabels.slice(0, 5).join(", ")}` : "",
    "Instructions:",
    "1. Explain why this is a crucial milestone for an Indian student in 2-3 sentences.",
    "2. Describe what specific skills or exams the student needs to clear to reach this node.",
    "3. Mention 1-2 top career outcomes or salary benchmarks a student can expect after mastering this.",
    "4. Keep it motivating, direct, and under 130 words."
  ].filter(Boolean).join("\n");
}

function buildGraphPrompt(prompt) {
  return [
    "Generate a detailed Indian student roadmap as strict JSON only.",
    '{ "nodes": [{ "id": "string", "label": "string", "type": "nexus|stream|domain|career", "domain": "science|commerce|arts", "parentId": "string", "level": "basics|core|strong", "description": "string", "icon": "string", "duration": "string" }], "edges": [{ "id": "string", "source": "string", "target": "string", "type": "default|impactEdge", "label": "string", "description": "string" }] }',
    "Rules:",
    "1. Include exactly one root nexus node that represents the student goal.",
    "2. Use only the domains science, commerce, and arts.",
    "3. Include at least 14 nodes total and enough parentId links to form a roadmap.",
    "4. Impact edges should be used only for cross-domain bridges.",
    "5. Make the roadmap concrete and explorable for Indian students.",
    "6. Prefer clear parent-child progression: stream -> foundation -> path -> career outcome.",
    "7. Use concise labels and useful descriptions.",
    "8. Return raw JSON only. No markdown, no explanation.",
    `User request: ${prompt}`
  ].join("\n");
}

function buildDomainSystemPrompt(domain) {
  if (!domain) {
    return `You are an expert Indian academic and career roadmap strategist.
Help students understand streams, sub-streams, entrance exams, degrees, and career outcomes across science, commerce, arts, technology, medicine, finance, law, design, and public careers.
When describing roadmaps, use the format: Step A -> Step B -> Step C where useful.
Be concrete, student-friendly, and concise. Max 160 words per response.`;
  }

  const prompts = {
    science: `You are an expert Indian STEM career counsellor specialising in Science students.
You know IIT-JEE, NEET, GATE, NDA, B.Tech, MBBS, M.Tech, AI/ML careers and research.
When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains.
Always mention specific exams, institutes, and realistic salary ranges in INR.
Be encouraging, specific, and concise. Max 150 words per response.`,
    commerce: `You are an expert Indian Commerce career counsellor.
You know CA, MBA (CAT/GMAT), banking (IBPS, SBI PO, RBI), LLB, BBA, B.Com, and entrepreneurship.
When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains.
Always mention specific exams, institutes, and realistic salary ranges in INR.
Be encouraging, specific, and concise. Max 150 words per response.`,
    arts: `You are an expert Indian Humanities and Arts career counsellor.
You know UPSC/IAS, UX Design, Journalism, Psychology, Law (CLAT), and Mass Communication.
When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains.
Always mention specific exams, institutes, and realistic salary ranges in INR.
Be encouraging, specific, and concise. Max 150 words per response.`
  };

  return prompts[domain];
}

function extractJsonObject(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Model did not return valid JSON.");
  return raw.slice(start, end + 1);
}

function groqStreamPlugin(groqApiKey) {
  return {
    name: "groq-stream-proxy",
    configureServer(server) {
      server.middlewares.use("/api/groq/generate-graph", async (req, res) => {
        try {
          if (req.method !== "POST") { res.statusCode = 405; res.end("Method Not Allowed"); return; }
          if (!groqApiKey) { res.statusCode = 500; res.end("GROQ_API_KEY is not configured."); return; }

          const body = await new Promise((resolve, reject) => {
            let raw = "";
            req.on("data", (chunk) => { raw += chunk.toString(); });
            req.on("end", () => resolve(raw));
            req.on("error", reject);
          });

          const payload = JSON.parse(body);
          if (!payload.prompt?.trim()) { res.statusCode = 400; res.end("Prompt is required."); return; }

          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
            body: JSON.stringify({
              model: GROQ_LARGE_MODEL,
              temperature: 0.3,
              messages: [
                { role: "system", content: "You generate valid JSON roadmaps for interactive learning graphs. Output only JSON and keep ids concise." },
                { role: "user", content: buildGraphPrompt(payload.prompt) }
              ]
            })
          });

          if (!groqResponse.ok) { const t = await groqResponse.text(); res.statusCode = groqResponse.status; res.end(t || "Graph generation failed."); return; }

          const groqPayload = await groqResponse.json();
          const rawGraph = groqPayload.choices?.[0]?.message?.content ?? "";
          const graph = JSON.parse(extractJsonObject(rawGraph));

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ graph }));
        } catch (error) {
          res.statusCode = 500;
          res.end(error instanceof Error ? `Graph generation failed: ${error.message}` : "Graph generation failed.");
        }
      });

      server.middlewares.use("/api/groq/stream", async (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end("Method Not Allowed"); return; }
        if (!groqApiKey) { res.statusCode = 500; res.end("GROQ_API_KEY is not configured."); return; }

        const body = await new Promise((resolve, reject) => {
          let raw = "";
          req.on("data", (chunk) => { raw += chunk.toString(); });
          req.on("end", () => resolve(raw));
          req.on("error", reject);
        });

        const payload = JSON.parse(body);

        const messages = payload.mode === "chat"
          ? [
              { role: "system", content: buildDomainSystemPrompt(payload.domain) },
              ...payload.history.map((m) => ({ role: m.role, content: m.content }))
            ]
          : [
              { role: "system", content: "You are a friendly, expert Indian academic career counsellor. Your goal is to guide a student who has just clicked on a node in their career roadmap. Give specific, actionable guidance. Be encouraging, concrete, and focused on real outcomes. Always mention India-specific exams, institutes, or salary ranges where relevant." },
              { role: "user", content: buildPrompt(payload.selection) }
            ];

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
          body: JSON.stringify({ model: GROQ_LARGE_MODEL, stream: true, temperature: 0.4, messages })
        });

        if (!groqResponse.ok || !groqResponse.body) { res.statusCode = groqResponse.status; res.end("Groq request failed."); return; }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = groqResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffered += decoder.decode(value, { stream: true });
          const lines = buffered.split("\n");
          buffered = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) res.write(content);
          }
        }

        res.end();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), groqStreamPlugin(env.VITE_GROQ_API_KEY || env.GROQ_API_KEY)],
  };
});
