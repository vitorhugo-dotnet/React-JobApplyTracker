import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { getGitHubProfile } from '@/api/github'
import { useAsync } from '@/hooks/useAsync'

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded border border-mono-e5">
      <div className="px-[18px] pb-3.5 pt-4">
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-mono-9">{sub}</div>}
      </div>
      <hr className="border-mono-e5" />
      <div className="p-[18px]">{children}</div>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

/**
 * Presentation-only fallback used while the profile is loading or when the backend cannot reach
 * GitHub. It is never treated as the identity of the account - that is the numeric user ID the
 * backend resolves the profile from.
 */
const FALLBACK_GITHUB_URL = import.meta.env.VITE_GITHUB_URL || 'https://github.com/vitorhugo-dotnet'

function stripGitHubHost(url: string) {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/+$/, '')
}

export default function Developer() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const apiRoot = apiBase.replace(/\/api.*/, '')
  const swaggerUrl = `${apiRoot}/swagger-ui.html`

  // The account is referenced by its stable GitHub user ID; the login and URL below are whatever
  // GitHub reports right now, so renaming the account does not break this link.
  const { data: profile } = useAsync(getGitHubProfile, [])
  const githubUrl = profile?.htmlUrl || FALLBACK_GITHUB_URL
  const githubLabel = profile?.login || stripGitHubHost(FALLBACK_GITHUB_URL)

  return (
    <Page>
      <PageHeader title="Developer Tools" sub="API access and source code" />
      <div className="max-w-settings">
        <Card title="API Access" sub="Base URL and interactive docs for the tracker REST API">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-mono-2">API base URL</label>
              <div className="flex gap-2">
                <input className="field-input mono" value={apiBase} readOnly />
                <Button onClick={() => navigator.clipboard?.writeText(apiBase)}>Copy</Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={swaggerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                Open Swagger UI ↗
              </a>
              <span className="font-mono text-[10.5px] text-mono-9">
                Interactive API documentation
              </span>
            </div>
          </div>
        </Card>

        <Card title="Source Code" sub="Browse the codebase on GitHub">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-mono-e5 text-mono-5">
              <GitHubIcon />
            </div>
            <div className="flex-1">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13.5px] font-medium text-mono-1 hover:underline"
              >
                {githubLabel}
              </a>
              <div className="text-[12px] text-mono-9">Frontend &amp; backend repositories</div>
            </div>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
            >
              View on GitHub ↗
            </a>
          </div>
        </Card>
      </div>
    </Page>
  )
}
