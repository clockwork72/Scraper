type DatabaseViewProps = {
  summary?: any
  state?: any
  onClear: (includeArtifacts?: boolean) => void
  clearing?: boolean
}

export function DatabaseView({ summary, state, onClear, clearing }: DatabaseViewProps) {
  const processed = summary?.processed_sites ?? state?.processed_sites ?? 0
  const total = summary?.total_sites ?? state?.total_sites ?? 0
  const thirdParty = summary?.third_party || {}

  return (
    <>
      <section className="card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Storage</p>
            <h2 className="text-lg font-semibold">Artifacts & outputs</h2>
            <p className="text-xs text-[var(--muted-text)]">Local dataset footprint and export tools.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="focusable rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs">
              Export JSONL
            </button>
            <button
              className="focusable rounded-full border border-[var(--color-danger)] px-4 py-2 text-xs text-white"
              onClick={() => onClear(false)}
              disabled={clearing}
            >
              Clear results
            </button>
            <button
              className="focusable rounded-full border border-[var(--border-soft)] px-4 py-2 text-xs"
              onClick={() => onClear(true)}
              disabled={clearing}
            >
              Clear + artifacts
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-black/20 p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-text)]">
              <span>Records processed</span>
              <span>{processed.toLocaleString()} / {total || '—'}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: total ? `${Math.min(100, (processed / total) * 100)}%` : '0%' }}
              />
            </div>
            <div className="mt-4 grid gap-3 text-xs">
              {[
                { label: 'Third-party total', value: thirdParty.total ?? '—' },
                { label: 'Mapped', value: thirdParty.mapped ?? '—' },
                { label: 'Unmapped', value: thirdParty.unmapped ?? '—' },
                { label: 'No policy URL', value: thirdParty.no_policy_url ?? '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[var(--muted-text)]">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Exports</p>
            <h3 className="text-lg font-semibold">Quick actions</h3>
            <div className="mt-4 grid gap-3 text-xs">
              {[
                { label: 'results.jsonl', detail: 'Raw crawl output', action: 'Open' },
                { label: 'results.summary.json', detail: 'Aggregated metrics', action: 'Open' },
                { label: 'run_state.json', detail: 'Live counters', action: 'Open' },
                { label: 'explorer.jsonl', detail: 'Explorer data', action: 'Open' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-black/10 px-3 py-2"
                >
                  <div>
                    <p className="mono text-[var(--muted-text)]">{row.label}</p>
                    <p className="text-[10px] text-[var(--muted-text)]">{row.detail}</p>
                  </div>
                  <button className="focusable rounded-full border border-[var(--border-soft)] px-3 py-1">
                    {row.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">Health</p>
            <h3 className="text-lg font-semibold">Dataset integrity</h3>
          </div>
          <span className="text-xs text-[var(--muted-text)]">Updated {summary?.updated_at ?? state?.updated_at ?? '—'}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'JSONL valid', value: summary ? 'OK' : '—' },
            { label: 'Policies extracted', value: summary?.success_rate ? `${summary.success_rate}%` : '—' },
            { label: 'Third-party mapped', value: thirdParty.mapped ? `${thirdParty.mapped}` : '—' },
            { label: 'Artifacts present', value: '—' },
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
