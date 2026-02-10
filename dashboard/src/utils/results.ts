import { baseResults } from '../data/results'

export type ResultsMetrics = {
  resultFraction: number
  totalSitesProcessed: number
  statusOk: number
  statusPolicyNotFound: number
  statusNonBrowsable: number
  statusHomeFailed: number
  successRate: number
  thirdPartyPolicies: number
  radarMapped: number
  radarUnmapped: number
  radarNoPolicy: number
  resultsReady: boolean
  entityMax: number
  categoryMax: number
  statusTotal: number
  mappedRatio: number
  unmappedRatio: number
  noPolicyRatio: number
}

export function computeResults(hasRun: boolean, progress: number): ResultsMetrics {
  const resultFraction = hasRun ? Math.min(1, Math.max(0, progress / 100)) : 0
  const totalSitesProcessed = Math.round(baseResults.totalSites * resultFraction)
  const statusOk = Math.round(baseResults.statuses.ok * resultFraction)
  const statusPolicyNotFound = Math.round(baseResults.statuses.policyNotFound * resultFraction)
  const statusNonBrowsable = Math.round(baseResults.statuses.nonBrowsable * resultFraction)
  const statusHomeFailed = Math.round(baseResults.statuses.homeFailed * resultFraction)
  const successRate = totalSitesProcessed ? Math.round((statusOk / totalSitesProcessed) * 100) : 0
  const thirdPartyPolicies = Math.round(baseResults.thirdPartyPolicies * resultFraction)
  const radarMapped = Math.round(baseResults.radarMapped * resultFraction)
  const radarUnmapped = Math.round(baseResults.radarUnmapped * resultFraction)
  const radarNoPolicy = Math.round(baseResults.radarNoPolicyUrl * resultFraction)
  const resultsReady = hasRun && progress >= 100
  const entityMax = Math.max(...baseResults.entities.map((entity) => entity.prevalence))
  const categoryMax = Math.max(...baseResults.categories.map((cat) => cat.count))
  const statusTotal = Math.max(1, statusOk + statusPolicyNotFound + statusNonBrowsable + statusHomeFailed)
  const mappedRatio = Math.round((radarMapped / Math.max(1, thirdPartyPolicies)) * 100)
  const unmappedRatio = Math.round((radarUnmapped / Math.max(1, thirdPartyPolicies)) * 100)
  const noPolicyRatio = Math.max(0, 100 - mappedRatio - unmappedRatio)

  return {
    resultFraction,
    totalSitesProcessed,
    statusOk,
    statusPolicyNotFound,
    statusNonBrowsable,
    statusHomeFailed,
    successRate,
    thirdPartyPolicies,
    radarMapped,
    radarUnmapped,
    radarNoPolicy,
    resultsReady,
    entityMax,
    categoryMax,
    statusTotal,
    mappedRatio,
    unmappedRatio,
    noPolicyRatio,
  }
}
