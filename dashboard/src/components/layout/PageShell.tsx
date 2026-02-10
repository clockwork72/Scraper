import { ReactNode } from 'react'

type PageShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="min-h-screen pl-[96px] pr-6 py-8 lg:pr-12">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] text-xs font-semibold">
          PR
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-[var(--muted-text)]">{subtitle}</p>
        </div>
      </header>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </main>
  )
}
