import { PDFParse } from "pdf-parse";

PDFParse.setWorker("https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs");

const LLAMA_PARSE_BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";
const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 180000;

function readEnv(name) {
  return typeof import.meta !== "undefined"
    ? import.meta.env?.[name]
    : undefined;
}

const LLAMA_PARSE_INSTRUCTION = [
  "Extract the PDF into high-quality markdown.",
  "Preserve headings, lists, and semantic ordering.",
  "Render tables as valid markdown tables whenever possible.",
  "Preserve inline LaTeX as $...$ and display LaTeX as $$...$$.",
  "Do not paraphrase or summarize the source.",
  "Keep formula notation intact and do not flatten subscripts or superscripts."
].join(" ");

async function normalizePdfInput(input, fileName) {
  let bytes;

  if (input instanceof Blob) {
    bytes = new Uint8Array(await input.arrayBuffer());
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    throw new Error("Unsupported PDF input type.");
  }

  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  const file = new File([arrayBuffer], fileName, { type: "application/pdf" });
  return { file, bytes };
}

async function pollLlamaParseJob(jobId, apiKey, pollIntervalMs, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`${LLAMA_PARSE_BASE_URL}/job/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`LlamaParse status check failed: ${response.statusText}`);
    }

    const payload = await response.json();

    if (payload.status === "SUCCESS") return;
    if (payload.status === "FAILED") {
      throw new Error(payload.error ?? "LlamaParse job failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("LlamaParse job timed out.");
}

async function parseWithLlamaParse(file, options) {
  const apiKey =
    readEnv("LLAMA_PARSE_API_KEY") ?? readEnv("VITE_LLAMA_PARSE_API_KEY");

  if (!apiKey) throw new Error("LLAMA_PARSE_API_KEY is not configured.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("result_type", "markdown");
  formData.append("auto_mode", "true");
  formData.append("premium_mode", "true");
  formData.append("parsing_instruction", LLAMA_PARSE_INSTRUCTION);
  formData.append("language", "en");
  formData.append("agentic_extraction", "true");
  formData.append("extract_tables", "true");

  const uploadResponse = await fetch(`${LLAMA_PARSE_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: "application/json"
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`LlamaParse upload failed: ${uploadResponse.statusText}`);
  }

  const uploadPayload = await uploadResponse.json();
  if (!uploadPayload.id) throw new Error("LlamaParse did not return a job id.");

  await pollLlamaParseJob(
    uploadPayload.id,
    apiKey,
    options.pollIntervalMs,
    options.timeoutMs
  );

  const resultResponse = await fetch(
    `${LLAMA_PARSE_BASE_URL}/job/${uploadPayload.id}/result/markdown`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json"
      }
    }
  );

  if (!resultResponse.ok) {
    throw new Error(`LlamaParse markdown fetch failed: ${resultResponse.statusText}`);
  }

  const resultPayload = await resultResponse.json();
  if (!resultPayload.markdown?.trim()) {
    throw new Error("LlamaParse returned empty markdown.");
  }

  return {
    markdown: resultPayload.markdown,
    source: "llama-parse",
    metadata: {
      pages: resultPayload.job_metadata?.job_pages,
      creditsUsed: resultPayload.job_metadata?.credits_used,
      cacheHit: resultPayload.job_metadata?.job_is_cache_hit
    }
  };
}

function stringifyTables(pages) {
  const tableBlocks = [];

  for (const page of pages) {
    page.tables.forEach((table, tableIndex) => {
      if (!table.length) return;

      const normalizedRows = table.map((row) =>
        row.map((cell) => cell.replace(/\r?\n/g, " ").trim())
      );

      const [header, ...rows] = normalizedRows;
      const headerLine = `| ${header.join(" | ")} |`;
      const separatorLine = `| ${header.map(() => "---").join(" | ")} |`;
      const rowLines = rows.map((row) => `| ${row.join(" | ")} |`);

      tableBlocks.push(
        [
          `### Table ${tableIndex + 1} (Page ${page.num})`,
          headerLine,
          separatorLine,
          ...rowLines
        ].join("\n")
      );
    });
  }

  return tableBlocks.join("\n\n");
}

async function parseWithPdfParse(bytes) {
  let textResult;
  const textParser = new PDFParse({ data: bytes.slice() });
  try {
    textResult = await textParser.getText({
      pageJoiner: "\n\n--- Page page_number of total_number ---\n\n"
    });
  } finally {
    await textParser.destroy();
  }

  let tableResult;
  const tableParser = new PDFParse({ data: bytes.slice() });
  try {
    tableResult = await tableParser.getTable();
  } finally {
    await tableParser.destroy();
  }

  const tableMarkdown = stringifyTables(tableResult.pages);
  const markdown = [textResult.text.trim(), tableMarkdown.trim()]
    .filter(Boolean)
    .join("\n\n");

  if (!markdown) throw new Error("pdf-parse returned no text.");

  return {
    markdown,
    source: "pdf-parse",
    metadata: { pages: textResult.total }
  };
}

export async function parsePdfToMarkdown(input, options = {}) {
  const normalized = await normalizePdfInput(
    input,
    options.fileName ?? "document.pdf"
  );

  try {
    return await parseWithLlamaParse(normalized.file, {
      pollIntervalMs: options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    });
  } catch {
    return parseWithPdfParse(normalized.bytes);
  }
}
