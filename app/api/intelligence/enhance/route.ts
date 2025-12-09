import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Get unprocessed items (limit to 10 per run to manage API costs)
  const { data: items, error: fetchError } = await supabase
    .from('intelligence_items')
    .select('*')
    .is('ai_summary', null)
    .order('published_at', { ascending: false })
    .limit(10)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No items to process' })
  }

  const processed = []
  const errors = []

  for (const item of items) {
    try {
      const analysis = await analyzeIntelligenceItem(item)

      const { error: updateError } = await supabase
        .from('intelligence_items')
        .update({
          ai_summary: analysis.summary,
          ai_relevance_score: analysis.relevanceScore,
          ai_tags: analysis.tags || [],
          ai_competitors_mentioned: analysis.competitors || [],
          ai_action_required: analysis.actionRequired || false,
        })
        .eq('id', item.id)

      if (updateError) {
        errors.push({ item: item.id, error: updateError.message })
      } else {
        processed.push(item.id)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push({ item: item.id, error: errorMessage })
      console.error(`Error processing item ${item.id}:`, errorMessage)
    }
  }

  return NextResponse.json({
    processed: processed.length,
    processedIds: processed,
    errors: errors.length > 0 ? errors : undefined,
  })
}

async function analyzeIntelligenceItem(item: any) {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const prompt = `Analyze this accounting industry news item for a UK Top 70 accounting firm focused on AI adoption.

Title: ${item.title}
Summary: ${item.summary || 'No summary available'}
Source: ${item.source_name}
Category: ${item.category}

Provide a JSON response with the following structure:
{
  "summary": "2-3 sentence summary focused on implications for mid-tier UK accounting firms",
  "relevanceScore": 1-10 (10 = directly relevant to AI in accounting),
  "tags": ["ai", "audit", "tax", "regulation", etc.],
  "competitors": ["RSM", "BDO", etc. if mentioned],
  "actionRequired": true/false (if RPGCC should take action)
}

Only return valid JSON, no other text.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai.torsor.co.uk',
      'X-Title': 'RPGCC AI Portal',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenRouter response')
  }

  // Parse JSON from response (may have markdown code blocks)
  let jsonContent = content.trim()
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/```$/, '').trim()
  }

  try {
    const analysis = JSON.parse(jsonContent)
    return {
      summary: analysis.summary || null,
      relevanceScore: Math.max(1, Math.min(10, analysis.relevanceScore || 5)),
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      competitors: Array.isArray(analysis.competitors) ? analysis.competitors : [],
      actionRequired: Boolean(analysis.actionRequired),
    }
  } catch (parseError) {
    console.error('Failed to parse AI analysis:', jsonContent)
    throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
  }
}

