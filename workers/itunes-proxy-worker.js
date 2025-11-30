export default {
  async fetch(request) {
    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Accept',
          'access-control-max-age': '86400', // Cache preflight for 24 hours
        },
      });
    }

    // Handle GET requests
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const target = 'https://itunes.apple.com/search?' + url.searchParams.toString();

      try {
        const resp = await fetch(target, {
          headers: { 'Accept': 'application/json' },
        });

        const body = await resp.text();

        return new Response(body, {
          status: resp.status,
          headers: {
            'content-type': resp.headers.get('content-type') || 'application/json; charset=utf-8',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,OPTIONS',
            'access-control-allow-headers': 'Content-Type, Accept',
            'cache-control': 'no-store',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
        });
      }
    }

    // Method not allowed
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'access-control-allow-origin': '*',
      },
    });
  }
}

