import { getPage } from "@cosense/std/unstable-api/pages/project/title";
import { listPages } from "@cosense/std/unstable-api/pages/project";
import { searchForPages } from "@cosense/std/unstable-api/pages/project/search/query";
import { patch } from "@cosense/std/websocket";
import { isOk, unwrapErr } from "option-t/plain_result";

import { insertLinesAfterMatch } from "./insert-lines";
import type { CosenseClient, CosensePage, CosensePageSummary, CosenseSearchResult } from "./types";

export class CosenseClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosenseClientError";
  }
}

interface CloudflareCosenseClientOptions {
  projectName: string;
  sid: string;
}

export class CloudflareCosenseClient implements CosenseClient {
  constructor(private readonly options: CloudflareCosenseClientOptions) {}

  async getPage(title: string): Promise<CosensePage> {
    const response = await getPage(this.options.projectName, title, { sid: this.options.sid });
    return this.readJson<CosensePage>(response, "get page");
  }

  async listPages(): Promise<CosensePageSummary[]> {
    const response = await listPages(this.options.projectName, {
      sid: this.options.sid,
      sort: "updated",
      limit: 100,
    });
    const result = await this.readJson<{ pages?: CosensePageSummary[] }>(response, "list pages");
    return result.pages ?? [];
  }

  async searchPages(query: string): Promise<CosenseSearchResult[]> {
    const response = await searchForPages(this.options.projectName, query, { sid: this.options.sid });
    const result = await this.readJson<{ pages?: CosenseSearchResult[] }>(response, "search pages");
    return result.pages ?? [];
  }

  async insertLines(title: string, targetLineText: string, text: string): Promise<void> {
    const result = await patch(
      this.options.projectName,
      title,
      (lines) => insertLinesAfterMatch(lines, targetLineText, text),
      { sid: this.options.sid, maxAttempts: 3 },
    );

    if (!isOk(result)) {
      const error = unwrapErr(result);
      throw new CosenseClientError(`Cosense update failed: ${this.describeError(error)}`);
    }
  }

  private async readJson<T>(response: Response, operation: string): Promise<T> {
    if (!response.ok) {
      throw new CosenseClientError(`Cosense ${operation} failed with HTTP ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }

  private describeError(error: unknown): string {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
      return error.name;
    }
    return "an unknown error";
  }
}
