// Simple iTunes API Proxy Worker
// This worker proxies iTunes API requests to solve CORS issues on mobile

export default {
  async fetch(request) {
    // CORS headers - must be on ALL responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Only handle GET requests
    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Get query string from request
      const url = new URL(request.url);
      const queryString = url.searchParams.toString();
      
      if (!queryString) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Forward request to iTunes API
      const itunesUrl = `https://itunes.apple.com/search?${queryString}`;
      const response = await fetch(itunesUrl, {
        headers: {
          'Accept': 'application/json',
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
