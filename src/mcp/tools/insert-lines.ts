import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import type { CosenseClient } from "../../cosense/types";
import { toolError } from "./shared";

export const insertLinesInputSchema = z.object({
  title: z.string().trim().min(1).max(500).describe("Target Cosense page title."),
  targetLineText: z.string().max(10_000).describe("Insert after the first line that exactly matches this text; append if absent."),
  text: z.string().min(1).max(50_000).describe("Text to insert. Newlines are supported."),
}).strict();

export function registerInsertLinesTool(server: McpServer, client: CosenseClient): void {
  server.registerTool(
    "insert_lines",
    {
      description: "Insert text after the first exact target line in a Cosense page, or append it when no matching line exists.",
      inputSchema: insertLinesInputSchema,
    },
    async ({ title, targetLineText, text }) => {
      try {
        await client.insertLines(title, targetLineText, text);
        return { content: [{ type: "text" as const, text: `Inserted text into “${title}”.` }] };
      } catch (error) {
        console.error("insert_lines failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : "Non-error failure",
        });
        return toolError("Updating the Cosense page", error);
      }
    },
  );
}
