export interface CosenseLine {
  text: string;
}

export interface CosenseRelatedPage {
  title: string;
  descriptions?: string[];
  projectName?: string;
}

export interface CosensePage {
  title: string;
  lines: CosenseLine[];
  links?: string[];
  projectLinks?: string[];
  relatedPages?: {
    links1hop?: CosenseRelatedPage[];
    links2hop?: CosenseRelatedPage[];
    projectLinks1hop?: CosenseRelatedPage[];
  };
}

export interface CosensePageSummary {
  title: string;
  descriptions?: string[];
  updated?: number;
}

export interface CosenseSearchResult {
  title: string;
  lines?: string[];
  words?: string[];
}

export interface CosenseClient {
  getPage(title: string): Promise<CosensePage>;
  listPages(): Promise<CosensePageSummary[]>;
  searchPages(query: string): Promise<CosenseSearchResult[]>;
  insertLines(title: string, targetLineText: string, text: string): Promise<void>;
}
