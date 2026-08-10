import OpenAI from "openai";

import type {
  SummarizeRequest,
  SummarizeResponse
} from "../shared/types";

const OPENAI_API_KEY_STORAGE_KEY = "openaiApiKey";

chrome.runtime.onInstalled.addListener(() => {
  console.log("X-Ray extension installed.");
});

chrome.runtime.onMessage.addListener(
  (
    message: SummarizeRequest,
    _sender,
    sendResponse: (response: SummarizeResponse) => void
  ) => {
    if (message.type !== "SUMMARIZE_TERM") {
      return;
    }

    summarizeContexts(message)
      .then(sendResponse)
      .catch((error) => {
        console.error("X-Ray summary error:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Unable to generate summary.";

        sendResponse({
          overallSummary: message,
          summaries: []
        });
      });

    return true;
  }
);

async function getOpenAiApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(
    OPENAI_API_KEY_STORAGE_KEY
  );

  const apiKey = result[
    OPENAI_API_KEY_STORAGE_KEY
  ];

  if (
    typeof apiKey !== "string" ||
    apiKey.trim().length === 0
  ) {
    throw new Error(
      "No OpenAI API key is configured. Open X-Ray Settings and add your API key."
    );
  }

  return apiKey.trim();
}

async function summarizeContexts(
  request: SummarizeRequest
): Promise<SummarizeResponse> {
  const apiKey = await getOpenAiApiKey();

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const contextText = request.contexts
    .map(context => {
      const passages = context.passages
        .map(
          passage =>
            `[${passage.id}] ${passage.text}`
        )
        .join("\n\n");

      return `
CONTEXT ${context.id}

${passages}
`;
    })
    .join("\n\n");

  const response = await client.responses.create({
    model: "gpt-5-mini",

    input: `
You are analyzing how a selected term is used in one document.

Selected term:
"${request.term}"

First, write an OVERALL SUMMARY explaining how the document uses the selected term across the supplied contexts.

The overall summary should:
- Synthesize the major ways the term is used.
- Identify recurring meanings, roles, themes, definitions, or relationships.
- Use only the supplied contexts.
- Not add outside knowledge.
- Be concise.

Then, for EACH context separately:
- Explain what the selected term means or is doing in that context.
- Use only that context's supplied passages.
- Do not combine information from other contexts.
- Do not add outside knowledge.
- Be concise.
- If the context does not provide enough information, say so.

Return ONLY valid JSON in exactly this shape:

{
  "overallSummary": "...",
  "summaries": [
    {
      "contextId": 1,
      "summary": "..."
    }
  ]
}

Contexts:

${contextText}
`
  });

  const parsed = JSON.parse(
    response.output_text
  );

  return {
    overallSummary:
      parsed.overallSummary,
    summaries:
      parsed.summaries
  };
}