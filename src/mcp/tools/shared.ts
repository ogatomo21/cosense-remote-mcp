export function toolError(operation: string, error?: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  const detail = error instanceof Error && error.name === "CosenseClientError" ? `: ${error.message}` : "";
  return {
    content: [{
      type: "text",
      text: `${operation} failed${detail}. Check the configured Cosense project and your page access.`,
    }],
    isError: true,
  };
}
