# Fix 403 Error with Query Parameters

## The Problem
Cloudflare WAF (Web Application Firewall) is blocking requests with query parameters before they reach your worker.

## Solution 1: Disable WAF for This Worker (Recommended)

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on your worker: **raspy-bush-7067**
4. Go to **Settings** → **Triggers**
5. Look for **WAF (Web Application Firewall)** settings
6. Either:
   - Disable WAF for this worker, OR
   - Add an exception rule to allow all query parameters

## Solution 2: Redeploy the Worker

After updating the worker code, redeploy it:

```bash
cd workers
npx wrangler deploy itunes-proxy.js --name raspy-bush-7067
```

## Solution 3: Use a Custom Domain (Bypasses Some Restrictions)

If you have a custom domain, you can route the worker through it which may bypass some WAF rules.

## Solution 4: Check Cloudflare Security Settings

1. In Cloudflare Dashboard, go to **Security** → **WAF**
2. Check if there are any rules blocking query parameters
3. Create an exception for your worker's route

## Quick Test After Fix

Test the URL:
```
https://raspy-bush-7067.peakleadsgroup.workers.dev?term=test&media=music&entity=song&limit=5
```

You should see JSON results, not a 403 error.

