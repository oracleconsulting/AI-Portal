import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Note: Install @anthropic-ai/sdk: npm install @anthropic-ai/sdk
// Or use OpenAI: npm install openai

// Using dynamic import to avoid build errors if package not installed
import Anthropic from '@anthropic-ai/sdk'

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

  // Check if Anthropic is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI summarization not configured. Please set ANTHROPIC_API_KEY environment variable.' },
      { status: 503 }
    )
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Using available model
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
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract action items using another call
    const actionItemsMessage = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
    })

    let actionItems: any[] = []
    try {
      const actionItemsText = actionItemsMessage.content[0].type === 'text' 
        ? actionItemsMessage.content[0].text 
        : '[]'
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = actionItemsText.match(/\[[\s\S]*\]/)
      actionItems = jsonMatch ? JSON.parse(jsonMatch[0]) : []
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

