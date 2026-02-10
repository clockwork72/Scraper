import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { PageShell } from './components/layout/PageShell'
import { LauncherView } from './components/launcher/LauncherView'
import { ResultsView } from './components/results/ResultsView'
import { ExplorerView } from './components/explorer/ExplorerView'
import { AnalyticsView } from './components/analytics/AnalyticsView'
import { DatabaseView } from './components/database/DatabaseView'
import { SettingsView } from './components/settings/SettingsView'
import { NavId, Theme } from './types'
import { computeResults } from './utils/results'

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s'
  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  return `${seconds}s`
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [activeNav, setActiveNav] = useState<NavId>('launcher')
  const [topN, setTopN] = useState('1000')
  const [hasRun, setHasRun] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<any | null>(null)
  const [explorerData, setExplorerData] = useState<any[] | null>(null)
  const [stateData, setStateData] = useState<any | null>(null)
  const [clearing, setClearing] = useState(false)
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null)
  const [etaText, setEtaText] = useState<string>('')
  const [useCrux, setUseCrux] = useState(false)
  const [cruxApiKey, setCruxApiKey] = useState('')
  const [currentSite, setCurrentSite] = useState<string>('')
  const [excludeSameEntity, setExcludeSameEntity] = useState(false)

  const siteSteps = ['Home fetch', 'Policy discovery', '3P extraction', '3P policy fetch']
  const siteStageToIndex: Record<string, number> = {
    home_fetch: 0,
    policy_discovery: 1,
    third_party_extract: 2,
    third_party_policy_fetch: 3,
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const resultsMetrics = useMemo(() => computeResults(hasRun, progress), [hasRun, progress])

  useEffect(() => {
    if (!window.scraper) return
    const scraper = window.scraper
    scraper.onEvent((event) => {
      if (event?.type === 'run_started') {
        setHasRun(true)
        setRunning(true)
        setProgress(0)
        setErrorMessage(null)
        setRunStartedAt(Date.now())
        setEtaText('')
        setCurrentSite('')
        setStepIndex(0)
      }
      if (event?.type === 'run_progress') {
        const processed = Number(event.processed || 0)
        const total = Number(event.total || 0)
        if (total > 0) {
          setProgress(Math.min(100, (processed / total) * 100))
        }
      }
      if (event?.type === 'site_started') {
        if (event.site) setCurrentSite(event.site)
        setStepIndex(0)
      }
      if (event?.type === 'site_stage') {
        if (event.site) setCurrentSite(event.site)
        if (event.stage && event.stage in siteStageToIndex) {
          setStepIndex(siteStageToIndex[event.stage])
        }
      }
      if (event?.type === 'run_completed') {
        setRunning(false)
        setProgress(100)
        setEtaText('0s')
        setStepIndex(3)
      }
      if (event?.type === 'site_started' && event.site) {
        setLogs((prev) => [...prev, `Processing ${event.site}`].slice(-50))
      }
      if (event?.type === 'site_finished' && event.site) {
        setLogs((prev) => [...prev, `Finished ${event.site} (${event.status})`].slice(-50))
      }
    })
    scraper.onLog((evt) => {
      if (evt?.message) {
        setLogs((prev) => [...prev, evt.message].slice(-50))
      }
    })
    scraper.onError((evt) => {
      if (evt?.message) {
        setErrorMessage(String(evt.message))
        setLogs((prev) => [...prev, `ERROR: ${evt.message}`].slice(-50))
      }
      setRunning(false)
    })
    scraper.onExit((evt) => {
      if (evt?.code && Number(evt.code) !== 0) {
        setErrorMessage(`Scraper exited with code ${evt.code}`)
      }
      setRunning(false)
    })
  }, [])

  const startRun = async () => {
    if (!topN || Number(topN) <= 0) return
    setErrorMessage(null)
    setLogs([])
    setSummaryData(null)
    setExplorerData(null)
    if (window.scraper) {
      const res = await window.scraper.startRun({
        topN: Number(topN),
        trackerRadarIndex: 'tracker_radar_index.json',
        outDir: 'outputs',
        artifactsDir: 'outputs/artifacts',
        cruxFilter: useCrux,
        cruxApiKey: useCrux ? cruxApiKey : undefined,
        excludeSameEntity: excludeSameEntity,
      })
      if (!res.ok) {
        setErrorMessage(res.error || 'Failed to start scraper')
      } else {
        setHasRun(true)
        setRunning(true)
        setProgress(0)
        setStepIndex(0)
        setRunStartedAt(Date.now())
        setEtaText('')
      }
      return
    }
    setHasRun(true)
    setRunning(true)
    setProgress(0)
    setStepIndex(0)
    setRunStartedAt(Date.now())
    setEtaText('')
  }

  useEffect(() => {
    if (!running) return
    if (!window.scraper) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(100, prev + 4 + Math.random() * 6))
      }, 520)
      return () => clearInterval(timer)
    }
  }, [running])

  useEffect(() => {
    if (!running) return
    if (window.scraper) return
    if (progress >= 100) {
      setRunning(false)
      setStepIndex(3)
      return
    }
    const nextStep = progress < 25 ? 0 : progress < 50 ? 1 : progress < 75 ? 2 : 3
    setStepIndex(nextStep)
  }, [progress, running])

  useEffect(() => {
    if (!running || !runStartedAt || progress <= 0) {
      if (!running) setEtaText('')
      return
    }
    const effectiveProgress =
      stateData?.total_sites && stateData?.processed_sites
        ? (stateData.processed_sites / Math.max(1, stateData.total_sites)) * 100
        : progress
    if (effectiveProgress <= 0) return
    const elapsedMs = Date.now() - runStartedAt
    const totalMs = elapsedMs / (effectiveProgress / 100)
    const remainingMs = Math.max(0, totalMs - elapsedMs)
    setEtaText(formatDuration(remainingMs))
  }, [progress, running, runStartedAt, stateData])

  useEffect(() => {
    if (!window.scraper || !hasRun) return
    const interval = setInterval(async () => {
      try {
        const summary = await window.scraper?.readSummary()
        if (summary?.ok) setSummaryData(summary.data)
        const state = await window.scraper?.readState()
        if (state?.ok) {
          setStateData(state.data)
          if (state.data?.total_sites && state.data?.processed_sites && running) {
            const computed = (state.data.processed_sites / Math.max(1, state.data.total_sites)) * 100
            setProgress(Math.min(100, computed))
          }
          if (!runStartedAt && state.data?.processed_sites) {
            setRunStartedAt(Date.now())
          }
        }
        const explorer = await window.scraper?.readExplorer(undefined, 500)
        if (explorer?.ok && Array.isArray(explorer.data)) {
          const cleaned = explorer.data.filter((rec: any) => rec && rec.site)
          setExplorerData(cleaned)
        }
      } catch (error) {
        setErrorMessage(String(error))
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [hasRun])

  const clearResults = async (includeArtifacts?: boolean) => {
    if (!window.scraper) {
      setSummaryData(null)
      setExplorerData(null)
      setStateData(null)
      setHasRun(false)
      setProgress(0)
      setLogs([])
      return
    }
    setClearing(true)
    const res = await window.scraper.clearResults({ includeArtifacts, outDir: 'outputs' })
    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to clear results')
    } else {
      setSummaryData(null)
      setExplorerData(null)
      setStateData(null)
      setHasRun(false)
      setProgress(0)
      setLogs([])
    }
    setClearing(false)
  }

  const stopRun = async () => {
    if (!window.scraper) return
    setLogs((prev) => [...prev, 'Stop requested'].slice(-50))
    const res = await window.scraper.stopRun()
    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to stop scraper')
      return
    }
    setRunning(false)
    setLogs((prev) => [...prev, 'Stop signal sent'].slice(-50))
  }

  const pageTitle = {
    launcher: 'Scraper Launcher',
    results: 'Results',
    explorer: 'Explorer',
    analytics: 'Analytics',
    database: 'Database',
    settings: 'Settings',
  }[activeNav]

  const pageSubtitle = {
    launcher: 'Minimal control surface for the dataset pipeline.',
    results: 'Outcome overview of the latest scrape.',
    explorer: 'Browse scraped sites and their policy links.',
    analytics: 'Operational metrics and crawl performance.',
    database: 'Artifact storage and dataset exports.',
    settings: 'Theme and default crawl preferences.',
  }[activeNav]

  return (
    <div className="min-h-screen">
      <Sidebar activeNav={activeNav} onSelect={setActiveNav} />
      <PageShell title={pageTitle} subtitle={pageSubtitle}>
        {activeNav === 'launcher' && (
          <LauncherView
            steps={siteSteps}
            currentSite={currentSite}
            topN={topN}
            onTopNChange={setTopN}
            onStart={startRun}
            onStop={stopRun}
            hasRun={hasRun}
            running={running}
            progress={progress}
            stepIndex={stepIndex}
            resultsReady={resultsMetrics.resultsReady}
            onViewResults={() => setActiveNav('results')}
            logs={logs}
            errorMessage={errorMessage || undefined}
            etaText={etaText}
            useCrux={useCrux}
            onToggleCrux={setUseCrux}
            cruxApiKey={cruxApiKey}
            onCruxKeyChange={setCruxApiKey}
            excludeSameEntity={excludeSameEntity}
            onToggleExcludeSameEntity={setExcludeSameEntity}
          />
        )}
        {activeNav === 'results' && (
          <ResultsView
            hasRun={hasRun}
            progress={progress}
            topN={topN}
            metrics={resultsMetrics}
            summary={summaryData}
            useCrux={useCrux}
          />
        )}
        {activeNav === 'explorer' && (
          <ExplorerView hasRun={hasRun} progress={progress} sites={explorerData || undefined} />
        )}
        {activeNav === 'analytics' && <AnalyticsView summary={summaryData} state={stateData} />}
        {activeNav === 'database' && (
          <DatabaseView
            summary={summaryData}
            state={stateData}
            onClear={clearResults}
            clearing={clearing}
          />
        )}
        {activeNav === 'settings' && <SettingsView theme={theme} onThemeChange={setTheme} />}
      </PageShell>
    </div>
  )
}

export default App
