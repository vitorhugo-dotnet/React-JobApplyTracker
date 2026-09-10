import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Page, PageHeader, SectionLabel } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { CheckIcon, PlugIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { MCP_DOC_LINKS, MCP_ENDPOINT, MCP_SERVER_NAME } from '@/lib/mcp'

/* ------------------------------------------------------------------ primitives */

/** Copy-to-clipboard with a short "Copied" acknowledgement. */
function useCopy() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async (value: string) => {
    try {
      if (!navigator.clipboard) return
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked or unavailable — the value stays on screen for manual selection.
      setCopied(false)
    }
  }, [])

  return { copied, copy }
}

interface CopyButtonProps {
  value: string
  /** What is being copied — builds a stable, descriptive accessible name. */
  subject: string
  size?: 'md' | 'sm'
  className?: string
}

function CopyButton({ value, subject, size = 'md', className }: CopyButtonProps) {
  const { copied, copy } = useCopy()
  return (
    <Button
      size={size}
      onClick={() => copy(value)}
      aria-label={copied ? `${subject} copied` : `Copy ${subject}`}
      className={cn('shrink-0', className)}
    >
      {copied ? (
        <>
          <CheckIcon size={12} />
          Copied
        </>
      ) : (
        'Copy'
      )}
    </Button>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded border border-mono-e5 bg-mono-f5 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mono-5">
      {children}
    </span>
  )
}

/** Emphasises a UI label or command referenced in prose. */
function Ui({ children }: { children: ReactNode }) {
  return <span className="font-medium text-mono-1">{children}</span>
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-mono-e5 bg-mono-f5 px-1 py-px font-mono text-[11.5px] text-mono-1">
      {children}
    </code>
  )
}

/**
 * Ready-to-paste snippet. Long lines wrap instead of scrolling out of sight, and the copy button
 * sits in its own column so it never covers the code on narrow screens.
 */
function CodeBlock({ code, subject }: { code: string; subject: string }) {
  return (
    <div className="mt-2.5 flex items-start gap-1 rounded border border-mono-e5 bg-mono-f5">
      <pre className="min-w-0 flex-1 whitespace-pre-wrap wrap-break-word px-3 py-2.5 font-mono text-[12px] leading-[1.65] text-mono-1">
        <code>{code}</code>
      </pre>
      <div className="shrink-0 p-1.5">
        <CopyButton value={code} subject={subject} size="sm" />
      </div>
    </div>
  )
}

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
      {children} ↗
    </a>
  )
}

interface CardProps {
  icon?: ReactNode
  title: string
  /** Heading level, so the page keeps a flat h1 → h2 → h3 outline. */
  titleAs?: 'h2' | 'h3'
  sub?: string
  badges?: string[]
  action?: ReactNode
  children: ReactNode
}

function Card({ icon, title, titleAs: Heading = 'h2', sub, badges, action, children }: CardProps) {
  return (
    <section className="mb-4 rounded border border-mono-e5 bg-mono-w">
      <div className="flex flex-wrap items-start gap-x-3.5 gap-y-2.5 px-[18px] pb-3.5 pt-4">
        {icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded border border-mono-e5 text-mono-5">
            {icon}
          </div>
        )}
        <div className="min-w-[180px] flex-1">
          <Heading className="text-[14.5px] font-semibold">{title}</Heading>
          {sub && <p className="mt-0.5 text-[12.5px] text-mono-9">{sub}</p>}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {badges.map((badge) => (
              <Badge key={badge}>{badge}</Badge>
            ))}
          </div>
        )}
        {action}
      </div>
      <hr className="border-mono-e5" />
      <div className="p-[18px]">{children}</div>
    </section>
  )
}

/** Static, ordered instructions. `items` is a prop (not children) so the array needs no keys. */
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-px grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border border-mono-e5 font-mono text-[10.5px] text-mono-5">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 text-[13px] leading-[1.6] text-mono-2">{step}</div>
        </li>
      ))}
    </ol>
  )
}

