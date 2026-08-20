import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import { createAccessAuth } from "../src/middleware/access-auth";
import type { Env } from "../src/types";

describe("Cloudflare Access middleware", () => {
  it("returns 401 without an Access assertion and does not call the verifier", async () => {
    const verifier = vi.fn();
    const app = new Hono<{ Bindings: Env }>();
    app.use("/mcp", createAccessAuth(verifier));
    app.get("/mcp", (context) => context.text("unexpected"));

    const response = await app.request("https://worker.example/mcp");

    expect(response.status).toBe(401);
    expect(verifier).not.toHaveBeenCalled();
  });
});
