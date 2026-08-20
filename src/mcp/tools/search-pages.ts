import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { formatSearchResults } from "../../cosense/formatter";
import type { CosenseClient } from "../../cosense/types";
import { toolError } from "./shared";

export const searchPagesInputSchema = z.object({
  query: z.string().trim().min(1).max(500).describe("Cosense full-text search query."),
}).strict();

export function registerSearchPagesTool(server: McpServer, client: CosenseClient): void {
  server.registerTool(
    "search_pages",
    {
      description: "Full-text search within the configured Cosense project.",
      inputSchema: searchPagesInputSchema,
    },
    async ({ query }) => {
      try {
        return { content: [{ type: "text" as const, text: formatSearchResults(query, await client.searchPages(query)) }] };
      } catch {
        return toolError("Searching Cosense pages");
      }
    },
  );
}
