import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { formatPageList } from "../../cosense/formatter";
import type { CosenseClient } from "../../cosense/types";
import { toolError } from "./shared";

export const listPagesInputSchema = z.object({}).strict();

export function registerListPagesTool(server: McpServer, client: CosenseClient): void {
  server.registerTool(
    "list_pages",
    {
      description: "List the 100 most recently updated pages in the configured Cosense project.",
      inputSchema: listPagesInputSchema,
    },
    async () => {
      try {
        return { content: [{ type: "text" as const, text: formatPageList(await client.listPages()) }] };
      } catch {
        return toolError("Listing Cosense pages");
      }
    },
  );
}
