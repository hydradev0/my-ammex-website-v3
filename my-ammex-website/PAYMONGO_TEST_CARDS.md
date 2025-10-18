# PayMongo Official Test Cards Reference

**Source:** https://developers.paymongo.com/docs/testing

⚠️ **IMPORTANT:** Only use these official PayMongo test cards. Do not use random card numbers.

---

## Basic Success Cards (No 3D Secure)

| Card Number         | Brand      | CVC          | Expiry          | Result  |
|---------------------|------------|--------------|-----------------|---------|
| 4343 4343 4343 4345 | Visa       | Any 3 digits | Any future date | Success |
| 5555 4444 4444 4457 | Mastercard | Any 3 digits | Any future date | Success |

**Usage:** These cards will complete payment immediately without requiring 3D Secure authentication.

---

## 3D Secure Test Cards

| Card Number         | Description                                        | OTP for Test |
|---------------------|----------------------------------------------------|--------------|
| 4120 0000 0000 0007 | 3DS required, will succeed after authentication    | 123456       |
| 4230 0000 0000 0004 | 3DS required, declines BEFORE authentication       | N/A          |
| 5234 0000 0000 0106 | 3DS required, declines AFTER authentication        | N/A          |
| 5123 0000 0000 0001 | 3DS supported but not required, payment succeeds   | N/A          |

**Usage:** 
- Use `4120 0000 0000 0007` for successful 3DS flow testing
- Enter OTP `123456` when prompted on the authentication page
- Other cards test different 3DS failure scenarios

---

## Declined Card Test Scenarios

### Card Status Issues

| Card Number         | Decline Reason      | Error Code      |
|---------------------|---------------------|-----------------|
| 4200 0000 0000 0018 | Card expired        | card_expired    |
| 5300 0000 0000 0196 | Card reported lost  | lost_card       |
| 5400 0000 0000 0195 | Card reported stolen| stolen_card     |

### Transaction Issues

| Card Number         | Decline Reason            | Error Code             |
|---------------------|---------------------------|------------------------|
| 4300 0000 0000 0017 | Invalid CVC               | cvc_invalid            |
| 4400 0000 0000 0016 | Generic decline           | generic_decline        |
| 5100 0000 0000 0198 | Insufficient funds        | insufficient_funds     |

### Fraud & Security

| Card Number         | Decline Reason                 | Error Code           |
|---------------------|--------------------------------|----------------------|
| 4500 0000 0000 0015 | Blocked as fraudulent          | fraudulent           |
| 4600 0000 0000 0014 | Blocked by fraud detection     | blocked              |
| 5200 0000 0000 0197 | Transaction processor blocked  | processor_blocked    |

### System Issues

| Card Number         | Decline Reason              | Error Code              |
|---------------------|-----------------------------|-------------------------|
| 5500 0000 0000 0194 | Processor unavailable       | processor_unavailable   |

---

## Quick Test Guide

### 1. Test Successful Payment (No 3DS)
```
Card:   4343 4343 4343 4345
Expiry: 12/25
CVC:    123
Name:   JUAN DELA CRUZ
Expected: Payment succeeds immediately
```

### 2. Test 3D Secure Flow
```
Card:   4120 0000 0000 0007
Expiry: 12/25
CVC:    123
Name:   JUAN DELA CRUZ
Expected: Redirected to auth page → Enter OTP 123456 → Payment succeeds
```

### 3. Test Declined Payment
```
Card:   5100 0000 0000 0198
Expiry: 12/25
CVC:    123
Name:   JUAN DELA CRUZ
Expected: Payment declines with "insufficient_funds" error
```

---

## E-Wallet Testing

For GCash, GrabPay, and Maya:
- In test mode, you'll be redirected to a mock checkout page
- No real e-wallet account needed
- You can simulate success or failure on the mock page

---

## Important Notes

1. **CVC:** Any 3 digits work (e.g., 123, 456, 789)
2. **Expiry:** Any future date (e.g., 12/25, 01/26, 12/30)
3. **Name:** Any name works (commonly use "JUAN DELA CRUZ" for testing)
4. **Amount:** Any amount ≥ PHP 100.00 for testing
5. **Test Mode Only:** These cards only work with test API keys (sk_test_*, pk_test_*)

---

## Common Mistakes to Avoid

❌ **Don't use:**
- Real credit card numbers
- Random/made-up card numbers
- Old test cards from other payment providers
- Test cards not listed in PayMongo documentation

✅ **Do use:**
- Only cards from this list
- Official PayMongo test cards
- Cards from https://developers.paymongo.com/docs/testing

---

## Testing Workflow

1. **Start with success card** (4343 4343 4343 4345) to verify basic flow works
2. **Test 3DS flow** (4120 0000 0000 0007) to verify redirects work
3. **Test declined scenarios** to verify error handling
4. **Test e-wallets** to verify redirect flows
5. **Check webhooks** to verify backend processing

---

## Need Help?

- **PayMongo Documentation:** https://developers.paymongo.com/docs
- **PayMongo Support:** support@paymongo.com
- **API Status:** https://status.paymongo.com

---

**Last Updated:** Based on PayMongo documentation as of October 2024

