import type { ChatMessage, Domain, SidebarSelection } from "../types/knowledge";

async function streamFromProxy(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal: AbortSignal
) {
  const response = await fetch("/api/groq/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(errorText || `Groq proxy error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      onChunk(chunk);
    }
  }
}

export async function streamGroqInsight(
  selection: SidebarSelection,
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  await streamFromProxy(
    {
      mode: "selection",
      selection
    },
    onChunk,
    signal
  );
}

export async function streamChatMessage(
  domain: Domain | null,
  history: ChatMessage[],
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  await streamFromProxy(
    {
      mode: "chat",
      domain,
      history
    },
    onChunk,
    signal
  );
}
