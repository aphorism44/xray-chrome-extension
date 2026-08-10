import type { Passage } from "../shared/types";

export interface RankedContext {
  id: number;
  score: number;
  passages: Passage[];
}

const MAX_CONTEXTS = 20;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWholeTermOccurrences(
  text: string,
  term: string
): number {
  const escapedTerm = escapeRegExp(term.trim());

  const pattern = new RegExp(
    `(^|\\W)${escapedTerm}(?=$|\\W)`,
    "gi"
  );

  return Array.from(text.matchAll(pattern)).length;
}

function getPassageNumber(id: string): number {
  return Number(id.replace("passage-", ""));
}

function containsDefinitionPattern(
  text: string,
  term: string
): boolean {
  const escapedTerm = escapeRegExp(term.trim());

  const patterns = [
    new RegExp(`${escapedTerm}\\s+is\\b`, "i"),
    new RegExp(`${escapedTerm}\\s+means\\b`, "i"),
    new RegExp(`${escapedTerm}\\s+refers\\s+to\\b`, "i"),
    new RegExp(`defined\\s+as\\b`, "i")
  ];

  return patterns.some(pattern => pattern.test(text));
}

function isHeading(passage: Passage): boolean {
  return /^h[1-6]$/.test(passage.tagName);
}

function getFocusBonus(text: string): number {
  const length = text.length;

  if (length <= 300) {
    return 2;
  }

  if (length <= 700) {
    return 1;
  }

  return 0;
}

function scorePassage(
  passage: Passage,
  term: string
): number {
  const occurrences =
    countWholeTermOccurrences(passage.text, term);

  if (occurrences === 0) {
    return 0;
  }

  let score = occurrences * 3;

  if (containsDefinitionPattern(passage.text, term)) {
    score += 6;
  }

  if (isHeading(passage)) {
    score += 8;
  }

  score += getFocusBonus(passage.text);

  return score;
}

export function retrieveContexts(
  passages: Passage[],
  term: string
): RankedContext[] {
  const matches = passages
    .map((passage, index) => ({
      passage,
      index,
      score: scorePassage(passage, term)
    }))
    .filter(match => match.score > 0);

  const contextIndexes = new Set<number>();

  for (const match of matches) {
    contextIndexes.add(match.index - 1);
    contextIndexes.add(match.index);
    contextIndexes.add(match.index + 1);
  }

  const contextPassages = Array.from(contextIndexes)
    .filter(index =>
      index >= 0 &&
      index < passages.length
    )
    .sort((a, b) => a - b)
    .map(index => passages[index]);

  if (contextPassages.length === 0) {
    return [];
  }

  const contexts: RankedContext[] = [];
  let currentPassages: Passage[] = [contextPassages[0]];

  for (let i = 1; i < contextPassages.length; i++) {
    const previousNumber =
      getPassageNumber(contextPassages[i - 1].id);

    const currentNumber =
      getPassageNumber(contextPassages[i].id);

    if (currentNumber === previousNumber + 1) {
      currentPassages.push(contextPassages[i]);
    } else {
      contexts.push(
        createRankedContext(
          contexts.length + 1,
          currentPassages,
          term
        )
      );

      currentPassages = [contextPassages[i]];
    }
  }

  contexts.push(
    createRankedContext(
      contexts.length + 1,
      currentPassages,
      term
    )
  );

  return contexts
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        getPassageNumber(a.passages[0].id) -
        getPassageNumber(b.passages[0].id)
      );
    })
    .slice(0, MAX_CONTEXTS)
    .map((context, index) => ({
      ...context,
      id: index + 1
    }));
}

function createRankedContext(
  id: number,
  passages: Passage[],
  term: string
): RankedContext {
  const score = passages.reduce(
    (total, passage) =>
      total + scorePassage(passage, term),
    0
  );

  return {
    id,
    score,
    passages
  };
}