import type {
  ContextGroup,
  SummarizeResponse
} from "../shared/types";

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeCacheKey(
  url: string,
  term: string,
  contexts: ContextGroup[]
): Promise<string> {
  const contextText = contexts
    .flatMap(context => context.passages)
    .map(passage => passage.text)
    .join("\n");

  const contentHash = await hashText(contextText);

  return [
    "xray",
    url,
    term.toLowerCase(),
    contentHash
  ].join("::");
}

export async function getCachedSummary(
  key: string
): Promise<SummarizeResponse | null> {
  const result = await chrome.storage.local.get(key);

  return result[key] ?? null;
}

export async function setCachedSummary(
  key: string,
  response: SummarizeResponse
): Promise<void> {
  await chrome.storage.local.set({
    [key]: response
  });
}