import { describe, expect, it } from "vitest";

import { parseConfig } from "../src/config";

describe("parseConfig", () => {
  const valid = {
    COSENSE_PROJECT_NAME: "team-notes",
    COSENSE_SID: "secret",
    CF_ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com/",
    CF_ACCESS_AUD: "audience-tag",
  };

  it("normalizes the Access team domain to its origin", () => {
    expect(parseConfig(valid).accessTeamDomain).toBe("https://team.cloudflareaccess.com");
  });

  it("rejects an Access team domain with a path", () => {
    expect(() => parseConfig({ ...valid, CF_ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com/path" })).toThrow();
  });
});
