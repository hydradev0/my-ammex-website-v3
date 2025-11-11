# Product Discount Management - Setup Checklist

## 🚀 Quick Start Guide

Follow these steps to get the discount management system up and running:

---

## Step 1: Create Database Table ✅

Run the migration script to create the `product_discounts` table:

```bash
cd my-ammex-website/backend
node scripts/createProductDiscountsTable.js
```

**Expected Output**:
```
✅ product_discounts table created successfully
✅ Indexes created
✅ Triggers created
```

If you see any errors, check:
- [ ] PostgreSQL is running
- [ ] Database connection string is correct in `.env`
- [ ] User has CREATE TABLE permissions

---

## Step 2: Restart Backend Server ✅

The routes are already added to `server.js`. Just restart:

```bash
cd my-ammex-website/backend
npm start
```

**Expected Output**:
```
✅ Environment variables validated successfully
✅ Connected to PostgreSQL database
Server is running on port 5000
```

---

## Step 3: Test Backend API ✅

### Test 1: Get Products
```bash
curl -X GET "http://localhost:5000/api/discounts/items?page=1&limit=24" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success**: Should return list of products with pagination

### Test 2: Get Discount Settings
```bash
curl -X GET "http://localhost:5000/api/discounts/settings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success**: Should return max_discount and discount_tiers

### Test 3: Apply Discount
```bash
curl -X POST "http://localhost:5000/api/discounts/apply" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [1],
    "discountPercentage": 10
  }'
```

**Success**: Should return success message

---

## Step 4: Test Frontend ✅

1. **Login** as Admin or Sales Marketing user
2. **Navigate** to Product Discounts from menu
3. **Browse** products (should load from backend)
4. **Select** one or more products
5. **Apply** discount (e.g., 10%)
6. **Verify** product appears in "Currently Discounted Products" table
7. **Remove** discount by clicking "Remove" button

---

## Verification Checklist

### Database
- [ ] `product_discounts` table exists
- [ ] All indexes created
- [ ] Triggers working (check with test insert)

### Backend API
- [ ] GET `/api/discounts/items` returns products
- [ ] GET `/api/discounts/active` returns empty array (initially)
- [ ] POST `/api/discounts/apply` applies discount
- [ ] GET `/api/discounts/active` returns discounted products
- [ ] DELETE `/api/discounts/:id` removes discount

### Frontend
- [ ] Page loads without errors
- [ ] Products display in grid
- [ ] Pagination works
- [ ] Search filters products
- [ ] Category filter works
- [ ] Can select/deselect products
- [ ] Apply discount succeeds
- [ ] Success modal appears
- [ ] Discounted products table updates
- [ ] Remove discount works

### Security
- [ ] Cannot access without login
- [ ] Only Admin/Sales Marketing can access
- [ ] Invalid discount percentages rejected
- [ ] Invalid dates rejected

---

## Common Issues & Solutions

### Issue 1: Frontend shows "Failed to fetch products"

**Solutions**:
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Check JWT token is valid: Open DevTools → Application → LocalStorage → Check `token`
3. Check CORS settings in `server.js`
4. Check console for detailed error

### Issue 2: "Failed to apply discount"

**Solutions**:
1. Check product IDs are valid: `SELECT id FROM item WHERE id IN (1,2,3) AND is_active = true`
2. Check discount percentage is 1-100
3. Check user has correct role (Admin or Sales Marketing)
4. Check backend logs for detailed error

### Issue 3: Discount applied but not showing

**Solutions**:
1. Check database: `SELECT * FROM product_discounts WHERE is_active = true`
2. Refresh page
3. Check if product is active: `SELECT * FROM item WHERE id = X`

### Issue 4: Page is blank/loading forever

**Solutions**:
1. Check browser console for JavaScript errors
2. Check Network tab for failed API requests
3. Ensure VITE_API_BASE_URL is set correctly in frontend `.env`
4. Try hard refresh (Ctrl+Shift+R)

---

## Testing Script

