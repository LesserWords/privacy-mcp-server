# Multi-MCP & Single Executable Architecture Guide

This document outlines how to package the Privacy MCP Server into a portable executable and extend it to manage multiple workspaces and MCP tools.

---

## 1. Single Executable (`.exe`) Packaging

### Overview
Using **Bun** (`bun build --compile`), the TypeScript code and all node dependencies are compiled into a standalone Windows binary: `privacy-mcp.exe`.

```powershell
# Compile the single executable
npm run build:exe
```

### Folder Auto-Detection
The server checks for the target directory in this order:
1. `process.env.MCP_PROJECT_ROOT` (explicit environment variable)
2. `process.cwd()` (the directory from which `privacy-mcp.exe` was executed)

This allows dropping `privacy-mcp.exe` into **any workspace folder** and launching it directly without editing configuration paths.

---

## 2. Multi-MCP & Multi-Workspace Patterns

### Pattern A: MCP Gateway / Meta-MCP Router
A single proxy server (`mcp-gateway`) that manages downstream MCP servers and presents a unified tool interface to AI clients.

```
                  ┌───────────────────────────────┐
                  │  AI Client (Claude / Cursor)  │
                  └──────────────┬────────────────┘
                                 │ stdio / JSON-RPC
                  ┌──────────────▼────────────────┐
                  │    MCP Gateway (Router)       │
                  └─┬────────────┬──────────────┬─┘
                    │            │              │
    ┌───────────────▼┐   ┌───────▼────────┐   ┌─▼──────────────┐
    │ Privacy MCP    │   │ SQLite MCP     │   │ Git Inspector  │
    └────────────────┘   └────────────────┘   └────────────────┘
```

#### Key Capabilities:
- **Unified Client Config**: Only 1 MCP entry in `claude_desktop_config.json`.
- **Automatic Namespacing**: Tools are automatically prefixed (e.g. `privacy_search_docs`, `sqlite_query_table`).
- **Dynamic Hot-Reload**: Start or stop child MCP servers without restarting Claude or Cursor.

---

### Pattern B: Multi-Workspace / Multi-Tenant Privacy Server
Extend `privacy-mcp.exe` to index and protect multiple local folders within a single process.

#### Configuration (`mcp-workspaces.yml`):
```yaml
workspaces:
  - id: "log-sistemas"
    name: "Log Sistemas Internal Docs"
    path: "C:/Projekts/Organização docs/Drive Internal Docs/Log Sistemas"
  - id: "project-b"
    name: "Project B Workspace"
    path: "C:/Projekts/ProjectB"
```

#### Exposed Tools:
- `list_workspaces`: Returns all configured workspace roots and their status.
- `search_all_workspaces(query, workspaceId?)`: Performs multi-workspace search across all permitted directories.
- `read_workspace_snippet(workspaceId, relativePath, startLine, lineCount)`: Retrieves redacted snippets from a specified workspace.

---

### Pattern C: Modular Plugin Binary
Package multiple tool engines into a single executable binary, enabled or disabled via `.mcp-privacy.yml`.

#### Modular Plugins:
1. **`privacy_docs`**: Inverted index file search with PII & credential redaction.
2. **`git_inspector`**: Read-only commit log and diff inspector with security filtering.
3. **`data_parser`**: Tabular CSV / JSON schema viewer with automatic column masking.

#### Configuration Example:
```yaml
name: "My Project"
plugins:
  privacy_docs: true
  git_inspector: true
  data_parser: false
```

---

### Pattern D: Auto-Discovery Launcher & System Tray Utility
A lightweight Windows utility (`mcp-tray.exe`) running in the notification area:

1. **Workspace Scanning**: Automatically detects directories containing a `.mcp-privacy.yml` file.
2. **Auto-Configuration**: Dynamically updates local client configs (`claude_desktop_config.json`, `.cursor/mcp.json`).
3. **Control Panel**: Right-click tray menu to open folder rules, toggle active servers, or open the visual MCP Inspector.
