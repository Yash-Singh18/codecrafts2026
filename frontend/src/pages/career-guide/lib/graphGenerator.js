const allowedDomains = new Set(["science", "commerce", "arts"]);
const allowedLevels = new Set(["basics", "core", "strong"]);

function safeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDomain(value) {
  if (typeof value !== "string") return undefined;
  const n = value.toLowerCase();
  return allowedDomains.has(n) ? n : undefined;
}

function normalizeLevel(value) {
  if (typeof value !== "string") return undefined;
  const n = value.toLowerCase();
  return allowedLevels.has(n) ? n : undefined;
}

function extractJsonObject(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return a valid JSON object.");
  }
  return raw.slice(start, end + 1);
}

export function normalizeGeneratedGraph(input) {
  const raw = input;
  if (!Array.isArray(raw?.nodes) || raw.nodes.length === 0) {
    throw new Error("Generated graph did not include any nodes.");
  }

  const nodes = raw.nodes.map((node, index) => {
    const type =
      typeof node.type === "string" &&
      ["nexus", "stream", "domain", "career"].includes(node.type)
        ? node.type
        : index === 0 ? "nexus" : "domain";

    return {
      id: typeof node.id === "string" && node.id.trim() ? node.id : safeId("node"),
      label: typeof node.label === "string" && node.label.trim() ? node.label.trim() : `Topic ${index + 1}`,
      type,
      domain: normalizeDomain(node.domain),
      parentId: typeof node.parentId === "string" && node.parentId.trim() ? node.parentId : undefined,
      level: normalizeLevel(node.level),
      description: typeof node.description === "string" && node.description.trim() ? node.description.trim() : undefined,
      icon: typeof node.icon === "string" && node.icon.trim() ? node.icon.trim() : undefined,
      duration: typeof node.duration === "string" && node.duration.trim() ? node.duration.trim() : undefined,
    };
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges = Array.isArray(raw.edges)
    ? raw.edges
        .map((edge) => ({
          id: typeof edge.id === "string" && edge.id.trim() ? edge.id : safeId("edge"),
          source: typeof edge.source === "string" && edge.source.trim() ? edge.source : "",
          target: typeof edge.target === "string" && edge.target.trim() ? edge.target : "",
          type: edge.type === "impactEdge" ? "impactEdge" : "default",
          label: typeof edge.label === "string" && edge.label.trim() ? edge.label.trim() : undefined,
          description: typeof edge.description === "string" && edge.description.trim() ? edge.description.trim() : undefined,
        }))
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    : [];

  for (const node of nodes) {
    if (
      node.parentId &&
      nodeIds.has(node.parentId) &&
      !edges.some((e) => e.type !== "impactEdge" && e.source === node.parentId && e.target === node.id)
    ) {
      edges.push({ id: `auto-${node.parentId}-${node.id}`, source: node.parentId, target: node.id, type: "default" });
    }
  }

  return { nodes, edges };
}

export async function generateGraphFromPrompt(prompt) {
  const response = await fetch("/api/groq/generate-graph", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to generate roadmap.");
  }

  const responseText = await response.text();
  const payload = JSON.parse(responseText);
  if (payload.graph) return normalizeGeneratedGraph(payload.graph);
  if (payload.raw) return normalizeGeneratedGraph(JSON.parse(extractJsonObject(payload.raw)));
  throw new Error("Roadmap generation response was empty.");
}
