import path from "path";
import { PrivacyConfig } from "./config.js";

export class SecurityEngine {
  constructor(private projectRoot: string, private config: PrivacyConfig) {}

  public getRoot(): string {
    return this.projectRoot;
  }

  public validatePath(relativePath: string): string {
    const normalizedRoot = path.normalize(this.projectRoot);
    const resolvedPath = path.normalize(path.join(normalizedRoot, relativePath || ""));

    // Prevent Path Traversal attacks
    if (!resolvedPath.startsWith(normalizedRoot)) {
      throw new Error("Access Denied: Path traversal detected.");
    }

    // Check against restricted directories
    const relFromRoot = path.relative(normalizedRoot, resolvedPath);
    const parts = relFromRoot.split(path.sep);

    for (const restricted of this.config.security.restricted_directories) {
      if (parts.includes(restricted)) {
        throw new Error(`Access Denied: Directory '${restricted}' is protected by privacy rules.`);
      }
    }

    return resolvedPath;
  }

  public isExtensionAllowed(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.config.security.allowed_extensions.includes(ext);
  }

  public redact(text: string): string {
    let output = text;

    if (this.config.redaction.enable_default_pii) {
      // PII Redactions: CPF, CNPJ, Email, Phone
      output = output
        .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]")
        .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, "[REDACTED_CNPJ]")
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b/g, "[REDACTED_PHONE]");
    }

    // Custom pattern replacements
    for (const item of this.config.redaction.custom_patterns) {
      try {
        const rx = new RegExp(item.regex, "gi");
        output = output.replace(rx, item.replacement);
      } catch (err) {
        // Ignore invalid regex silently
      }
    }

    return output;
  }
}
