# Deploy iTunes Proxy Worker - Step by Step

## The 403 Error Means:
- The worker doesn't exist, OR
- It exists but you don't have access, OR  
- It needs to be redeployed

## Solution: Deploy the Worker

### Step 1: Authenticate with Cloudflare
```bash
cd workers
npx wrangler login
```
This will open a browser to log in to Cloudflare.

### Step 2: Deploy the Worker
```bash
npx wrangler deploy itunes-proxy.js --name raspy-bush-7067
```

OR if you want to use the config file:
```bash
npx wrangler deploy --config itunes-proxy-wrangler.toml
```

### Step 3: Test It
After deployment, test the URL:
```
https://raspy-bush-7067.peakleadsgroup.workers.dev?term=test&media=music&entity=song&limit=5
```

You should see JSON results from iTunes API.

### Step 4: Update the URL (if needed)
If the deployment gives you a different URL, update `Planning/index.html` line 12:
```javascript
window.ITUNES_PROXY_URL = 'YOUR_NEW_URL';
```

## Alternative: Deploy to a New Worker Name

If "raspy-bush-7067" doesn't work, deploy with a new name:
```bash
npx wrangler deploy itunes-proxy.js --name itunes-proxy
```

Then update the URL in `Planning/index.html` to match.

## Troubleshooting

- **Still getting 403?** Make sure you're logged into the correct Cloudflare account
- **Different account?** The worker might be in a different Cloudflare account
- **Check Cloudflare Dashboard:** Go to Workers & Pages → Check if the worker exists

