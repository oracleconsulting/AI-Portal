import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AI Portal <noreply@torsor.co.uk>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai.torsor.co.uk'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: wrapInTemplate(html),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

function wrapInTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2D9CDB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #2D9CDB; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 8px; border: 1px solid #ddd; }
        td:first-child { font-weight: bold; background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RPGCC AI Portal</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from the RPGCC AI Portal.</p>
          <p><a href="${APP_URL}">Visit Portal</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Notification Types

export async function notifyFormStatusChange(params: {
  recipientEmail: string
  recipientName: string
  formTitle: string
  formId: string
  oldStatus: string
  newStatus: string
  changedBy: string
  notes?: string
}) {
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    in_progress: 'In Progress',
    completed: 'Completed',
  }

  const html = `
    <h2>Form Status Updated</h2>
    <p>Dear ${params.recipientName},</p>
    <p>The status of your AI implementation proposal has been updated:</p>
    <table>
      <tr>
        <td>Proposal:</td>
        <td>${params.formTitle}</td>
      </tr>
      <tr>
        <td>Previous Status:</td>
        <td>${statusLabels[params.oldStatus] || params.oldStatus}</td>
      </tr>
      <tr>
        <td>New Status:</td>
        <td>${statusLabels[params.newStatus] || params.newStatus}</td>
      </tr>
      <tr>
        <td>Changed By:</td>
        <td>${params.changedBy}</td>
      </tr>
    </table>
    ${params.notes ? `<p><strong>Notes:</strong> ${params.notes}</p>` : ''}
    <p style="margin-top: 20px;">
      <a href="${APP_URL}/implementation/forms/${params.formId}" class="button">View Proposal</a>
    </p>
  `

  return sendEmail({
    to: params.recipientEmail,
    subject: `[AI Portal] Your proposal status changed to ${statusLabels[params.newStatus] || params.newStatus}`,
    html,
  })
}

