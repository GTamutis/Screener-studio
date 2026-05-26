type StreamEvent = {
  type?: string;
  delta?: { type?: string; text?: string };
};

function textFromLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const event = JSON.parse(trimmed) as StreamEvent;
    if (
      event.type === "content_block_delta" &&
      event.delta?.type === "text_delta" &&
      typeof event.delta.text === "string"
    ) {
      return event.delta.text;
    }
  } catch {
    return null;
  }
  return null;
}

/** Reads newline-delimited JSON events from /api/chat (Anthropic SDK stream). */
export async function* streamChatResponseText(
  body: ReadableStream<Uint8Array> | null,
): AsyncGenerator<string> {
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const text = textFromLine(line);
        if (text) yield text;
        newlineIndex = buffer.indexOf("\n");
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const text = textFromLine(tail);
      if (text) yield text;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function readChatResponseText(
  body: ReadableStream<Uint8Array> | null,
): Promise<string> {
  let text = "";
  for await (const chunk of streamChatResponseText(body)) {
    text += chunk;
  }
  return text;
}
