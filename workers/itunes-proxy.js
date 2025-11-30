// iTunes API Proxy Worker - Step by step build
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
      // Get query parameters
      const url = new URL(request.url);
      let queryString = url.search;
      
      // Remove leading ?
      if (queryString.startsWith('?')) {
        queryString = queryString.substring(1);
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
