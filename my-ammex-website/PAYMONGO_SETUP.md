# PayMongo Payment Gateway Integration Guide

## Overview

This document provides setup instructions for the PayMongo payment gateway integration in the Ammex Website system. PayMongo enables secure online payments via credit/debit cards, GCash, GrabPay, and Maya (PayMaya).

## Prerequisites

- PayMongo account (sign up at https://dashboard.paymongo.com/)
- Access to PayMongo API keys
- SSL certificate for production deployment (required for webhook security)

## Backend Setup

### 1. Install Dependencies

```bash
cd my-ammex-website/backend
npm install
```

This will install the `paymongo` npm package along with other dependencies.

### 2. Configure Environment Variables

Update `backend/.env` with your PayMongo credentials:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_...    # Use sk_live_... for production
PAYMONGO_PUBLIC_KEY=pk_test_...    # Use pk_live_... for production
PAYMONGO_WEBHOOK_SECRET=whsec_...  # Get from PayMongo webhook settings
```

**Important:** Never commit actual API keys to version control. The provided keys are placeholders.

### 3. Database Migration

The Payment model has been updated with new fields. Run the database sync:

```bash
npm run db:sync
```

This will add the following fields to the Payment table:
- `gateway_provider` - Payment gateway identifier
- `gateway_payment_id` - External payment ID from PayMongo
- `gateway_status` - Current status from payment gateway
- `gateway_metadata` - Full gateway response (JSON)
- `failure_code` - Error code for failed payments
- `failure_message` - Human-readable failure reason

### 4. PayMongo Webhook Configuration

1. Log in to your PayMongo dashboard
2. Navigate to **Developers > Webhooks**
3. Create a new webhook with the following URL:

   ```
   https://your-domain.com/api/payments/webhook/paymongo
   ```

4. Subscribe to these events:
   - `payment.paid` - Payment successful
   - `payment.failed` - Payment failed
   - `payment_intent.payment_failed` - Payment intent failed
   - `source.chargeable` - E-wallet source ready (GCash/GrabPay)

5. Copy the webhook secret and add it to your `.env` file

## Frontend Setup

### 1. Install Dependencies

```bash
cd my-ammex-website/frontend
npm install
```

### 2. Configure Environment Variables

Create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PAYMONGO_PUBLIC_KEY=pk_test_...  # Use pk_live_... for production
```

### 3. Verify Integration

The frontend now uses the streamlined Payment.jsx component which:
- Removes manual payment submission UI
- Integrates PayMongo payment intent creation
- Supports multiple payment methods (Card, GCash, GrabPay, Maya)
- Handles payment processing states
- Auto-approves successful payments via webhook

## Supported Payment Methods

### 1. Credit/Debit Cards
- **Supported Cards:** Visa, Mastercard, JCB, American Express
- **3D Secure:** Automatically triggered when required
- **Processing Time:** Instant

### 2. GCash
- **Type:** E-wallet
- **Processing:** Redirect to GCash app/website
- **Processing Time:** Near-instant

### 3. GrabPay
- **Type:** E-wallet
- **Processing:** Redirect to GrabPay
- **Processing Time:** Near-instant

### 4. Maya (PayMaya)
- **Type:** E-wallet
- **Processing:** Redirect to Maya app/website
- **Processing Time:** Near-instant

## API Endpoints

### Customer Endpoints

#### Create Payment Intent
```
POST /api/payments/create-payment-intent
Authorization: Bearer {customer_token}

Request Body:
{
  "invoiceId": 123,
  "amount": 1000.00
}

Response:
{
  "success": true,
  "data": {
    "paymentId": 456,
    "clientKey": "pi_...",
    "paymentIntentId": "pi_...",
    "status": "awaiting_payment_method"
  }
}
```

### Admin Endpoints

#### Get Failed Payments
```
GET /api/payments/failed
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 789,
      "invoiceId": 123,
      "amount": 1000.00,
      "paymentMethod": "card",
      "status": "failed",
      "failureCode": "card_declined",
      "failureMessage": "Your card was declined",
      "customer": { ... },
      "invoice": { ... }
    }
  ]
}
```

### Webhook Endpoint

#### PayMongo Webhook
```
POST /api/payments/webhook/paymongo
Content-Type: application/json
PayMongo-Signature: {signature}

Handles events:
- payment.paid
- payment.failed
- payment_intent.payment_failed
- source.chargeable
```

## Payment Flow

### Customer Payment Flow

1. **Initiate Payment**
   - Customer navigates to invoice and clicks "Make Payment"
   - Selects payment amount (supports partial payments)
   - Chooses payment method (Card/GCash/GrabPay/Maya)

2. **Create Payment Intent**
   - Frontend calls `/api/payments/create-payment-intent`
   - Backend creates PayMongo payment intent
   - Database payment record created with `status='pending_payment'`

3. **Process Payment**
   - For cards: Customer enters card details
   - For e-wallets: Customer redirected to e-wallet app
   - PayMongo processes payment with 3D Secure if required

4. **Webhook Notification**
   - PayMongo sends webhook to backend
   - Backend verifies webhook signature
   - Payment status updated (`succeeded` or `failed`)
   - Invoice balance updated if successful
   - Customer notification sent

5. **Completion**
   - Customer sees success/failure message
   - Payment appears in appropriate admin tab
   - Invoice balance reflects payment

### Admin Monitoring

Admins can monitor payments in three tabs:

1. **Balance Tracking**
   - Open invoices with remaining balance
   - Shows payment progress per invoice
   - Gateway payment method badges

2. **Payment History**
   - Successfully completed payments
   - Includes PayMongo transaction IDs
   - Filterable by payment method and date

3. **Failed Payments**
   - Payments that failed to process
   - Shows failure reason and code
   - Actions: Contact customer, view invoice

## Testing

### Test Cards

**IMPORTANT:** Use only official PayMongo test cards from https://developers.paymongo.com/docs/testing

**Basic Success Cards (No 3DS):**
```
Visa:       4343 4343 4343 4345
Mastercard: 5555 4444 4444 4457
CVC:        Any 3 digits
Expiry:     Any future date (e.g., 12/25)
```

**3D Secure Test Cards:**
```
4120 0000 0000 0007 - 3DS required, will succeed (OTP: 123456)
4230 0000 0000 0004 - 3DS required, declines before auth
5234 0000 0000 0106 - 3DS required, declines after auth
5123 0000 0000 0001 - 3DS supported but not required
```

**Declined Card Scenarios:**
```
4200 0000 0000 0018 - Card expired
4300 0000 0000 0017 - Invalid CVC
4400 0000 0000 0016 - Generic decline
4500 0000 0000 0015 - Fraudulent
5100 0000 0000 0198 - Insufficient funds
5200 0000 0000 0197 - Processor blocked
5300 0000 0000 0196 - Lost card
5400 0000 0000 0195 - Stolen card
5500 0000 0000 0194 - Processor unavailable
4600 0000 0000 0014 - Blocked by fraud detection
```

### Test E-Wallets

In test mode, e-wallet payments redirect to a success/failure simulator.

### Testing Webhooks

1. Use PayMongo's webhook testing feature in the dashboard
2. Or use ngrok to expose local development server:
   ```bash
   ngrok http 5000
   ```
3. Update webhook URL in PayMongo dashboard to ngrok URL

## Production Deployment

### Pre-Deployment Checklist

- [ ] Replace test API keys with live keys
- [ ] Update webhook URL to production domain
- [ ] Verify SSL certificate is valid
- [ ] Test all payment methods in production
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for failures

### Security Considerations

1. **API Keys**
   - Never expose secret keys in frontend code
   - Store keys in environment variables only
   - Rotate keys periodically

2. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoints
   - Log all webhook events for audit

3. **Payment Data**
   - Never store raw card details
   - Log sensitive operations
   - Implement rate limiting on payment endpoints

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events

1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Check webhook secret matches configuration
4. Review PayMongo dashboard logs

#### Payment Fails Silently

1. Check browser console for errors
2. Verify PayMongo public key is correct
3. Test with PayMongo test cards
4. Review backend logs for API errors

#### Database Migration Fails

1. Backup database before running migrations
2. Check database user has ALTER TABLE permissions
3. Manually add columns if auto-migration fails

### Support

- **PayMongo Documentation:** https://developers.paymongo.com/docs
- **PayMongo Support:** support@paymongo.com
- **API Status:** https://status.paymongo.com

## How to Use the Payment System

### For Customers (Making a Payment)

1. **Navigate to Invoices:**
   - Log in to your customer portal
   - Go to Products > Invoices
   - Find the invoice you want to pay

2. **Initiate Payment:**
   - Click the "Make Payment" button on the invoice
   - Enter the payment amount (you can pay partially or in full)

3. **Select Payment Method:**
   - Choose from: Credit/Debit Card, GCash, GrabPay, or Maya

4. **For Card Payments:**
   - Fill in card details:
     - Card Number (e.g., 4343 4343 4343 4345)
     - Expiry Date (MM/YY format)
     - CVC (3 or 4 digits)
     - Cardholder Name
   - Click "Pay Now"
   - If 3D Secure is required, you'll be redirected to your bank's authentication page
   - Complete the authentication (use OTP `123456` for test cards)
   - You'll be redirected back to your invoices page

5. **For E-Wallet Payments (GCash/GrabPay/Maya):**
   - Select your preferred e-wallet
   - Click "Pay Now"
   - You'll be redirected to the e-wallet checkout page
   - Complete the payment in the e-wallet app
   - You'll be redirected back upon completion

### For Admins (Managing Payments)

1. **View All Payments:**
   - Go to Manage Accounts > Payment Receiving
   - See three tabs:
     - **Balance Tracking**: View outstanding balances per invoice
     - **Payment History**: View all successful payments
     - **Failed Payments**: View payments that failed and their error details

2. **Handle Failed Payments:**
   - Check the "Failed Payments" tab for any issues
   - View failure codes and messages
   - Contact customers if needed to retry payments

## Testing the Complete Flow

### Test Card Payment (No 3DS)

1. Log in as a customer
2. Navigate to an unpaid invoice
3. Click "Make Payment"
4. Enter amount: `100.00`
5. Select "Credit/Debit Card"
6. Enter official PayMongo test card:
   - Card Number: `4343 4343 4343 4345` (Visa)
   - Expiry: `12/25`
   - CVC: `123`
   - Name: `JUAN DELA CRUZ`
7. Click "Pay Now"
8. Payment should process without 3DS redirect
9. Check the webhook logs in backend terminal
10. Verify payment appears in "Payment History" as admin

### Test Card Payment (With 3DS)

1. Follow steps 1-4 above
2. Use official 3DS test card:
   - Card Number: `4120 0000 0000 0007`
   - Expiry: `12/25`
   - CVC: `123`
   - Name: `JUAN DELA CRUZ`
3. Click "Pay Now"
4. You'll be redirected to 3DS authentication page
5. Enter OTP: `123456`
6. You'll be redirected back to invoices
7. Payment should show as successful

### Test Declined Card (Insufficient Funds)

1. Follow steps 1-4 above
2. Use official declined test card:
   - Card Number: `5100 0000 0000 0198`
   - Expiry: `12/25`
   - CVC: `123`
   - Name: `JUAN DELA CRUZ`
3. Click "Pay Now"
4. Payment will fail with "insufficient_funds" error
5. Check "Failed Payments" tab as admin
6. You should see the failure reason

### Test E-Wallet Payment (GCash)

1. Log in as a customer
2. Navigate to an unpaid invoice
3. Click "Make Payment"
4. Enter amount: `100.00`
5. Select "GCash"
6. Click "Pay Now"
7. You'll be redirected to GCash checkout URL (test mode will show a mock page)
8. Complete the payment simulation
9. You'll be redirected back to invoices

## What Was Implemented

### Backend Changes

1. **New Controller Functions:**
   - `createPaymentMethod`: Creates a PayMongo payment method from card details
   - `attachPaymentToIntent`: Attaches payment method to intent and handles 3DS redirect
   - `createPaymentSource`: Creates a source for e-wallet payments

2. **New Routes:**
   - `POST /api/payments/create-payment-method`
   - `POST /api/payments/attach-payment-method`
   - `POST /api/payments/create-payment-source`

### Frontend Changes

1. **Payment.jsx Enhancements:**
   - Added card input fields (card number, expiry, CVC, cardholder name)
   - Input validation and formatting
   - Complete payment flow for cards (create method → attach → handle 3DS)
   - Complete payment flow for e-wallets (create source → redirect)
   - Automatic redirect to 3DS authentication when required
   - Automatic redirect to e-wallet checkout pages

2. **New Service Functions:**
   - `createPaymentMethod(cardDetails, billingDetails)`
   - `attachPaymentToIntent(paymentIntentId, paymentMethodId, returnUrl, paymentId)`
   - `createPaymentSource(type, amount, invoiceId, paymentId)`

## Future Enhancements

Potential improvements for the integration:

1. **Recurring Payments**
   - Implement subscription-based payments
   - Save payment methods for future use

2. **Payment Links**
   - Generate shareable payment links
   - Send via email/SMS

3. **Refunds**
   - Implement refund processing
   - Track refund history

4. **Multi-Currency**
   - Support USD payments for international customers
   - Automatic currency conversion

5. **Payment Analytics**
   - Track success/failure rates
   - Payment method preferences
   - Revenue analytics

## Version History

- **v1.0.0** (Current) - Initial PayMongo integration
  - Payment Intent API
  - Webhook handling
  - Card, GCash, GrabPay, Maya support
  - Failed payments monitoring

