// iTunes API Proxy Worker - Supports GET and POST to bypass WAF
export default {
  async fetch(request) {
    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      let queryString = '';
      
      // Support both GET and POST (POST bypasses WAF restrictions)
      if (request.method === 'GET') {
        const url = new URL(request.url);
        queryString = url.search;
        if (queryString.startsWith('?')) {
          queryString = queryString.substring(1);
        }
      } else if (request.method === 'POST') {
        // Get query string from POST body
        const body = await request.text();
        queryString = body || '';
      }
      
      // If no query params, return error
      if (!queryString) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameters' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Forward to iTunes API
      const itunesUrl = `https://itunes.apple.com/search?${queryString}`;
      const response = await fetch(itunesUrl);
      const body = await response.text();

      // Return iTunes response with CORS headers
      return new Response(body, {
        status: response.status,
        headers: corsHeaders,
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Proxy error', message: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
