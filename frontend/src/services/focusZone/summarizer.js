import Groq from "groq-sdk";
import { parsePdfToMarkdown } from "./parser";

const DEFAULT_CHUNK_TOKEN_LIMIT = 4000;
const CHARS_PER_TOKEN = 4;

const BASE_SYSTEM_PROMPT = `
Act as a World-Class Academic Tutor. Summarize the provided text for a 12th-grade student.

Requirements:
- Use exactly 2 emojis per section for visual engagement.
- Explain at least one complex concept using a gaming analogy.
- Preserve important formulas and notation when present.
- End with a 3-point Exam Cheat Sheet.
- Return Markdown only.
`.trim();

const LOGIC_MAP_SYSTEM_PROMPT = `
You are a knowledge architect. Given a study guide, produce a JSON logic map that represents the document's conceptual hierarchy as an interactive exploration tree.

Rules:
- Output ONLY valid JSON, no markdown fences, no extra text.
- The root node represents the overall topic.
- Each node has: "label" (short title, max 6 words), "detail" (1-3 sentence explanation a student would see when they click to expand), "children" (array of child nodes, can be empty).
- Aim for 3-5 top-level children, each with 2-4 children of their own. Leaf nodes can have deeper children if the content warrants it.
- Make "detail" genuinely useful: definitions, key formulas, analogies, or "why it matters" context. Not just a restatement of the label.
- Preserve any important formulas or notation in the detail field.
`.trim();

function readEnv(name) {
  return typeof import.meta !== "undefined"
    ? import.meta.env?.[name]
    : undefined;
}

function getGroqClient() {
  const apiKey = readEnv("GROQ_API_KEY") ?? readEnv("VITE_GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  return new Groq({
    apiKey,
    timeout: 20000,
    maxRetries: 2,
    dangerouslyAllowBrowser: true
  });
}

function estimateTokens(value) {
  return Math.ceil(value.length / CHARS_PER_TOKEN);
}

function splitOversizedParagraph(paragraph, limit) {
  const sentences = paragraph.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [paragraph];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (estimateTokens(candidate) > limit && current) {
      chunks.push(current.trim());
      current = sentence;
      continue;
    }
    current = candidate;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function semanticChunkMarkdown(markdown, tokenLimit = DEFAULT_CHUNK_TOKEN_LIMIT) {
  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const normalizedParagraphs = paragraphs.flatMap((p) =>
    estimateTokens(p) > tokenLimit
      ? splitOversizedParagraph(p, tokenLimit)
      : [p]
  );

  const chunks = [];
  let current = "";

  for (const paragraph of normalizedParagraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (estimateTokens(candidate) > tokenLimit && current) {
      chunks.push(current.trim());
      current = paragraph;
      continue;
    }
    current = candidate;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function buildChunkPrompt(vibe, index, total) {
  const vibeDirective =
    vibe === "expert"
      ? "Bias toward technical precision, equations, assumptions, and derivations."
      : "Bias toward intuitive explanations, analogies, and simplified scaffolding.";

  return [
    `You are summarizing chunk ${index} of ${total}.`,
    vibeDirective,
    "Extract the core claims, evidence, formulas, and transitions.",
    "Keep the response compact because a later pass will merge all chunk summaries.",
    "When formulas matter, preserve them exactly."
  ].join(" ");
}

async function summarizeChunk(client, chunk, vibe, index, total) {
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.45,
    messages: [
      { role: "system", content: BASE_SYSTEM_PROMPT },
      { role: "user", content: `${buildChunkPrompt(vibe, index, total)}\n\n${chunk}` }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function extractSectionLines(markdown, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionMatch = markdown.match(
    new RegExp(`#+\\s*${escapedHeading}[\\s\\S]*?(?=\\n#+\\s|$)`, "i")
  );

  if (!sectionMatch) return [];

  return sectionMatch[0]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim());
}

async function generateLogicMap(client, summary, vibe) {
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      { role: "system", content: LOGIC_MAP_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Create an interactive logic map for this ${vibe}-level study guide. Output ONLY the JSON object:\n\n${summary}`
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";

  try {
    // Strip markdown fences if the LLM wrapped it anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.label) return parsed;
  } catch {
    // fall through to fallback
  }

  return {
    label: "Document Overview",
    detail: "Could not generate an interactive map. See the summary above for details.",
    children: []
  };
}

async function synthesizeFinalSummary(client, chunkSummaries, vibe) {
  const vibeDirective =
    vibe === "expert"
      ? "Make the final summary technical, formula-aware, and terse."
      : "Make the final summary more analogy-heavy, welcoming, and learner-friendly.";

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.35,
    messages: [
      { role: "system", content: BASE_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          vibeDirective,
          "Merge the chunk summaries into one polished study guide.",
          "Required output structure:",
          "# Big Picture",
          "# Key Ideas",
          "# Gaming Analogy",
          "# Exam Cheat Sheet",
          "- point 1",
          "",
          chunkSummaries.join("\n\n---\n\n")
        ].join("\n")
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function summarizeMarkdown(
  markdown,
  vibe = "beginner",
  chunkTokenLimit = DEFAULT_CHUNK_TOKEN_LIMIT
) {
  const client = getGroqClient();
  const chunks = semanticChunkMarkdown(markdown, chunkTokenLimit);

  const chunkSummaries = await Promise.all(
    chunks.map((chunk, index) =>
      summarizeChunk(client, chunk, vibe, index + 1, chunks.length)
    )
  );

  const summary = await synthesizeFinalSummary(client, chunkSummaries, vibe);
  const logicMap = await generateLogicMap(client, summary, vibe);

  return {
    summary,
    logicMap,
    cheatSheet: extractSectionLines(summary, "Exam Cheat Sheet").slice(0, 3),
    chunks: chunks.length,
    source: "llama-parse"
  };
}

export async function parseAndSummarizePdf(input, options = {}) {
  const parsed = await parsePdfToMarkdown(input, {
    fileName: options.fileName
  });

  const result = await summarizeMarkdown(
    parsed.markdown,
    options.vibe ?? "beginner",
    options.chunkTokenLimit ?? DEFAULT_CHUNK_TOKEN_LIMIT
  );

  return { ...result, source: parsed.source };
}
