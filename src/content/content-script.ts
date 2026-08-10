import { extractPassages } from "./extractor.js";
import { retrieveContexts } from "./retrieval.js";

interface JumpToPassageMessage {
  type: "JUMP_TO_PASSAGE";
  passageId: string;
}

document.addEventListener("mouseup", () => {
  const selection = window.getSelection()?.toString().trim();

  if (!selection) {
    return;
  }

  const passages = extractPassages();
  const contexts = retrieveContexts(
    passages,
    selection
  );

  try {
    chrome.runtime.sendMessage({
      type: "TERM_SELECTED",
      term: selection,
      contexts
    });
  } catch (error) {
    console.warn(
      "X-Ray extension context was invalidated.",
      error
    );
  }
});

chrome.runtime.onMessage.addListener(
  (message: JumpToPassageMessage) => {
    if (message.type !== "JUMP_TO_PASSAGE") {
      return;
    }

    const element =
      document.querySelector<HTMLElement>(
        `[data-xray-passage-id="${message.passageId}"]`
      );

    if (!element) {
      console.warn(
        `X-Ray could not find ${message.passageId}`
      );
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    const originalBackground =
      element.style.backgroundColor;

    const originalTransition =
      element.style.transition;

    element.style.transition =
      "background-color 0.25s ease";

    element.style.backgroundColor =
      "#fff3a3";

    window.setTimeout(() => {
      element.style.backgroundColor =
        originalBackground;

      window.setTimeout(() => {
        element.style.transition =
          originalTransition;
      }, 300);
    }, 1800);
  }
);