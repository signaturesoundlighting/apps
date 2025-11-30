// Cloudflare Worker for proxying iTunes API requests (mobile-safe CORS)
// This handles cross-origin requests to iTunes API for mobile browsers

// Enhanced CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  'Vary': 'Origin', // Important for proper CORS caching
};

export default {
  async fetch(request) {
    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Handle GET requests
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const queryString = url.searchParams.toString();
      
      // Validate that we have query parameters
      if (!queryString) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameters' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const target = 'https://itunes.apple.com/search?' + queryString;

      try {
        const resp = await fetch(target, {
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; iTunesProxy/1.0)',
          },
        });

        // Get response body as text first to validate it
        const body = await resp.text();
        
        // Validate that the response is valid JSON
        let jsonData;
        try {
          jsonData = JSON.parse(body);
        } catch (parseError) {
          // If iTunes returns non-JSON (e.g., HTML error page), return a proper error
          console.error('iTunes API returned non-JSON response:', {
            status: resp.status,
            contentType: resp.headers.get('content-type'),
            bodyPreview: body.substring(0, 200),
          });
          
          return new Response(
            JSON.stringify({ 
              error: 'Invalid response from iTunes API',
              message: 'The iTunes API returned an unexpected response format',
              status: resp.status,
            }),
            {
              status: 502, // Bad Gateway
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Check if iTunes API returned an error in the JSON response
        if (jsonData.errorMessage) {
          console.error('iTunes API error:', jsonData.errorMessage);
          return new Response(
            JSON.stringify({ 
              error: 'iTunes API error',
              message: jsonData.errorMessage,
            }),
            {
              status: resp.status >= 400 ? resp.status : 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Success - return the validated JSON response
        return new Response(JSON.stringify(jsonData), {
          status: resp.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store', // Don't cache to ensure fresh results
          },
        });

      } catch (error) {
        // Log the error for debugging
        console.error('Worker error:', {
          message: error.message,
          stack: error.stack,
          queryString: queryString,
        });

        return new Response(
          JSON.stringify({ 
            error: 'Proxy error',
            message: error.message || 'Failed to fetch from iTunes API',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  },
};

