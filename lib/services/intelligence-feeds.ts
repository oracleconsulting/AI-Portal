// Intelligence feed sources configuration
// RSS feeds for industry news, regulatory updates, and competitor monitoring

export interface IntelligenceSource {
  name: string
  url: string
  category: 'industry' | 'regulatory' | 'technology' | 'competitor'
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export const INTELLIGENCE_SOURCES: Record<string, IntelligenceSource[]> = {
  // UK Accounting Industry
  industry: [
    {
      name: 'Accountancy Age',
      url: 'https://www.accountancyage.com/feed/',
      category: 'industry',
      priority: 'high',
    },
    {
      name: 'Accountancy Daily',
      url: 'https://www.accountancydaily.co/rss.xml',
      category: 'industry',
      priority: 'high',
    },
    {
      name: 'AccountingWEB UK',
      url: 'https://www.accountingweb.co.uk/rss.xml',
      category: 'industry',
      priority: 'medium',
    },
    {
      name: 'ICAEW Insights',
      url: 'https://www.icaew.com/insights/rss',
      category: 'industry',
      priority: 'high',
    },
  ],

  // Regulatory Bodies
  regulatory: [
    {
      name: 'FRC News',
      url: 'https://www.frc.org.uk/news/rss',
      category: 'regulatory',
      priority: 'critical',
    },
    {
      name: 'ICAEW Technical',
      url: 'https://www.icaew.com/technical/rss',
      category: 'regulatory',
      priority: 'high',
    },
    {
      name: 'FCA News',
      url: 'https://www.fca.org.uk/news/rss',
      category: 'regulatory',
      priority: 'medium',
    },
  ],

  // AI & Technology
  technology: [
    {
      name: 'AI News',
      url: 'https://www.artificialintelligence-news.com/feed/',
      category: 'technology',
      priority: 'medium',
    },
    {
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      category: 'technology',
      priority: 'low',
    },
    {
      name: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/feed/',
      category: 'technology',
      priority: 'medium',
    },
  ],

  // Competitor Monitoring
  // Note: These would typically be set up via Google Alerts RSS feeds
  // For now, we'll include placeholder structure
  competitor: [
    // Example structure - actual RSS feeds would come from Google Alerts
    // {
    //   name: 'RSM UK AI News',
    //   url: 'https://www.google.com/alerts/feeds/...',
    //   category: 'competitor',
    //   priority: 'high',
    // },
  ],
}

// Get all sources as a flat array
export function getAllIntelligenceSources(): IntelligenceSource[] {
  return Object.values(INTELLIGENCE_SOURCES).flat()
}

// Get sources by category
export function getSourcesByCategory(category: IntelligenceSource['category']): IntelligenceSource[] {
  return getAllIntelligenceSources().filter(source => source.category === category)
}

// Get high-priority sources
export function getHighPrioritySources(): IntelligenceSource[] {
  return getAllIntelligenceSources().filter(
    source => source.priority === 'high' || source.priority === 'critical'
  )
}