function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'rounded border border-mono-e5 bg-mono-f5 px-3 py-2.5 text-[12.5px] leading-[1.6] text-mono-5',
        className,
      )}
    >
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ client marks */

function ChatIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="2" width="12" height="9" rx="2" stroke="currentColor" />
      <path d="M4.5 11V13.6L7.6 11" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="2" width="13" height="11" rx="1.5" stroke="currentColor" />
      <path d="M4 5.8L6.3 7.6L4 9.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="9.8" x2="11" y2="9.8" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeLinecap="round">
      <line x1="7.5" y1="1.5" x2="7.5" y2="13.5" />
      <line x1="1.5" y1="7.5" x2="13.5" y2="7.5" />
      <line x1="3.3" y1="3.3" x2="11.7" y2="11.7" />
      <line x1="11.7" y1="3.3" x2="3.3" y2="11.7" />
    </svg>
  )
}

/* ------------------------------------------------------------------ page */

const CODEX_CONFIG = `[mcp_servers.${MCP_SERVER_NAME}]
url = "${MCP_ENDPOINT}"
# auth defaults to "oauth" — no token or secret belongs in this file`

const CODEX_LOGIN = `codex mcp login ${MCP_SERVER_NAME}`

const CLAUDE_ADD = `claude mcp add --transport http ${MCP_SERVER_NAME} ${MCP_ENDPOINT}`

