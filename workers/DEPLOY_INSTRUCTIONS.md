# iTunes Proxy Worker - Deployment Instructions

## Quick Deploy

1. **Make sure you're in the workers directory:**
   ```bash
   cd workers
   ```

2. **Deploy the worker:**
   ```bash
   npx wrangler deploy itunes-proxy.js --name itunes-proxy
   ```

   OR if you want to use a specific account/route:
   ```bash
   npx wrangler deploy itunes-proxy.js --name raspy-bush-7067
   ```

3. **Update the URL in `Planning/index.html`:**
   After deployment, Wrangler will give you a URL. Update line 12 in `Planning/index.html`:
   ```javascript
   window.ITUNES_PROXY_URL = 'YOUR_NEW_WORKER_URL';
   ```

## Testing the Worker

Test the worker directly in your browser:
```
https://YOUR_WORKER_URL?term=test&media=music&entity=song&limit=5
```

You should see JSON results from iTunes API.

## Troubleshooting

- **CORS errors**: Make sure the worker is deployed and the URL in index.html matches
- **404 errors**: Check that the worker name matches what you deployed
- **Empty responses**: Check Cloudflare Worker logs in the dashboard

