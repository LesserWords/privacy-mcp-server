# Reusable Privacy MCP Server

A zero-data-leakage, privacy-first Model Context Protocol (MCP) server designed for any local document workspace.

## Features
- 🔒 **Zero External Data Exposure**: Inverted keyword indexing and full-text searching run 100% offline.
- 🛡️ **Automated PII & Secret Redaction**: Automatically strips CPFs, CNPJs, Emails, Phone numbers, Passwords, and Secrets before sending snippets to LLMs.
- 🚫 **Path Access Control**: Blacklists sensitive subfolders (e.g. `Financeiro`, `Recursos Humanos`, `.git`).
- ⚡ **Just-In-Time (JIT) Snippets**: Line-bounded snippet retrieval prevents context stuffing.
- ⚙️ **Config-Driven**: Customize security rules per workspace using a local `.mcp-privacy.yml` file.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the Node.js project:
   ```bash
   npm run build
   ```

3. **(Optional) Build as a standalone `.exe`** (No Node.js required on target machine):
   ```bash
   npm run build:exe
   # or: bun run build:exe
   ```
   This compiles `privacy-mcp.exe`. When launched without `MCP_PROJECT_ROOT`, it automatically targets the folder it is placed in or executed from (`process.cwd()`).

## How to Register in Client Hosts (Claude Desktop / Cursor / Antigravity)

### Option A: Using Node.js
Add this entry to your `claude_desktop_config.json` or MCP configuration:

```json
{
  "mcpServers": {
    "workspace-docs": {
      "command": "node",
      "args": ["/path/to/privacy-mcp-server/dist/index.js"],
      "env": {
        "MCP_PROJECT_ROOT": "/path/to/your/documents"
      }
    }
  }
}
```

### Option B: Using Standalone Executable (`privacy-mcp.exe`)
```json
{
  "mcpServers": {
    "workspace-docs": {
      "command": "/path/to/privacy-mcp-server/privacy-mcp.exe",
      "env": {
        "MCP_PROJECT_ROOT": "/path/to/your/documents"
      }
    }
  }
}
```

*Tip*: If `MCP_PROJECT_ROOT` is omitted in Option B, `privacy-mcp.exe` automatically protects and indexes whichever directory it is launched from.

## Multi-MCP & Multi-Workspace Architecture

To scale this tool across multiple folders or combine it with other MCP tools:

1. **MCP Gateway / Meta-MCP Router**: Run a proxy server that aggregates `privacy-mcp` with other MCP servers (Git, SQLite, Web Search) into a single client entry point with tool namespacing (`privacy_search`, `git_diff`).
2. **Multi-Workspace Support**: Configured via `mcp-workspaces.yml` to index multiple project roots under a single server instance using `list_workspaces` and `search_all_workspaces`.
3. **Modular Plugin Architecture**: Embed multiple tools (privacy engine, git inspector, tabular data parser) directly into the single `.exe` binary, enabled per workspace.
4. **Auto-Discovery Launcher**: A lightweight system tray utility (`mcp-tray.exe`) that watches folders for `.mcp-privacy.yml` and auto-registers them into Claude/Cursor configs.

For detailed design blueprints on these patterns, see [docs/MULTI_MCP_ARCHITECTURE.md](docs/MULTI_MCP_ARCHITECTURE.md).

## Workspace Configuration (`.mcp-privacy.yml`)

Place a `.mcp-privacy.yml` file in any workspace root directory:

```yaml
name: "My Project Knowledge Base"
security:
  restricted_directories:
    - "Financeiro"
    - "Recursos Humanos"
    - "Certificado Digital"
    - ".git"
    - "node_modules"
  allowed_extensions:
    - ".md"
    - ".json"
    - ".txt"
    - ".csv"
  max_snippet_lines: 50

redaction:
  enable_default_pii: true
```
