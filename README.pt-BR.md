# Servidor MCP de Privacidade Reutilizável (Privacy MCP Server)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[English](README.md) | **Português (Brasil)**

Um servidor para o **Model Context Protocol (MCP)** focado em privacidade e **zero vazamento de dados**, projetado para qualquer workspace ou pasta local de documentos.

---

## 🚀 Funcionalidades

- 🔒 **Zero Exposição Externa**: Indexação por palavras-chave e busca em texto completo executadas 100% offline.
- 🛡️ **Remoção Automática de PII e Segredos**: Censura automaticamente CPFs, CNPJs, E-mails, Telefones, Senhas e Chaves de API antes de enviar trechos para a IA.
- 🚫 **Controle de Acesso por Caminho**: Bloqueia subpastas sensíveis (ex: `Financeiro`, `Recursos Humanos`, `Certificado Digital`, `.git`).
- ⚡ **Trechos Bounded JIT (Just-In-Time)**: Leitura delimitada por linhas para evitar excesso e poluição do contexto da IA.
- ⚙️ **Configuração Dinâmica por Pasta**: Personalize regras de segurança por workspace usando o arquivo `.mcp-privacy.yml`.

---

## 🛠️ Como Usar

### Opção A: Usando o Executável Standalone (`privacy-mcp.exe`) — *Sem necessidade de Node.js*

1. Baixe o executável `privacy-mcp.exe` da página de Releases ou compile localmente:
   ```bash
   npm run build:exe
   ```
2. Adicione a seguinte configuração ao seu cliente MCP (Claude Desktop / Cursor / Antigravity):

#### No `claude_desktop_config.json` ou `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "meus-documentos": {
      "command": "C:/caminho/para/privacy-mcp-server/privacy-mcp.exe",
      "env": {
        "MCP_PROJECT_ROOT": "C:/caminho/para/sua/pasta/de/documentos"
      }
    }
  }
}
```

> 💡 **Dica de Uso Direto**: Se você omitir a variável `MCP_PROJECT_ROOT`, o `privacy-mcp.exe` utilizará automaticamente a pasta onde ele for executado (`process.cwd()`).

---

### Opção B: Usando Node.js

1. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/LesserWords/privacy-mcp-server.git
   cd privacy-mcp-server
   npm install
   ```

2. Compile o projeto:
   ```bash
   npm run build
   ```

3. Registre no seu cliente MCP:
```json
{
  "mcpServers": {
    "meus-documentos": {
      "command": "node",
      "args": ["C:/caminho/para/privacy-mcp-server/dist/index.js"],
      "env": {
        "MCP_PROJECT_ROOT": "C:/caminho/para/sua/pasta/de/documentos"
      }
    }
  }
}
```

---

## ⚙️ Configuração da Pasta (`.mcp-privacy.yml`)

Crie ou edite um arquivo `.mcp-privacy.yml` na raiz de qualquer pasta de projeto:

```yaml
name: "Base de Conhecimento do Projeto"
version: "1.0.0"

security:
  # Pastas restritas que NUNCA serão lidas ou enviadas para a IA
  restricted_directories:
    - "Financeiro"
    - "Recursos Humanos"
    - "Certificado Digital"
    - ".git"
    - "node_modules"

  # Extensões de arquivo permitidas
  allowed_extensions:
    - ".md"
    - ".json"
    - ".txt"
    - ".csv"
    - ".yaml"
    - ".yml"

  # Limite máximo de linhas por trecho lido
  max_snippet_lines: 50

redaction:
  enable_default_pii: true # Redaciona automaticamente CPF, CNPJ, Email e Telefone
  custom_patterns:
    - name: "Senhas e Tokens"
      regex: '(?i)(senha|password|secret|token|api[_-]?key)\s*[:=]\s*["\']?[a-zA-Z0-9_\-\.\@]{3,}["\']?'
      replacement: "[SEGREDO_OCULTO]"
```

---

## 🧰 Ferramentas MCP Expostas para a IA

Quando conectado, a IA terá acesso a 3 ferramentas seguras:

1. `list_structure(subpath)`: Lista pastas e arquivos permitidos (ocultando pastas bloqueadas).
2. `search_docs(query, maxResults)`: Realiza busca local por palavras-chave em texto completo e retorna trechos higienizados.
3. `read_snippet(relativePath, startLine, lineCount)`: Retorna um trecho delimitado por linhas com remoção de PII e segredos ativada.

---

## 📐 Arquitetura Multi-MCP e Escala

Para arquiteturas avançadas (como rodar um roteador MCP Gateway, gerenciar múltiplas pastas simultaneamente ou utilizar plugins), consulte a documentação detalhada em [docs/MULTI_MCP_ARCHITECTURE.md](docs/MULTI_MCP_ARCHITECTURE.md).

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo [LICENSE](LICENSE) para obter detalhes.
