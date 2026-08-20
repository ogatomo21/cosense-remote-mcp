import { createMcpHandler } from "agents/mcp/server";
import { Hono } from "hono";

import { parseConfig } from "./config";
import { CloudflareCosenseClient } from "./cosense/client";
import { createAccessAuth } from "./middleware/access-auth";
import { createCosenseServer } from "./mcp/server";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (context) => context.json({
  name: "cosense-mcp-worker",
  mcpEndpoint: "/mcp",
  authentication: "Cloudflare Access Managed OAuth",
}));

app.get("/health", (context) => context.json({ ok: true }));

app.use("/mcp", createAccessAuth());

app.all("/mcp", (context) => {
  const config = parseConfig(context.env);
  const client = new CloudflareCosenseClient({
    projectName: config.projectName,
    sid: config.cosenseSid,
  });
  const handler = createMcpHandler(
    () => createCosenseServer(client),
    {
      // Cloudflare Access authenticates every request before it reaches this
      // handler. Accept all client Origins so Remote MCP clients, including
      // ChatGPT, are not rejected by the SDK's restrictive default allowlist.
      allowedOriginHostnames: "*",
    },
  );
  // Agents SDK v2 exposes an extended ExecutionContext while Hono is typed
  // against the Worker global. At runtime this is the same Worker context.
  return handler(context.req.raw, context.env, context.executionCtx as Parameters<typeof handler>[2]);
});

app.notFound((context) => context.json({ error: "Not found." }, 404));

app.onError((_error, context) => {
  // Do not serialize arbitrary errors: they can contain upstream request data.
  return context.json({ error: "Internal server error." }, 500);
});

export default app;
