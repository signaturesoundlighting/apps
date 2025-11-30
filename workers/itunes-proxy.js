// Ultra-simple test worker - just returns a success message
export default {
  async fetch(request) {
    // Return simple JSON response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Worker is working!',
        method: request.method,
        url: request.url
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  },
};
