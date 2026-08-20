import { describe, expect, it } from "vitest";

import { formatPage, formatPageList } from "../src/cosense/formatter";

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

describe("formatPageList", () => {
  it("interprets Cosense updated timestamps as Unix seconds", () => {
    expect(formatPageList([{ title: "Page", updated: 1_700_000_000 }])).toContain(
      "2023-11-14T22:13:20.000Z",
    );
  });
});
