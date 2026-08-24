/** Pure CSS/SVG monochrome charts — no chart library, no color fills. */

/* Theme tokens rather than literals so the scale inverts with dark mode. */
const GRAYS = ['var(--mono-0)', 'var(--mono-2)', 'var(--mono-5)', 'var(--mono-9)', 'var(--mono-c)']

export interface FunnelStep {
  label: string
  value: number
}

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value || 1
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((step, i) => {
        const widthPct = Math.max(6, Math.round((step.value / top) * 100))
        const rate = Math.round((step.value / top) * 100)
        return (
          <div key={step.label} className="flex items-center gap-3.5">
            <span className="w-[110px] shrink-0 text-[12.5px] text-mono-2">{step.label}</span>
            <div className="flex-1">
              <div
                className="flex h-[30px] items-center rounded-[3px] pl-3 font-mono text-[12px]"
                style={{
                  width: `${widthPct}%`,
                  background: GRAYS[Math.min(i, GRAYS.length - 1)],
                  color: i >= 3 ? 'var(--mono-2)' : 'var(--mono-w)',
                }}
              >
                {step.value}
              </div>
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[11.5px] text-mono-9">{rate}%</span>
          </div>
        )
      })}
    </div>
  )
}

export interface Bar {
  label: string
  value: number
}

export function VerticalBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="flex h-40 items-end gap-2.5 pt-2">
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="font-mono text-[10.5px] text-mono-5">{bar.value}</div>
          <div
            className="w-full max-w-[38px] rounded-t-[3px]"
            style={{ height: `${(bar.value / max) * 100}%`, background: GRAYS[i % GRAYS.length] }}
          />
          <div className="font-mono text-[10.5px] text-mono-9">{bar.label}</div>
        </div>
      ))}
    </div>
  )
}

export function HBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="flex flex-col gap-3">
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-[12.5px] text-mono-2">{bar.label}</span>
          <div className="h-[18px] flex-1 overflow-hidden rounded-[3px] bg-mono-f5">
            <div
              className="h-full rounded-[3px]"
              style={{ width: `${(bar.value / max) * 100}%`, background: GRAYS[i % GRAYS.length] }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[11.5px] text-mono-5">{bar.value}</span>
        </div>
      ))}
    </div>
  )
}

export interface LinePoint {
  label: string
  value: number
}

export function LineChart({ points }: { points: LinePoint[] }) {
  if (points.length === 0) return null
  const max = Math.max(1, ...points.map((p) => p.value))
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: 100 - (p.value / max) * 90 - 5,
  }))
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `0,100 ${line} 100,100`

  return (
    <>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="block h-[150px] w-full">
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--mono-f5)" strokeWidth="0.4" />
        <line x1="0" y1="95" x2="100" y2="95" stroke="var(--mono-e5)" strokeWidth="0.4" />
        <polygon points={area} fill="var(--mono-f5)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--mono-1)"
          strokeWidth="0.9"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="0.9" fill="var(--mono-0)" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-mono-9">
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2) ? (
            <span key={p.label}>{p.label}</span>
          ) : null,
        )}
      </div>
    </>
  )
}
