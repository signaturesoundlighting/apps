// Cloudflare Worker for creating Stripe PaymentIntents
// This handles the server-side creation of PaymentIntents using your Stripe secret key

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
                status: 405, 
                headers: corsHeaders 
            });
        }

        try {
            // Get request body
            const body = await request.json();
            const { amount, currency = 'usd', clientId, metadata = {} } = body;

            // Validate required fields
            if (!amount || amount <= 0) {
                return new Response(
                    JSON.stringify({ error: 'Invalid amount' }), 
                    { 
                        status: 400, 
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                    }
                );
            }

            if (!env.STRIPE_SECRET_KEY) {
                return new Response(
                    JSON.stringify({ error: 'Stripe secret key not configured' }), 
                    { 
                        status: 500, 
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                    }
                );
            }

            // Create PaymentIntent via Stripe API
            const response = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    amount: amount.toString(),
                    currency: currency,
                    metadata: JSON.stringify({
                        client_id: clientId || '',
                        ...metadata,
                    }),
                    // For test mode, we can use automatic payment methods
                    automatic_payment_methods: JSON.stringify({ enabled: true }),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Stripe API error:', data);
                return new Response(
                    JSON.stringify({ error: data.error?.message || 'Failed to create payment intent' }), 
                    { 
                        status: response.status, 
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                    }
                );
            }

            // Return client secret
            return new Response(
                JSON.stringify({ 
                    clientSecret: data.client_secret,
                    paymentIntentId: data.id 
                }), 
                { 
                    status: 200, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error', message: error.message }), 
                { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }
    },
};

