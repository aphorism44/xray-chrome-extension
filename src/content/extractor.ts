import type { Passage } from "../shared/types";

const PASSAGE_SELECTOR =
  "p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, pre";

const EXCLUDED_ANCESTOR_SELECTOR = [
  "nav",
  "footer",
  "aside",
  "header",
  "menu",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='complementary']"
].join(", ");

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function isInsideExcludedArea(
  element: HTMLElement
): boolean {
  return element.closest(
    EXCLUDED_ANCESTOR_SELECTOR
  ) !== null;
}

function isUsefulText(text: string): boolean {
  const normalized = text.trim();

  if (!normalized) {
    return false;
  }

  // Keep headings even when short.
  if (normalized.length < 3) {
    return false;
  }

  return true;
}

export function extractPassages(): Passage[] {
  const elements =
    document.querySelectorAll<HTMLElement>(
      PASSAGE_SELECTOR
    );

  const passages: Passage[] = [];

  for (const element of elements) {
    if (!isVisible(element)) {
      continue;
    }

    if (isInsideExcludedArea(element)) {
      continue;
    }

    const text = element.innerText.trim();

    if (!isUsefulText(text)) {
      continue;
    }

    const id = `passage-${passages.length}`;

    element.dataset.xrayPassageId = id;

    passages.push({
      id,
      text,
      tagName: element.tagName.toLowerCase()
    });
  }

  return passages;
}