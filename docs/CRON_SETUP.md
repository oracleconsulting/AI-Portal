# Cron Job Setup Guide

## What is Cron?

**Cron** is a time-based job scheduler that runs tasks automatically at specified intervals. Think of it as a "reminder system" for your server that says "do this task every day at 8 AM" or "run this every Monday."

In your case, we've created an API endpoint (`/api/cron/notifications`) that:
- Sends reminder emails for reviews that are due
- Sends weekly digest emails every Monday

## How It Works

Instead of traditional cron (which runs scripts on a server), we're using an **HTTP endpoint** that gets called on a schedule. This is better for cloud platforms like Railway.

### The Flow:
1. **External service** (cron service) calls your API endpoint at scheduled times
2. Your **API endpoint** checks what needs to be done
3. It **sends emails** to users who need reminders
4. Returns a **status report**

## Setup Options

### Option 1: Railway Cron Jobs (Recommended if available)

Railway may have built-in cron support. Check your Railway dashboard:

1. Go to your project in Railway
2. Look for "Cron Jobs" or "Scheduled Tasks" in the settings
3. Add a new cron job with:
   - **Schedule**: `0 8 * * *` (daily at 8 AM)
   - **URL**: `https://ai.torsor.co.uk/api/cron/notifications`
   - **Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

### Option 2: External Cron Service (Recommended)

Since Railway may not have built-in cron, use an external service:

#### A. EasyCron (Free tier available)
1. Sign up at https://www.easycron.com
2. Create a new cron job:
   - **URL**: `https://ai.torsor.co.uk/api/cron/notifications`
   - **Schedule**: `0 8 * * *` (daily at 8 AM)
   - **Method**: GET
   - **HTTP Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
3. Save and activate

#### B. Cron-Job.org (Free)
1. Sign up at https://cron-job.org
2. Create a new job:
   - **URL**: `https://ai.torsor.co.uk/api/cron/notifications`
   - **Schedule**: `0 8 * * *` (daily at 8 AM)
   - **Request Method**: GET
   - **Request Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
3. Save

#### C. GitHub Actions (Free for public repos)
If your code is on GitHub, you can use GitHub Actions:

Create `.github/workflows/cron-notifications.yml`:
```yaml
name: Send Notifications

on:
  schedule:
    # Run daily at 8 AM UTC
    - cron: '0 8 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notifications
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://ai.torsor.co.uk/api/cron/notifications
```

Then add `CRON_SECRET` to your GitHub repository secrets.

## Setting Up the CRON_SECRET

1. **Generate a secure random string:**
   ```bash
   # On Mac/Linux:
   openssl rand -hex 32
   
   # Or use an online generator:
   # https://www.random.org/strings/
   ```

2. **Add to Railway environment variables:**
   - Go to Railway project → Variables
   - Add: `CRON_SECRET` = `your-generated-secret-here`
   - Save

3. **Use the same secret** in your cron service configuration

## Schedule Examples

### Daily at 8 AM (for review reminders)
```
0 8 * * *
```

### Every Monday at 8 AM (for weekly digests)
```
0 8 * * 1
```

### Every 6 hours
```
0 */6 * * *
```

### Every day at 9 AM and 5 PM
```
0 9,17 * * *
```

### Cron Syntax Explained:
```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 and 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

## Testing Your Cron Job

### Manual Test (via Terminal)
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://ai.torsor.co.uk/api/cron/notifications
```

### Manual Test (via Browser)
You can't test via browser because it requires the Authorization header. Use:
- Postman
- curl (command line)
- Or create a test page that calls it

### Expected Response
```json
{
  "success": true,
  "timestamp": "2025-01-15T08:00:00.000Z",
  "results": {
    "reviewReminders": [...],
    "weeklyDigests": [...]
  }
}
```

## What Happens When Cron Runs

### Daily (8 AM):
1. Checks all forms with `status = 'in_progress'`
2. Finds reviews due in 5 days, 1 day, or overdue
3. Sends reminder emails to form owners
4. Skips if no reviews are due

### Weekly (Monday 8 AM):
1. Gets all users
2. For each user:
   - Finds their pending reviews
   - Finds new proposals from their committee this week
   - Finds policies they haven't acknowledged
3. Sends a weekly digest email
4. Skips users with no pending items

## Troubleshooting

### "Unauthorized" Error
- Check that `CRON_SECRET` is set in Railway
- Verify the Authorization header matches exactly
- Secret must be the same in Railway and cron service

### Emails Not Sending
- Check `RESEND_API_KEY` is set in Railway
- Check `RESEND_FROM_EMAIL` is set
- Check Resend dashboard for delivery status
- Check Railway logs for errors

### Cron Not Running
- Verify the schedule syntax is correct
- Check cron service logs
- Test manually with curl first
- Ensure your Railway app is running

## Recommended Setup

For your use case, I recommend:

1. **Use EasyCron or Cron-Job.org** (easiest setup)
2. **Set up two cron jobs:**
   - Daily at 8 AM: Review reminders
   - Monday at 8 AM: Weekly digests
3. **Use the same endpoint** for both - it handles the logic internally
4. **Test manually first** before scheduling

## Security Notes

- The `CRON_SECRET` prevents unauthorized access
- Never commit the secret to git
- Use a strong, random secret (32+ characters)
- The endpoint only responds to GET requests with the correct header