Save this as `test-discounts.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:5000/api"
TOKEN="YOUR_JWT_TOKEN_HERE"

echo "🧪 Testing Product Discount Management API"
echo "=========================================="

# Test 1: Get Products
echo "\n1️⃣ Testing: GET /discounts/items"
curl -s -X GET "$API_URL/discounts/items?page=1&limit=24" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# Test 2: Get Settings
echo "\n2️⃣ Testing: GET /discounts/settings"
curl -s -X GET "$API_URL/discounts/settings" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# Test 3: Apply Discount
echo "\n3️⃣ Testing: POST /discounts/apply"
curl -s -X POST "$API_URL/discounts/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [1],
    "discountPercentage": 10
  }' | jq '.success'

# Test 4: Get Active Discounts
echo "\n4️⃣ Testing: GET /discounts/active"
curl -s -X GET "$API_URL/discounts/active" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

echo "\n\n✅ All tests completed!"
```

Run with:
```bash
chmod +x test-discounts.sh
./test-discounts.sh
```

---

## Database Verification Queries

### Check table structure:
```sql
\d product_discounts
```

### Check current discounts:
```sql
SELECT 
  pd.id,
  i.item_code,
  i.model_no,
  pd.discount_percentage,
  pd.is_active,
  pd.created_at
FROM product_discounts pd
JOIN item i ON pd.item_id = i.id
ORDER BY pd.created_at DESC
LIMIT 10;
```

### Check products without discounts:
```sql
SELECT 
  i.id,
  i.item_code,
  i.model_no,
  i.selling_price
FROM item i
LEFT JOIN product_discounts pd ON i.id = pd.item_id AND pd.is_active = true
WHERE i.is_active = true 
  AND pd.id IS NULL
LIMIT 10;
```

### Check discount statistics:
```sql
SELECT 
  COUNT(*) as total_discounts,
  AVG(discount_percentage) as avg_discount,
  MIN(discount_percentage) as min_discount,
  MAX(discount_percentage) as max_discount
FROM product_discounts
WHERE is_active = true;
```

---

## Final Checklist

Before considering the feature complete:

### Backend
- [ ] Migration script runs successfully
- [ ] All API endpoints respond correctly
- [ ] Authentication works
- [ ] Authorization works (role-based)
- [ ] Input validation works
- [ ] Error handling works
- [ ] Database constraints work

### Frontend
- [ ] Component loads without errors
- [ ] Products fetch and display
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Selection works
- [ ] Apply discount works
- [ ] Remove discount works
- [ ] Success/error messages display
- [ ] Loading states work

### Integration
- [ ] Frontend connects to backend
- [ ] JWT authentication works
- [ ] Data flows correctly
- [ ] Real-time updates work
- [ ] Error messages are user-friendly

### User Experience
- [ ] Page loads fast (< 2 seconds)
- [ ] Interactions are smooth
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation)

---

## 🎉 Success Criteria

Your implementation is successful when:

1. ✅ Admin/Sales Marketing can browse products
2. ✅ Can select multiple products with checkboxes
3. ✅ Can apply discount percentage (1-100%)
4. ✅ Can set optional date range
5. ✅ Can see all currently discounted products
6. ✅ Can remove discounts
7. ✅ Pagination works for large catalogs
8. ✅ Search and filters work
9. ✅ All role-based permissions enforced
10. ✅ No errors in console or logs

---

## Next Steps After Setup

1. **Test with real data**: Apply discounts to actual products
2. **Update Product Display**: Show discounts in ProductCard.jsx
3. **Test AI Integration**: Apply AI-suggested discounts
4. **Monitor Performance**: Check page load times
5. **Gather Feedback**: Get user feedback on UX
6. **Plan Phase 2**: Schedule discounts, bulk operations, analytics

---

**Status**: Ready to setup and test! 🚀

**Estimated Setup Time**: 15-30 minutes

**Need Help?** Check `BACKEND_IMPLEMENTATION_SUMMARY.md` for detailed documentation.

