import type { CosensePage, CosensePageSummary, CosenseRelatedPage, CosenseSearchResult } from "./types";

const MAX_TOOL_TEXT_LENGTH = 100_000;

function truncate(text: string): string {
  if (text.length <= MAX_TOOL_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TOOL_TEXT_LENGTH)}\n\n[Output truncated at ${MAX_TOOL_TEXT_LENGTH} characters.]`;
}

function pageDescriptions(pages: CosenseRelatedPage[] | undefined): string {
  if (!pages?.length) return "(none)";
  return pages.map((page) => {
    const project = page.projectName ? ` (${page.projectName})` : "";
    const description = page.descriptions?.filter(Boolean).join(" ");
    return `- ${page.title}${project}${description ? ` — ${description}` : ""}`;
  }).join("\n");
}

function formatUnixSeconds(timestamp: number): string {
  return new Date(timestamp * 1_000).toISOString();
}

export function formatPage(page: CosensePage): string {
  const body = page.lines.map((line) => line.text).join("\n");
  const directLinks = page.links?.length ? page.links.map((link) => `- ${link}`).join("\n") : "(none)";
  const projectLinks = page.projectLinks?.length ? page.projectLinks.map((link) => `- ${link}`).join("\n") : "(none)";

  return truncate([
    `# ${page.title}`,
    "",
    "## Page body",
    body,
    "",
    "## Direct page links",
    directLinks,
    "",
    "## 1-hop related pages",
    pageDescriptions(page.relatedPages?.links1hop),
    "",
    "## 2-hop related pages",
    pageDescriptions(page.relatedPages?.links2hop),
    "",
    "## External/project links",
    projectLinks,
    pageDescriptions(page.relatedPages?.projectLinks1hop),
  ].join("\n"));
}

export function formatPageList(pages: CosensePageSummary[]): string {
  if (pages.length === 0) return "No pages found.";
  return truncate(pages.map((page) => {
    const description = page.descriptions?.filter(Boolean).join(" ");
    const updated = page.updated !== undefined ? `; updated: ${formatUnixSeconds(page.updated)}` : "";
    return `- ${page.title}${description ? ` — ${description}` : ""}${updated}`;
  }).join("\n"));
}

export function formatSearchResults(query: string, pages: CosenseSearchResult[]): string {
  if (pages.length === 0) return `No pages found for: ${query}`;
  return truncate(pages.map((page) => [
    `## ${page.title}`,
    page.words?.length ? `Matched terms: ${page.words.join(", ")}` : "",
    ...(page.lines ?? []),
  ].filter(Boolean).join("\n")).join("\n\n"));
}
