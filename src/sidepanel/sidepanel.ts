import type {
  Passage,
  ContextGroup,
  TermSelectedMessage,
  SummarizeRequest,
  SummarizeResponse
} from "../shared/types";

import {
  makeCacheKey,
  getCachedSummary,
  setCachedSummary
} from "../storage/cache";

console.log("X-Ray side panel loaded.");

const MAX_CONTEXTS = 20;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholeTerm(
  text: string,
  term: string
): boolean {
  const escapedTerm = escapeRegExp(term.trim());

  return new RegExp(
    `(^|\\W)${escapedTerm}(?=$|\\W)`,
    "i"
  ).test(text);
}

function getPassageNumber(passage: Passage): number {
  return Number(
    passage.id.replace("passage-", "")
  );
}

function findTargetPassage(
  context: ContextGroup,
  term: string
): Passage | undefined {
  return (
    context.passages.find(passage =>
      containsWholeTerm(passage.text, term)
    ) ?? context.passages[0]
  );
}

async function getActiveTab(): Promise<
  chrome.tabs.Tab | undefined
> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function jumpToPassage(
  passageId: string
): Promise<void> {
  const tab = await getActiveTab();

  if (!tab?.id) {
    throw new Error("No active tab found.");
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: "JUMP_TO_PASSAGE",
    passageId
  });
}

function renderResponse(
  passagesElement: HTMLElement,
  summaryElement: HTMLElement,
  response: SummarizeResponse,
  contexts: ContextGroup[]
): void {
  summaryElement.textContent =
    response.overallSummary ||
    "No overall summary was returned.";

  for (const context of contexts) {
    const section =
      passagesElement.querySelector<HTMLElement>(
        `[data-context-id="${context.id}"]`
      );

    const summary =
      section?.querySelector<HTMLElement>(
        ".context-summary"
      );

    if (!summary) {
      continue;
    }

    const result = response.summaries.find(
      item => item.contextId === context.id
    );

    if (result?.summary) {
      summary.textContent = result.summary;
      summary.classList.remove("context-error");
    } else {
      summary.textContent =
        "Could not generate an explanation for this context.";

      summary.classList.add("context-error");
    }
  }
}

async function clearCache(): Promise<void> {
  const allItems =
    await chrome.storage.local.get(null);

  const cacheKeys = Object.keys(allItems)
    .filter(key =>
      key.startsWith("xray::")
    );

  if (cacheKeys.length === 0) {
    return;
  }

  await chrome.storage.local.remove(
    cacheKeys
  );
}

chrome.runtime.onMessage.addListener(
  async (message: TermSelectedMessage) => {
    if (message.type !== "TERM_SELECTED") {
      return;
    }

    const termElement =
      document.getElementById("selected-term");

    const matchCountElement =
      document.getElementById("match-count");

    const passagesElement =
      document.getElementById("passages");

    const summaryElement =
      document.getElementById("summary");

    if (
      !termElement ||
      !matchCountElement ||
      !passagesElement ||
      !summaryElement
    ) {
      return;
    }

    // Defensive limit even if retrieval.ts changes later.
    const contexts =
      (message.contexts ?? []).slice(
        0,
        MAX_CONTEXTS
      );

    termElement.textContent = message.term;
    passagesElement.replaceChildren();

    if (contexts.length === 0) {
      matchCountElement.textContent =
        "0 contexts";

      summaryElement.textContent =
        `No relevant passages were found for "${message.term}".`;

      return;
    }

    matchCountElement.textContent =
      `${contexts.length} ${
        contexts.length === 1
          ? "context"
          : "contexts"
      }`;

    summaryElement.textContent =
      "Generating overall summary...";

    for (const context of contexts) {
      const section =
        document.createElement("section");

      section.className = "context-group";
      section.dataset.contextId =
        String(context.id);

      const targetPassage =
        findTargetPassage(
          context,
          message.term
        );

      if (targetPassage) {
        const passageNumber =
          getPassageNumber(targetPassage);

        section.title =
          `Jump to passage ${passageNumber}`;

        section.addEventListener(
          "click",
          async () => {
            try {
              await jumpToPassage(
                targetPassage.id
              );
            } catch (error) {
              console.error(
                "X-Ray could not jump to passage:",
                error
              );
            }
          }
        );
      }

      const heading =
        document.createElement("h3");

      const sourceNumber =
        targetPassage
          ? getPassageNumber(targetPassage)
          : "?";

      heading.textContent =
        `Context ${context.id} · passage ${sourceNumber}`;

      const contextSummary =
        document.createElement("p");

      contextSummary.className =
        "context-summary";

      contextSummary.textContent =
        "Generating explanation...";

      section.appendChild(heading);
      section.appendChild(contextSummary);

      passagesElement.appendChild(section);
    }

    const tab = await getActiveTab();
    const url = tab?.url ?? "";

    const cacheKey =
      await makeCacheKey(
        url,
        message.term,
        contexts
      );

    try {
      const cachedResponse =
        await getCachedSummary(cacheKey);

      if (cachedResponse) {
        renderResponse(
          passagesElement,
          summaryElement,
          cachedResponse,
          contexts
        );

        return;
      }

      const request: SummarizeRequest = {
        type: "SUMMARIZE_TERM",
        term: message.term,
        contexts
      };

      const response: SummarizeResponse =
        await chrome.runtime.sendMessage(
          request
        );

      await setCachedSummary(
        cacheKey,
        response
      );

      renderResponse(
        passagesElement,
        summaryElement,
        response,
        contexts
      );
    } catch (error) {
      console.error(
        "X-Ray summary request failed:",
        error
      );

      summaryElement.textContent =
        "Unable to generate the overall summary.";

      for (const context of contexts) {
        const summary =
          passagesElement.querySelector<HTMLElement>(
            `[data-context-id="${context.id}"] .context-summary`
          );

        if (summary) {
          summary.textContent =
            "Could not generate an explanation.";

          summary.classList.add(
            "context-error"
          );
        }
      }
    }
  }
);

document
  .getElementById("clear-cache")
  ?.addEventListener("click", async () => {
    const status =
      document.getElementById(
        "cache-status"
      );

    try {
      await clearCache();

      if (status) {
        status.textContent =
          "Cache cleared.";

        window.setTimeout(() => {
          status.textContent = "";
        }, 2000);
      }
    } catch (error) {
      console.error(
        "Could not clear X-Ray cache:",
        error
      );

      if (status) {
        status.textContent =
          "Could not clear cache.";
      }
    }
  });