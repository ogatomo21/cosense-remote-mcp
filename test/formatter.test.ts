import { describe, expect, it } from "vitest";

import { formatPage } from "../src/cosense/formatter";

describe("formatPage", () => {
  it("includes page body and every requested link group", () => {
    const result = formatPage({
      title: "Home",
      lines: [{ text: "Home" }, { text: "Body" }],
      links: ["Direct"],
      projectLinks: ["Other project"],
      relatedPages: {
        links1hop: [{ title: "One hop", descriptions: ["first"] }],
        links2hop: [{ title: "Two hop" }],
        projectLinks1hop: [{ title: "Foreign page", projectName: "other" }],
      },
    });

    expect(result).toContain("## Page body");
    expect(result).toContain("Body");
    expect(result).toContain("## 1-hop related pages");
    expect(result).toContain("One hop");
    expect(result).toContain("## 2-hop related pages");
    expect(result).toContain("Two hop");
    expect(result).toContain("## External/project links");
    expect(result).toContain("Other project");
    expect(result).toContain("Foreign page (other)");
  });
});
