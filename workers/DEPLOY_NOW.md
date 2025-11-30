# Deploy Worker - Quick Steps

## Step 1: Make sure you're logged in
```bash
cd workers
npx wrangler login
```

## Step 2: Deploy the worker
```bash
npx wrangler deploy itunes-proxy.js --name raspy-bush-7067
```

If that worker name doesn't work or you don't have access, deploy with a new name:
```bash
npx wrangler deploy itunes-proxy.js --name itunes-proxy
```

Then update `Planning/index.html` line 12 with the new URL.

## Step 3: Test the worker

Open `workers/test-worker.html` in your browser and click the buttons to test:
- "Test GET (no params)" - Should show "Missing query parameters"
- "Test POST" - Should show iTunes API results (bypasses WAF)
- "Test GET (with query params)" - Might still show 403 if WAF blocks it

## If POST works but GET doesn't:
The frontend is already configured to use POST, so it should work in your app!

## If nothing works:
1. Check Cloudflare Dashboard → Workers & Pages → Your Worker
2. Make sure the worker is actually deployed
3. Check the worker logs for errors

