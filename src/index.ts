import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { loadProjectConfig } from "./config.js";
import { SecurityEngine } from "./security.js";
import { LocalSearchEngine } from "./search.js";

const PROJECT_ROOT = process.env.MCP_PROJECT_ROOT || process.cwd();

async function main() {
  const config = await loadProjectConfig(PROJECT_ROOT);
  const security = new SecurityEngine(PROJECT_ROOT, config);
  const searchEngine = new LocalSearchEngine(security);

  const server = new Server(
    { name: config.name, version: config.version },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_structure",
        description: "Safely lists allowed subdirectories and document files in the workspace.",
        inputSchema: {
          type: "object",
          properties: {
            subpath: { type: "string", description: "Subpath relative to workspace root (e.g. '' or 'Comercial')" }
          }
        }
      },
      {
        name: "search_docs",
        description: "Searches documents locally using full-text keywords. Returns sanitized matching lines.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Keyword query to search for" },
            maxResults: { type: "number", description: "Max results to return (default 10)" }
          },
          required: ["query"]
        }
      },
      {
        name: "read_snippet",
        description: "Retrieves a line-bounded, sanitized snippet from an allowed file.",
        inputSchema: {
          type: "object",
          properties: {
            relativePath: { type: "string", description: "Relative file path" },
            startLine: { type: "number", description: "Start line number (1-indexed)" },
            lineCount: { type: "number", description: "Number of lines to read (capped at max_snippet_lines)" }
          },
          required: ["relativePath"]
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_structure") {
      const subpath = String(args?.subpath || "");
      const fullPath = security.validatePath(subpath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      const allowed = entries
        .filter(entry => {
          if (config.security.restricted_directories.includes(entry.name)) return false;
          if (entry.isFile()) {
            return security.isExtensionAllowed(entry.name);
          }
          return true;
        })
        .map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file"
        }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allowed, null, 2)
          }
        ]
      };
    }

    if (name === "search_docs") {
      const query = String(args?.query || "");
      const maxResults = Number(args?.maxResults) || 10;

      const results = await searchEngine.search(query, maxResults);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    }

    if (name === "read_snippet") {
      const relPath = String(args?.relativePath || "");
      const fullPath = security.validatePath(relPath);

      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");
      
      const startLine = Math.max(0, (Number(args?.startLine) || 1) - 1);
      const requestedLines = Number(args?.lineCount) || 20;
      const count = Math.min(config.security.max_snippet_lines, requestedLines);

      const rawSnippet = lines.slice(startLine, startLine + count).join("\n");
      const sanitizedSnippet = security.redact(rawSnippet);

      return {
        content: [
          {
            type: "text",
            text: `--- File: ${relPath} (Lines ${startLine + 1}-${startLine + count}) ---\n${sanitizedSnippet}`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: '${name}'`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error("Privacy MCP Server Error:", err);
  process.exit(1);
});
