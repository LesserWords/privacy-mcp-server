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

2. Build the project:
   ```bash
   npm run build
   ```

## How to Register in Client Hosts (Claude Desktop / Cursor / Antigravity)

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

To reuse for **any other project**, simply change `MCP_PROJECT_ROOT` to the target project directory path:

```json
{
  "mcpServers": {
    "my-other-project": {
      "command": "node",
      "args": ["/path/to/privacy-mcp-server/dist/index.js"],
      "env": {
        "MCP_PROJECT_ROOT": "/path/to/another-project"
      }
    }
  }
}
```

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