export async function notifyOversightReviewRequired(params: {
  oversightEmails: string[]
  formTitle: string
  formId: string
  submittedBy: string
  estimatedCost: number
  annualValue: number
  riskScore?: number
}) {
  const html = `
    <h2>New Proposal Requires Oversight Review</h2>
    <p>A new AI implementation proposal requires Oversight Committee review:</p>
    <table>
      <tr>
        <td>Proposal:</td>
        <td>${params.formTitle}</td>
      </tr>
      <tr>
        <td>Submitted By:</td>
        <td>${params.submittedBy}</td>
      </tr>
      <tr>
        <td>Estimated Cost:</td>
        <td>£${params.estimatedCost.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Annual Value:</td>
        <td>£${params.annualValue.toLocaleString()}</td>
      </tr>
      ${params.riskScore ? `
      <tr>
        <td>Risk Score:</td>
        <td>${params.riskScore}/5</td>
      </tr>
      ` : ''}
    </table>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}/oversight/reviews" class="button">Review Queue</a>
    </p>
  `

  // Send to all oversight members with rate limiting
  const results = []
  for (const email of params.oversightEmails) {
    const result = await sendEmail({
      to: email,
      subject: `[AI Portal] New proposal requires oversight review: ${params.formTitle}`,
      html,
    })
    results.push(result)
    // Rate limiting - Resend allows 2 requests per second
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  return results
}

export async function notifyReviewDue(params: {
  recipientEmail: string
  recipientName: string
  formTitle: string
  formId: string
  reviewType: string
  dueDate: string
  daysOverdue?: number
}) {
  const isOverdue = params.daysOverdue && params.daysOverdue > 0
  
  const html = `
    <h2>${isOverdue ? '⚠️ Overdue' : '📅 Upcoming'} Implementation Review</h2>
    <p>Dear ${params.recipientName},</p>
    <p>${isOverdue 
      ? `The following implementation review is ${params.daysOverdue} day(s) overdue:`
      : 'The following implementation review is due soon:'
    }</p>
    <table>
      <tr>
        <td>Implementation:</td>
        <td>${params.formTitle}</td>
      </tr>
      <tr>
        <td>Review Type:</td>
        <td>${params.reviewType.replace(/_/g, ' ')}</td>
      </tr>
      <tr>
        <td>Due Date:</td>
        <td>${params.dueDate}</td>
      </tr>
    </table>
    <p style="margin-top: 20px;">
      <a href="${APP_URL}/implementation/reviews/new?form_id=${params.formId}" class="button">Complete Review</a>
    </p>
  `

  return sendEmail({
    to: params.recipientEmail,
    subject: `[AI Portal] ${isOverdue ? 'OVERDUE: ' : ''}Implementation review due: ${params.formTitle}`,
    html,
  })
}

export async function notifyPolicyUpdate(params: {
  recipientEmails: string[]
  policyTitle: string
  policyId: string
  version: string
  summary: string
  requiresAcknowledgment: boolean
}) {
  const html = `
    <h2>Policy Update</h2>
    <p>A policy relevant to your role has been updated:</p>
    <table>
      <tr>
        <td>Policy:</td>
        <td>${params.policyTitle}</td>
      </tr>
      <tr>
        <td>Version:</td>
        <td>${params.version}</td>
      </tr>
      <tr>
        <td>Summary:</td>
        <td>${params.summary}</td>
      </tr>
    </table>
    ${params.requiresAcknowledgment ? `
      <p style="margin-top: 20px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
        <strong>⚠️ Action Required:</strong> Please review this policy and acknowledge that you have read and understood it.
      </p>
    ` : ''}
    <p style="margin-top: 20px;">
      <a href="${APP_URL}/oversight/policies/${params.policyId}" class="button">View Policy</a>
    </p>
  `

  // Send with rate limiting
  const results = []
  for (const email of params.recipientEmails) {
    const result = await sendEmail({
      to: email,
      subject: `[AI Portal] ${params.requiresAcknowledgment ? 'Action Required: ' : ''}Policy updated: ${params.policyTitle}`,
      html,
    })
    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  return results
}

// Weekly Digest

export async function sendWeeklyDigest(params: {
  recipientEmail: string
  recipientName: string
  pendingReviews: { title: string; dueDate: string; formId: string }[]
  newProposals: { title: string; team: string; value: number }[]
  toolUpdates: { name: string; status: string }[]
  pendingAcknowledgments: { title: string; policyId: string }[]
}) {
  const hasPendingItems = 
    params.pendingReviews.length > 0 || 
    params.newProposals.length > 0 || 
    params.toolUpdates.length > 0 ||
    params.pendingAcknowledgments.length > 0

  if (!hasPendingItems) return { success: true, skipped: true }

  let html = `
    <h2>Weekly AI Portal Digest</h2>
    <p>Dear ${params.recipientName},</p>
    <p>Here's your weekly summary from the AI Portal:</p>
  `

  if (params.pendingReviews.length > 0) {
    html += `
      <h3>📋 Pending Reviews (${params.pendingReviews.length})</h3>
      <ul>
        ${params.pendingReviews.map(r => 
          `<li><a href="${APP_URL}/implementation/forms/${r.formId}">${r.title}</a> - Due: ${r.dueDate}</li>`
        ).join('')}
      </ul>
    `
  }

  if (params.newProposals.length > 0) {
    html += `
      <h3>🆕 New Proposals This Week (${params.newProposals.length})</h3>
      <ul>
        ${params.newProposals.map(p => 
          `<li>${p.title} (${p.team}) - £${p.value.toLocaleString()}/yr</li>`
        ).join('')}
      </ul>
    `
  }

  if (params.toolUpdates.length > 0) {
    html += `
      <h3>🔧 Tool Registry Updates</h3>
      <ul>
        ${params.toolUpdates.map(t => 
          `<li>${t.name} - Status: ${t.status}</li>`
        ).join('')}
      </ul>
    `
  }

  if (params.pendingAcknowledgments.length > 0) {
    html += `
      <h3>⚠️ Policies Awaiting Your Acknowledgment</h3>
      <ul>
        ${params.pendingAcknowledgments.map(p => 
          `<li><a href="${APP_URL}/oversight/policies/${p.policyId}">${p.title}</a></li>`
        ).join('')}
      </ul>
    `
  }

  html += `
    <p style="margin-top: 20px;">
      <a href="${APP_URL}" class="button">Go to AI Portal</a>
    </p>
  `

  return sendEmail({
    to: params.recipientEmail,
    subject: '[AI Portal] Your Weekly Digest',
    html,
  })
}

