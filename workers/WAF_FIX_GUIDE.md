# Fix 403 Error - WAF Configuration Guide

## Important: WAF for Workers

For Cloudflare Workers, WAF (Web Application Firewall) rules are typically applied at the **zone/domain level**, not at the individual worker level.

## Where to Find WAF Settings

### Option 1: Zone-Level Security (Most Common)
1. In Cloudflare Dashboard, go to your **domain/zone** (not the worker)
2. Navigate to **Security** → **WAF**
3. Look for rules that might be blocking query parameters
4. Create an exception or disable specific rules for your worker route

### Option 2: Workers Route Configuration
1. In your Worker settings, click on **"Domains & Routes"** (in the right sidebar)
2. Check if there are any route-specific security settings
3. Look for any custom routes that might have security rules

### Option 3: Bypass WAF for This Worker
If WAF is blocking at the zone level, you can:
1. Go to **Security** → **WAF** in your zone
2. Create a **Custom Rule** that allows requests to `*.workers.dev` domains
3. Or create an exception for your specific worker route

## Alternative Solution: Use POST Instead of GET

If WAF continues to block GET requests with query parameters, we can modify the worker to accept POST requests instead. This often bypasses WAF restrictions.

## Quick Check: Is It Really WAF?

Test this URL directly in your browser:
```
https://raspy-bush-7067.peakleadsgroup.workers.dev?term=test&media=music&entity=song&limit=5
```

- If you get 403: It's WAF or security blocking
- If you get JSON response: Worker is working, issue is elsewhere
- If you get "Missing query parameters": Worker code needs update