export default function McpIntegration() {
  return (
    <Page>
      <PageHeader
        title="MCP Integration"
        sub="Connect Applywell to assistants and agents that speak the Model Context Protocol, so they can read and manage your applications for you."
      />

      <div className="max-w-settings">
        <Card
          icon={<PlugIcon size={17} />}
          title="MCP endpoint"
          sub="Point any MCP-compatible client at this URL."
          badges={['Remote MCP', 'OAuth']}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mcp-endpoint" className="text-[12.5px] font-medium text-mono-2">
                Server URL
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="mcp-endpoint"
                  className="field-input mono text-[12.5px] sm:text-[13.5px]"
                  value={MCP_ENDPOINT}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <CopyButton value={MCP_ENDPOINT} subject="endpoint" className="justify-center" />
              </div>
            </div>

            <div className="text-[13px] leading-[1.6] text-mono-2">
              The endpoint is authenticated with <Ui>OAuth</Ui>. Clients that support it open the
              Applywell sign-in and authorization screen the first time they connect — approve it
              there and the client stores the session on its own. Nothing else has to be configured.
            </div>

            <Note>
              Never paste an access token, API key or password into a client to reach this endpoint.
              Applywell does not use them for MCP and never asks for them on this page.
            </Note>
          </div>
        </Card>

        <SectionLabel
          title="Client setup"
          more={
            <span className="hidden sm:inline">Follow the official docs if a client's UI changed</span>
          }
        />

        <Card
          icon={<ChatIcon />}
          title="ChatGPT"
          titleAs="h3"
          sub="Add Applywell as a remote MCP connector."
          badges={['Developer mode']}
          action={<DocLink href={MCP_DOC_LINKS.chatgpt}>Official documentation</DocLink>}
        >
          <Steps
            items={[
                <>
                  Open <Ui>Settings → Connectors</Ui> and enable <Ui>Developer mode</Ui> in the
                  advanced settings. Availability depends on your ChatGPT plan — the official article
                  linked above lists the current requirements and limitations.
                </>,
                <>
                  Still under <Ui>Connectors</Ui>, create a new connector and paste the Applywell
                  endpoint as the MCP server URL.
                  <CodeBlock code={MCP_ENDPOINT} subject="endpoint for ChatGPT" />
                </>,
                <>
                  Choose <Ui>OAuth</Ui> as the authentication method and continue. ChatGPT opens the
                  Applywell authorization screen — sign in and approve access.
                </>,
                <>
                  Start a chat, enable the connector from the composer, and ask something like
                  “list my open applications” to confirm the tools are reachable.
                </>,
              ]}
          />
        </Card>

        <Card
          icon={<TerminalIcon />}
          title="Codex"
          titleAs="h3"
          sub="Register the remote server in the Codex CLI, IDE extension or desktop app."
          badges={['Streamable HTTP']}
          action={<DocLink href={MCP_DOC_LINKS.codex}>Official documentation</DocLink>}
        >
          <Steps
            items={[
                <>
                  Add a Streamable HTTP server to <Code>~/.codex/config.toml</Code> (or a
                  project-scoped <Code>.codex/config.toml</Code>):
                  <CodeBlock code={CODEX_CONFIG} subject="Codex configuration" />
                </>,
                <>
                  Authenticate the server. Codex opens the OAuth flow in your browser and stores the
                  credentials itself.
                  <CodeBlock code={CODEX_LOGIN} subject="Codex login command" />
                </>,
                <>
                  Run <Code>/mcp</Code> in the Codex TUI — or open <Ui>MCP servers</Ui> in the IDE
                  extension and desktop app — to confirm <Code>{MCP_SERVER_NAME}</Code> is connected.
                  <Code>codex mcp list</Code> shows the same from the CLI.
                </>,
              ]}
          />
        </Card>

        <Card
          icon={<SparkIcon />}
          title="Claude / Claude Code"
          titleAs="h3"
          sub="Add the remote server to Claude Code, or as a custom connector in the Claude apps."
          badges={['HTTP transport']}
          action={<DocLink href={MCP_DOC_LINKS.claudeCode}>Official documentation</DocLink>}
        >
          <Steps
            items={[
                <>
                  In Claude Code, add the endpoint over the HTTP transport. Append{' '}
                  <Code>--scope user</Code> to make it available in every project.
                  <CodeBlock code={CLAUDE_ADD} subject="Claude Code command" />
                </>,
                <>
                  Run <Code>/mcp</Code> inside Claude Code, select <Ui>{MCP_SERVER_NAME}</Ui> and
                  choose <Ui>Authenticate</Ui>. Claude Code opens the browser to finish the OAuth
                  authorization, then reports the server as connected.
                </>,
                <>
                  In the Claude apps, open <Ui>Settings → Connectors → Add custom connector</Ui> and
                  paste the same endpoint. The authorization step is identical.
                </>,
              ]}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <DocLink href={MCP_DOC_LINKS.claudeMcp}>MCP overview</DocLink>
            <DocLink href={MCP_DOC_LINKS.claudeCli}>Claude Code CLI usage</DocLink>
          </div>
        </Card>

        <Card
          icon={<PlugIcon size={17} />}
          title="Other MCP clients"
          titleAs="h3"
          sub="Anything that speaks Remote MCP over Streamable HTTP with OAuth."
          action={<DocLink href={MCP_DOC_LINKS.spec}>MCP documentation</DocLink>}
        >
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-[1.6] text-mono-2">
              There is nothing client-specific about the endpoint. If your client supports remote MCP
              servers, register the URL below and let it run the OAuth flow — then check that
              client's own documentation for where server configuration lives.
            </p>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-[140px_1fr]">
              <dt className="text-[12.5px] font-medium text-mono-2">Transport</dt>
              <dd className="font-mono text-[12.5px] text-mono-5">Streamable HTTP (remote)</dd>
              <dt className="text-[12.5px] font-medium text-mono-2">Authentication</dt>
              <dd className="font-mono text-[12.5px] text-mono-5">OAuth (authorization code + PKCE)</dd>
              <dt className="text-[12.5px] font-medium text-mono-2">Manual credentials</dt>
              <dd className="font-mono text-[12.5px] text-mono-5">None</dd>
            </dl>

            <CodeBlock code={MCP_ENDPOINT} subject="endpoint for other clients" />
          </div>
        </Card>
      </div>
    </Page>
  )
}
