import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { formatPage } from "../../cosense/formatter";
import type { CosenseClient } from "../../cosense/types";
import { toolError } from "./shared";

export const getPageInputSchema = z.object({
  title: z.string().trim().min(1).max(500).describe("Exact Cosense page title."),
}).strict();

export function registerGetPageTool(server: McpServer, client: CosenseClient): void {
  server.registerTool(
    "get_page",
    {
      description: "Get a Cosense page body, direct links, 1-hop links, 2-hop links, and external/project links.",
      inputSchema: getPageInputSchema,
    },
    async ({ title }) => {
      try {
        const page = await client.getPage(title);
        return { content: [{ type: "text" as const, text: formatPage(page) }] };
      } catch {
        return toolError("Getting the Cosense page");
      }
    },
  );
}
