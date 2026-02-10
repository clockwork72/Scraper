type AnalyticsViewProps = {
  summary?: any
  state?: any
}

export function AnalyticsView({ summary, state }: AnalyticsViewProps) {
  const processed = state?.processed_sites ?? summary?.processed_sites ?? 0
  const total = state?.total_sites ?? summary?.total_sites ?? 0
  const successRate = summary?.success_rate ?? 0
  const statusCounts = summary?.status_counts || state?.status_counts || {}
  const ok = statusCounts.ok ?? 0
  const failures =
    (statusCounts.policy_not_found ?? 0) +
    (statusCounts.non_browsable ?? 0) +
    (statusCounts.home_fetch_failed ?? 0)

  return (
    <>
      <section className="card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Run health</p>
            <h2 className="text-lg font-semibold">Scraper performance</h2>
            <p className="text-xs text-[var(--muted-text)]">Live run stats from the scraper state file.</p>
          </div>
          <span className="theme-chip rounded-full px-3 py-1 text-xs">Processed {processed.toLocaleString()}</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total sites', value: total ? total.toLocaleString() : '—' },
            { label: 'Processed', value: processed.toLocaleString() },
            { label: 'Success rate', value: `${successRate}%` },
            { label: 'Failures', value: failures.toLocaleString() },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-[var(--border-soft)] bg-black/20 px-4 py-3">
              <p className="text-xs text-[var(--muted-text)]">{row.label}</p>
              <p className="text-lg font-semibold">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 text-xs">
          {[
            { label: 'OK', value: ok },
            { label: 'Policy not found', value: statusCounts.policy_not_found ?? 0 },
            { label: 'Non-browsable', value: statusCounts.non_browsable ?? 0 },
            { label: 'Home fetch failed', value: statusCounts.home_fetch_failed ?? 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="w-40 text-[var(--muted-text)]">{row.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{
                    width: total ? `${Math.min(100, (row.value / Math.max(1, total)) * 100)}%` : '0%',
                  }}
                />
              </div>
              <span className="text-[var(--muted-text)]">{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Timing</p>
            <h3 className="text-lg font-semibold">Scrape duration</h3>
          </div>
          <span className="text-xs text-[var(--muted-text)]">Updated {state?.updated_at ?? summary?.updated_at ?? '—'}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Started', value: summary?.started_at ?? '—' },
            { label: 'Updated', value: summary?.updated_at ?? '—' },
            { label: 'Run ID', value: summary?.run_id ?? '—' },
            { label: 'Processed', value: processed.toLocaleString() },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-[var(--border-soft)] bg-black/20 px-4 py-3">
              <p className="text-xs text-[var(--muted-text)]">{row.label}</p>
              <p className="text-sm font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card rounded-2xl p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Resource usage</p>
          <h3 className="text-lg font-semibold">System snapshot</h3>
          <p className="text-xs text-[var(--muted-text)]">Hook real CPU/RAM metrics via preload if needed.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'CPU', value: '—' },
            { label: 'RAM', value: '—' },
            { label: 'Network', value: '—' },
            { label: 'Disk', value: '—' },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-[var(--border-soft)] bg-black/20 px-4 py-3">
              <p className="text-xs text-[var(--muted-text)]">{row.label}</p>
              <p className="text-lg font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
