import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // Check authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { transcriptId, transcriptText } = await req.json()

  if (!transcriptText) {
    return NextResponse.json({ error: 'No transcript text provided' }, { status: 400 })
  }

  // Check if OpenRouter is configured
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'AI summarization not configured. Please set OPENROUTER_API_KEY environment variable.' },
      { status: 503 }
    )
  }

  try {
    // Use OpenRouter API with Claude model
    const summaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai.torsor.co.uk',
        'X-Title': 'RPGCC AI Portal'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are analyzing a meeting transcript for RPGCC, an accounting firm implementing AI tools.

Please provide:
1. **Executive Summary** (2-3 sentences)
2. **Key Discussion Points** (bullet points)
3. **Decisions Made** (if any)
4. **Action Items** (with assignee if mentioned)
5. **AI Tools/Technologies Discussed** (if any)
6. **Risk or Compliance Concerns Raised** (if any)
7. **Next Steps**

Keep the summary concise and focused on actionable insights.

TRANSCRIPT:

${transcriptText}`,
          },
        ],
      }),
    })

    if (!summaryResponse.ok) {
      throw new Error(`OpenRouter API error: ${summaryResponse.statusText}`)
    }

    const summaryData = await summaryResponse.json()
    const summary = summaryData.choices?.[0]?.message?.content || ''

    // Extract action items using another call
    const actionItemsResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai.torsor.co.uk',
        'X-Title': 'RPGCC AI Portal'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Extract action items from this meeting transcript. Return as JSON array with format:
[{"action": "description", "assignee": "name or null", "due_date": "date mentioned or null", "priority": "high/medium/low"}]

Only return the JSON array, no other text.

TRANSCRIPT:

${transcriptText}`,
          },
        ],
      }),
    })

    let actionItems: any[] = []
    try {
      if (actionItemsResponse.ok) {
        const actionItemsData = await actionItemsResponse.json()
        const actionItemsText = actionItemsData.choices?.[0]?.message?.content || '[]'
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = actionItemsText.match(/\[[\s\S]*\]/)
        actionItems = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      }
    } catch {
      actionItems = []
    }

    // Save summary if transcriptId provided
    if (transcriptId) {
      await supabase
        .from('meeting_transcripts')
        .update({
          ai_summary: summary,
          ai_action_items: actionItems,
          ai_processed_at: new Date().toISOString(),
        })
        .eq('id', transcriptId)
    }

    return NextResponse.json({
      success: true,
      summary,
      actionItems,
    })
  } catch (error) {
    console.error('AI summarization error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

