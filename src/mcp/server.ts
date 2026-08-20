import { McpServer } from "@modelcontextprotocol/server";

import type { CosenseClient } from "../cosense/types";
import { registerGetPageTool } from "./tools/get-page";
import { registerInsertLinesTool } from "./tools/insert-lines";
import { registerListPagesTool } from "./tools/list-pages";
import { registerSearchPagesTool } from "./tools/search-pages";

export function createCosenseServer(client: CosenseClient): McpServer {
  const server = new McpServer({
    name: "cosense-mcp-worker",
    version: "0.1.0",
  });

  registerGetPageTool(server, client);
  registerListPagesTool(server, client);
  registerSearchPagesTool(server, client);
  registerInsertLinesTool(server, client);
  return server;
}
