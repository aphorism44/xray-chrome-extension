# X-Ray

X-Ray is a Chrome/Edge extension for exploring long webpages.

Highlight any term on a page and X-Ray finds the most relevant occurrences, groups the surrounding passages, generates concise explanations for each context, and produces an overall summary of how the term is used across the document.

Each result is grounded in the page itself, and context cards can jump directly back to the source passage.

## Requirements
    - Node.js
    - npm
    - Chrome or Microsoft Edge
    - An OpenAI API key


## What it does

X-Ray is designed for situations where a word or concept appears repeatedly across a long document and you want to understand:

- What does this term mean in this document?
- How is it used in different sections?
- Is the meaning consistent across the page?
- Where are the most important occurrences?
- What is the document saying about this concept overall?

Instead of giving a generic definition, X-Ray analyzes the selected term using only the passages retrieved from the current page.

## Configure your OpenAI API key

X-Ray currently uses a bring-your-own-key model.

After loading the extension:

    - Open the extension's Options
    - Enter your OpenAI API key
    - Click Save key

The key is stored using chrome.storage.local.

## Demo flow

1. Open a long webpage.
2. Highlight a word or phrase.
3. X-Ray extracts readable passages from the page.
4. Relevant occurrences are ranked and grouped into contexts.
5. The top contexts are sent to OpenAI.
6. X-Ray displays:
   - an overall document-level summary
   - a concise explanation for each context
   - the source passage position
7. Click a context card to jump back to that passage on the page.

## Features

- Highlight any term or phrase on a webpage
- Extracts readable page content
- Filters common page chrome such as navigation and footers
- Whole-term matching
- Context grouping around matching passages
- Relevance ranking
- Maximum of 20 contexts per analysis
- Overall document-level summary
- Separate AI explanation for each context
- Grounded prompts that use only retrieved page content
- Click-to-jump source navigation
- Temporary source highlighting
- Local summary caching
- Clear-cache control
- Empty-result handling
- Error states for failed summaries
- User-supplied OpenAI API key
- Chrome/Edge Manifest V3

## Security note

This is intended as an MVP / technical beta.

Because the extension calls OpenAI directly, the user's API key exists on the client machine and should not be considered equivalent to server-side secret storage.

A production public release should route OpenAI requests through a backend service so API credentials never need to exist inside the extension.

## Current limitations

X-Ray is still an MVP.

Current limitations include:

    - Primarily designed for normal HTML webpages
    - PDF support is not yet implemented
    - EPUB support is not yet implemented
    - Page extraction is heuristic
    - Highly dynamic sites may produce inconsistent passage structures
    - API usage requires the user to supply an OpenAI API key
    - API keys are currently stored client-side
    - Authentication and server-side usage controls are not yet implemented

## Architecture

```text
Webpage
   |
   v
Content Script
   |
   +-- Passage extraction
   |
   +-- Noise filtering
   |
   +-- Term retrieval
   |
   +-- Context ranking
   |
   v
Side Panel
   |
   +-- Cache lookup
   |
   v
Service Worker
   |
   v
OpenAI API
   |
   v
Overall summary
+
Context explanations