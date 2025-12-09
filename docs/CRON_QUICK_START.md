# Cron Setup - Quick Start Guide

## What You Need to Do

### Step 1: Generate a Secret Key

Run this command in your terminal:
```bash
openssl rand -hex 32
```

Copy the output (it will look like: `a1b2c3d4e5f6...`)

### Step 2: Add to Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: (paste the secret you generated)
5. Click "Add" and deploy

### Step 3: Set Up External Cron Service

Since Railway doesn't have built-in cron, use one of these free services:

#### Option A: EasyCron (Recommended - Easiest)

1. Go to https://www.easycron.com and sign up (free)
2. Click "Add New Cron Job"
3. Fill in:
   - **Cron Job Name**: "AI Portal Notifications"
   - **URL**: `https://ai.torsor.co.uk/api/cron/notifications`
   - **Schedule**: `0 8 * * *` (runs daily at 8 AM)
   - **HTTP Method**: GET
   - **HTTP Headers**: 
     ```
     Authorization: Bearer YOUR_SECRET_HERE
     ```
     (Replace `YOUR_SECRET_HERE` with the secret from Step 1)
4. Click "Save"

**That's it!** The cron job will now call your endpoint daily at 8 AM.

#### Option B: Cron-Job.org (Alternative)

1. Go to https://cron-job.org and sign up (free)
2. Click "Create cronjob"
3. Fill in:
   - **Title**: "AI Portal Notifications"
   - **Address**: `https://ai.torsor.co.uk/api/cron/notifications`
   - **Schedule**: `0 8 * * *`
   - **Request Method**: GET
   - **Request Headers**: 
     ```
     Authorization: Bearer YOUR_SECRET_HERE
     ```
4. Click "Create cronjob"

## What Happens

Every day at 8 AM, the cron service will:
1. Call your API endpoint
2. Your endpoint checks for:
   - Reviews due in 5 days, 1 day, or overdue → sends reminder emails
   - If it's Monday → sends weekly digest emails to all users
3. Emails are sent via Resend

## Testing

Before scheduling, test it manually:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_SECRET_HERE" \
  https://ai.torsor.co.uk/api/cron/notifications
```

You should see a JSON response with `"success": true`.

## Important Notes

- **The secret must match** in both Railway and your cron service
- **Your Railway app must be running** for the endpoint to work
- **Emails only send if there's something to notify about** (no spam!)
- The endpoint is protected - only requests with the correct secret will work

## Troubleshooting

**"Unauthorized" error?**
- Check the secret matches exactly in Railway and cron service
- Make sure there are no extra spaces in the header

**No emails sending?**
- Check Railway logs for errors
- Verify `RESEND_API_KEY` is set in Railway
- Check Resend dashboard for delivery status

**Cron not running?**
- Verify the schedule is correct (`0 8 * * *` = daily at 8 AM)
- Check the cron service's execution logs
- Test manually with curl first

