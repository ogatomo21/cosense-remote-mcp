export function toolError(operation: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [{
      type: "text",
      text: `${operation} failed. Check the configured Cosense project and your page access.`,
    }],
    isError: true,
  };
}
