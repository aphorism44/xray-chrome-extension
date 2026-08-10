export interface Passage {
  id: string;
  text: string;
  tagName: string;
}

export interface ContextGroup {
  id: number;
  passages: Passage[];
}

export interface TermSelectedMessage {
  type: "TERM_SELECTED";
  term: string;
  contexts: ContextGroup[];
}

export interface SummarizeRequest {
  type: "SUMMARIZE_TERM";
  term: string;
  contexts: ContextGroup[];
}

export interface ContextSummary {
  contextId: number;
  summary: string;
}

export interface SummarizeResponse {
  overallSummary: string;
  summaries: ContextSummary[];
}

