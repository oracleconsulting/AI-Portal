import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Parser from 'rss-parser'
import { getAllIntelligenceSources } from '@/lib/services/intelligence-feeds'

const parser = new Parser({
  timeout: 10000,
  maxRedirects: 5,
})

export async function POST(request: NextRequest) {
  // Verify cron secret or admin access
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if authorized (cron secret or admin user)
  if (secret !== process.env.CRON_SECRET && user?.email !== 'jhoward@rpgcc.co.uk') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    fetched: 0,
    new: 0,
    errors: [] as Array<{ source: string; error: string }>,
  }

  const sources = getAllIntelligenceSources()

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 20)) {
        // Skip if no URL
        if (!item.link) continue

        results.fetched++

        // Check if already exists
        const { data: existing } = await supabase
          .from('intelligence_items')
          .select('id')
          .eq('url', item.link)
          .single()

        if (!existing) {
          // Insert new item
          const { error: insertError } = await supabase.from('intelligence_items').insert({
            source_name: source.name,
            source_url: source.url,
            category: source.category,
            title: item.title || 'Untitled',
            summary: item.contentSnippet?.substring(0, 500) || item.content?.substring(0, 500) || null,
            url: item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          })

          if (!insertError) {
            results.new++
          } else {
            results.errors.push({ source: source.name, error: insertError.message })
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push({ source: source.name, error: errorMessage })
      console.error(`Error fetching feed ${source.name}:`, errorMessage)
    }
  }

  return NextResponse.json(results)
}

