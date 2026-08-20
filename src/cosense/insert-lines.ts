export interface TextLine {
  text: string;
}

export function splitInsertedText(text: string): string[] {
  return text.replaceAll("\r\n", "\n").split("\n");
}

/**
 * Returns complete replacement lines for Cosense's patch API. The first exact
 * match is used, matching the tool contract; otherwise text is appended.
 */
export function insertLinesAfterMatch(
  currentLines: readonly TextLine[],
  targetLineText: string,
  text: string,
): string[] {
  const current = currentLines.map((line) => line.text);
  const insertionIndex = current.findIndex((line) => line === targetLineText);
  const inserted = splitInsertedText(text);

  if (insertionIndex === -1) {
    return [...current, ...inserted];
  }

  return [
    ...current.slice(0, insertionIndex + 1),
    ...inserted,
    ...current.slice(insertionIndex + 1),
  ];
}
