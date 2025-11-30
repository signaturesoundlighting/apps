// Simple iTunes API Proxy Worker
// This worker proxies iTunes API requests to solve CORS issues on mobile

export default {
  async fetch(request, env, ctx) {
    // CORS headers - must be on ALL responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      let queryString = '';
      
      // Support both GET (query params) and POST (body params) to bypass WAF restrictions
      if (request.method === 'GET') {
        const requestUrl = new URL(request.url);
        queryString = requestUrl.search;
        // Remove leading ? if present
        queryString = queryString.startsWith('?') ? queryString.substring(1) : queryString;
      } else if (request.method === 'POST') {
        // Accept POST with query string in body or as JSON
        try {
          const body = await request.text();
          if (body) {
            try {
              // Try parsing as JSON
              const json = JSON.parse(body);
              // Convert JSON object to query string
              const params = new URLSearchParams();
              Object.keys(json).forEach(key => {
                params.append(key, json[key]);
              });
              queryString = params.toString();
            } catch {
              // If not JSON, assume it's already a query string
              queryString = body;
            }
          } else {
            // Fallback to URL query string even for POST
            const requestUrl = new URL(request.url);
            queryString = requestUrl.search;
            queryString = queryString.startsWith('?') ? queryString.substring(1) : queryString;
          }
        } catch (e) {
          // Fallback to URL query string
          const requestUrl = new URL(request.url);
          queryString = requestUrl.search;
          queryString = queryString.startsWith('?') ? queryString.substring(1) : queryString;
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Method not allowed. Use GET or POST.' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (!queryString) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Forward request to iTunes API - use the raw query string to preserve encoding
      const itunesUrl = `https://itunes.apple.com/search?${queryString}`;
      
      const response = await fetch(itunesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      // Get the response body
      const body = await response.text();
      
      // Return the response with CORS headers
      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

    } catch (error) {
      // Return error with CORS headers
      return new Response(
        JSON.stringify({ 
          error: 'Proxy error',
          message: error.message || 'Failed to fetch from iTunes API',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
