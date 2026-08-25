/**
 * Remote MCP (Model Context Protocol) endpoint published by the backend.
 *
 * The frontend only *documents* this endpoint: the OAuth/PKCE authorization flow runs between
 * the MCP client and the backend, so nothing here stores, requests or displays credentials.
 * Override with `VITE_MCP_ENDPOINT` when the UI points at a non-production deployment.
 */
export const MCP_ENDPOINT: string =
  import.meta.env.VITE_MCP_ENDPOINT || 'https://jobapply-api.hugojava.dev/mcp'

/** Server name suggested to users when they register the endpoint in a client. */
export const MCP_SERVER_NAME = 'applywell'

/**
 * Official documentation for each supported client. Client requirements and UI labels change
 * often, so the page links here instead of freezing plan limits or menu paths into the copy.
 */
export const MCP_DOC_LINKS = {
  chatgpt:
    'https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt',
  codex: 'https://developers.openai.com/codex/mcp/',
  claudeCode: 'https://docs.claude.com/en/docs/claude-code/mcp',
  claudeMcp: 'https://docs.anthropic.com/en/docs/mcp',
  claudeCli: 'https://docs.anthropic.com/en/docs/claude-code/cli-usage',
  spec: 'https://modelcontextprotocol.io/docs/getting-started/intro',
} as const
