import { describe, expect, it } from "vitest";

import { getPageInputSchema } from "../src/mcp/tools/get-page";
import { insertLinesInputSchema } from "../src/mcp/tools/insert-lines";
import { listPagesInputSchema } from "../src/mcp/tools/list-pages";
import { searchPagesInputSchema } from "../src/mcp/tools/search-pages";

describe("MCP tool input schemas", () => {
  it("rejects missing get_page title", () => {
    expect(getPageInputSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty search query", () => {
    expect(searchPagesInputSchema.safeParse({ query: "   " }).success).toBe(false);
  });

  it("allows multiline insert text and rejects empty text", () => {
    expect(insertLinesInputSchema.safeParse({ title: "Page", targetLineText: "line", text: "a\nb" }).success).toBe(true);
    expect(insertLinesInputSchema.safeParse({ title: "Page", targetLineText: "line", text: "" }).success).toBe(false);
  });

  it("rejects unexpected arguments to list_pages", () => {
    expect(listPagesInputSchema.safeParse({ project: "forbidden" }).success).toBe(false);
  });
});
