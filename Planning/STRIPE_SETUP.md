# Stripe Payment Integration Setup

This guide explains how to set up the Stripe payment processing for deposit payments.

## Overview

The payment flow uses:
1. **Frontend (depositPayment.js)**: Stripe Elements for card input
2. **Backend (Cloudflare Worker)**: Creates PaymentIntents securely using your Stripe secret key
3. **Stripe**: Processes the actual payment

## Setup Steps

### 1. Get Your Stripe Secret Key

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode, or `sk_live_` for production)

### 2. Deploy the Cloudflare Worker

The worker is located in `workers/stripe-payment-intent.js`.

#### Option A: Deploy using Wrangler CLI

```bash
# Navigate to workers directory
cd workers

# Set your Stripe secret key as a Cloudflare Worker secret
npx wrangler secret put STRIPE_SECRET_KEY
# When prompted, paste your Stripe secret key

# Deploy the worker
npx wrangler deploy
```

After deployment, you'll get a URL like:
`https://stripe-payment-intent.your-account.workers.dev`

#### Option B: Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create application** → **Create Worker**
4. Copy the contents of `workers/stripe-payment-intent.js` into the worker
5. Go to **Settings** → **Variables** → **Add variable**
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key
   - Type: Encrypted
6. Click **Save and deploy**

### 3. Configure the Frontend

Update `depositPayment.js` to use your worker URL. You can do this in one of two ways:

#### Option A: Set in index.html (Recommended)

Add this script tag before other scripts in `index.html`:

```html
<script>
    // Configure Payment Intent API endpoint
    window.PAYMENT_INTENT_API_URL = 'https://stripe-payment-intent.your-account.workers.dev';
</script>
```

#### Option B: Set directly in depositPayment.js

Find this line in `depositPayment.js`:
```javascript
const PAYMENT_INTENT_API_URL = window.PAYMENT_INTENT_API_URL || null;
```

Replace with:
```javascript
const PAYMENT_INTENT_API_URL = 'https://stripe-payment-intent.your-account.workers.dev';
```

### 4. Test the Payment Flow

For **test mode**, use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0027 6000 3184`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### 5. Switch to Production Mode

When ready for real payments:

1. **Update Stripe Keys**:
   - Change `STRIPE_PUBLISHABLE_KEY` in `depositPayment.js` to your live publishable key
   - Update `STRIPE_SECRET_KEY` in Cloudflare Worker to your live secret key

2. **Test with Real Cards**: Use small amounts first to verify everything works

3. **Monitor**: Check Stripe Dashboard for successful payments

## Security Notes

- ⚠️ **Never** put your Stripe secret key in frontend code
- ✅ Always use environment variables or Cloudflare Worker secrets
- ✅ The secret key is only used server-side in the Cloudflare Worker
- ✅ The frontend only uses the publishable key (safe to expose)

## Troubleshooting

### "Payment API endpoint not configured"
- Make sure `PAYMENT_INTENT_API_URL` is set in `index.html` or `depositPayment.js`

### "Stripe secret key not configured"
- Make sure you've set the `STRIPE_SECRET_KEY` secret in your Cloudflare Worker

### Payment fails with "Your card was declined"
- In test mode, use the test card numbers above
- In production, check the card details and Stripe Dashboard for specific decline reasons

### CORS errors
- The worker is configured to allow CORS from any origin
- If you need to restrict it, update `corsHeaders` in `workers/stripe-payment-intent.js`

## Payment Flow

1. User fills out card details using Stripe Elements
2. User clicks "Complete Payment"
3. Frontend calls Cloudflare Worker to create PaymentIntent
4. Worker creates PaymentIntent via Stripe API using secret key
5. Worker returns `clientSecret` to frontend
6. Frontend confirms payment with Stripe using `clientSecret`
7. On success, updates Supabase `deposit_paid` status
8. User proceeds to onboarding

## Files Modified

- `Planning/depositPayment.js` - Frontend payment handling
- `workers/stripe-payment-intent.js` - Backend PaymentIntent creation
- `Planning/index.html` - Configuration (if using window.PAYMENT_INTENT_API_URL)

