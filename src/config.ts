import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";

export const ConfigSchema = z.object({
  name: z.string().default("Privacy-MCP-Workspace"),
  version: z.string().default("1.0.0"),
  security: z.object({
    restricted_directories: z.array(z.string()).default([
      "Financeiro",
      "Recursos Humanos",
      "Certificado Digital",
      ".git",
      "node_modules",
      "privacy-mcp-server"
    ]),
    allowed_extensions: z.array(z.string()).default([
      ".md",
      ".json",
      ".txt",
      ".csv",
      ".yaml",
      ".yml"
    ]),
    max_snippet_lines: z.number().default(50)
  }).default({}),
  redaction: z.object({
    enable_default_pii: z.boolean().default(true),
    custom_patterns: z.array(z.object({
      name: z.string(),
      regex: z.string(),
      replacement: z.string().default("[REDACTED]")
    })).default([])
  }).default({})
});

export type PrivacyConfig = z.infer<typeof ConfigSchema>;

export async function loadProjectConfig(projectRoot: string): Promise<PrivacyConfig> {
  const configPath = path.join(projectRoot, ".mcp-privacy.yml");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = yaml.load(raw);
    return ConfigSchema.parse(parsed);
  } catch (err) {
    // Return robust defaults if missing
    return ConfigSchema.parse({});
  }
}
