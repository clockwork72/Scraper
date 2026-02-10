export const baseResults = {
  totalSites: 1000,
  statuses: {
    ok: 912,
    policyNotFound: 58,
    nonBrowsable: 18,
    homeFailed: 12,
  },
  thirdPartyPolicies: 3620,
  radarMapped: 2950,
  radarUnmapped: 670,
  radarNoPolicyUrl: 420,
  categories: [
    { name: 'Analytics', count: 780 },
    { name: 'Advertising', count: 640 },
    { name: 'CDN', count: 520 },
    { name: 'Customer Support', count: 310 },
    { name: 'Social', count: 260 },
    { name: 'Content Delivery', count: 210 },
  ],
  entities: [
    { name: 'Google', prevalence: 0.062, categories: ['Analytics', 'Advertising'], domains: 214 },
    { name: 'Microsoft', prevalence: 0.041, categories: ['Analytics', 'CDN'], domains: 168 },
    { name: 'Meta', prevalence: 0.033, categories: ['Social', 'Advertising'], domains: 147 },
    { name: 'Cloudflare', prevalence: 0.028, categories: ['CDN'], domains: 112 },
    { name: 'Amazon', prevalence: 0.024, categories: ['CDN', 'Infrastructure'], domains: 96 },
    { name: 'Oracle', prevalence: 0.018, categories: ['Infrastructure'], domains: 74 },
  ],
}
