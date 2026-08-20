import { describe, expect, it } from "vitest";

import { insertLinesAfterMatch, splitInsertedText } from "../src/cosense/insert-lines";

describe("insertLinesAfterMatch", () => {
  it("inserts multi-line text after the first exact match", () => {
    expect(insertLinesAfterMatch(
      [{ text: "Page" }, { text: "target" }, { text: "target" }, { text: "tail" }],
      "target",
      "one\ntwo",
    )).toEqual(["Page", "target", "one", "two", "target", "tail"]);
  });

  it("appends when no exact line matches", () => {
    expect(insertLinesAfterMatch([{ text: "Page" }, { text: "target " }], "target", "new")).toEqual([
      "Page", "target ", "new",
    ]);
  });

  it("normalizes Windows newlines", () => {
    expect(splitInsertedText("a\r\nb")).toEqual(["a", "b"]);
  });
});
