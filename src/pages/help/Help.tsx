import { Link } from 'react-router-dom'
import { Page, PageHeader } from '@/components/ui/PageHeader'

type HelpCardProps = {
  title: string
  children: React.ReactNode
  links?: { label: string; to: string }[]
}

function HelpCard({ title, children, links }: HelpCardProps) {
  return (
    <section className="rounded border border-mono-e5 bg-mono-w p-5">
      <h2 className="text-[15px] font-semibold text-mono-1">{title}</h2>
      <div className="mt-2 text-[13px] leading-6 text-mono-5">{children}</div>
      {links && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="text-[13px] font-medium text-mono-1 underline underline-offset-4 hover:text-mono-5">
              {link.label} →
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Help() {
  return (
    <Page>
      <PageHeader title="How to use Applywell" sub="A quick guide to the workflows you use most." />

      <div className="max-w-[960px]">
        <div className="grid gap-4 md:grid-cols-2">
          <HelpCard title="Get started" links={[{ label: 'Open dashboard', to: '/dashboard' }]}>
            Use the dashboard to see active applications, activity, and the next actions to take. Add each opportunity as soon as you decide to pursue it.
          </HelpCard>

          <HelpCard title="Create and manage applications" links={[{ label: 'Manage applications', to: '/applications' }]}>
            Keep the company, role, source, dates, notes, and follow-ups together in one application. Use the applications list to edit, archive, or create a new record.
          </HelpCard>

          <HelpCard title="Understand status and archive" links={[{ label: 'View applications', to: '/applications' }]}>
            <strong className="font-semibold text-mono-1">Changing a status and archiving are different actions.</strong> Status describes the stage or result of the selection process, such as Applied, Interview, Rejected, or Approved. Archiving only hides an application from the active list; it does not change its status or history.
          </HelpCard>

          <HelpCard title="Search and filters" links={[{ label: 'Search applications', to: '/applications' }]}>
            Search by role or company and combine filters to focus on status, date range, or Platform. Use the Active and Archived tabs to switch between current and archived records.
          </HelpCard>

          <HelpCard title="Resumes and base information" links={[{ label: 'Open account settings', to: '/account' }]}>
            Keep your resumes/CVs and reusable base information up to date so they are ready when you apply. This information can also support integrations that use your profile context.
          </HelpCard>

          <HelpCard title="Metrics, exports, and integrations" links={[
            { label: 'Explore metrics', to: '/metrics' },
            { label: 'Open exports', to: '/exports' },
            { label: 'Open MCP', to: '/mcp' },
          ]}>
            Use Metrics to understand your application pipeline, Exports to download your data, and MCP to connect compatible AI tools to Applywell.
          </HelpCard>
        </div>
      </div>
    </Page>
  )
}
