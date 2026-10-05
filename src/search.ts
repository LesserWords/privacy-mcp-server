import fs from "fs/promises";
import path from "path";
import { SecurityEngine } from "./security.js";

export interface SearchResult {
  relativePath: string;
  matchedLine: number;
  previewText: string;
  score: number;
}

export class LocalSearchEngine {
  constructor(private security: SecurityEngine) {}

  public async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    const root = this.security.getRoot();
    const queryTerms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);
    
    if (queryTerms.length === 0) return [];

    const results: SearchResult[] = [];
    await this.scanDirectory("", queryTerms, results, maxResults);
    
    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  private async scanDirectory(
    currentRelPath: string,
    queryTerms: string[],
    results: SearchResult[],
    maxResults: number
  ): Promise<void> {
    try {
      const fullPath = this.security.validatePath(currentRelPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const itemRelPath = path.join(currentRelPath, entry.name);

        if (entry.isDirectory()) {
          try {
            // Check if allowed
            this.security.validatePath(itemRelPath);
            await this.scanDirectory(itemRelPath, queryTerms, results, maxResults);
          } catch {
            // Skip restricted directories silently
            continue;
          }
        } else if (entry.isFile() && this.security.isExtensionAllowed(entry.name)) {
          await this.searchFile(itemRelPath, queryTerms, results);
        }
      }
    } catch {
      // Ignore unreadable paths
    }
  }

  private async searchFile(
    relPath: string,
    queryTerms: string[],
    results: SearchResult[]
  ): Promise<void> {
    try {
      const fullPath = this.security.validatePath(relPath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        let score = 0;
        for (const term of queryTerms) {
          if (lowerLine.includes(term)) {
            score += 1;
          }
        }

        if (score > 0) {
          const sanitizedLine = this.security.redact(line.trim());
          results.push({
            relativePath: relPath.replace(/\\/g, "/"),
            matchedLine: i + 1,
            previewText: sanitizedLine.substring(0, 150),
            score
          });

          // Limit total matches per single search pass
          if (results.length > 100) break;
        }
      }
    } catch {
      // Ignore errors reading single files
    }
  }
}
