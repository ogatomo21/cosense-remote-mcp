import { describe, expect, it } from "vitest";

import { toolError } from "../src/mcp/tools/shared";

describe("toolError", () => {
  it("returns the sanitized Cosense error detail", () => {
    const error = new Error("Cosense update failed: NotLoggedInError");
    error.name = "CosenseClientError";

    expect(toolError("Updating the Cosense page", error).content[0].text).toContain("NotLoggedInError");
  });

  it("does not return unexpected error details to the MCP client", () => {
    expect(toolError("Updating the Cosense page", new Error("secret-value")).content[0].text)
      .not.toContain("secret-value");
  });
});
