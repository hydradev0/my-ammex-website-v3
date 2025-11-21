# Account Tier System Implementation Guide

## Overview

The Account Tier system allows customers to receive automatic discounts based on their account tier level. The discount is automatically calculated as the **best-of** between the customer's tier discount and any product-specific promotions - **no stacking** (only one discount applies, whichever saves more).

---

## How Tiers Work

### 1. **Tier Structure**
Each tier has the following properties:
- **Name**: Display name (e.g., "Bronze", "Silver", "Gold")
- **Discount Percent**: The discount percentage this tier provides (e.g., 0%, 10%, 20%)
- **Min Spend**: Minimum lifetime spending required to achieve this tier (optional, for auto-upgrade)
- **Priority**: Sorting order for tier hierarchy (higher priority = better tier)
- **Is Active**: Whether this tier is currently available

### 2. **Best-of Discount Logic (No Stacking)**

When calculating discounts, the system:
1. **Product Path**: Calculates total if product discounts are applied (each item uses its own product discount if available)
2. **Tier Path**: Calculates total if tier discount is applied uniformly to all items (ignores product discounts)
3. **Chooses the Better Path**: Applies whichever total is lower, ensuring maximum savings

**Example:**
- Customer has **Gold Tier (20% discount)**
- Orders 3 items:
  - Item A: ₱1000 (has 30% product discount = ₱700)
  - Item B: ₱1000 (no product discount = ₱1000)
  - Item C: ₱1000 (no product discount = ₱1000)
- **Product Path**: ₱700 + ₱1000 + ₱1000 = ₱2,700
- **Tier Path**: (₱1000 + ₱1000 + ₱1000) × 0.80 = ₱2,400
- **Result**: Tier path wins! Customer saves ₱600 (₱3,000 - ₱2,400)

---

## Frontend Implementation

### Settings.jsx - Admin Tier Management

**Location**: `frontend/src/Components/Settings.jsx`

**Purpose**: Allows administrators to create, edit, and manage customer account tiers.

**How it works:**

1. **Loading Tiers** (on component mount):
   ```javascript
   const res = await getTiers(); // Calls GET /api/settings/tiers
   setTiers(res.data); // Displays tiers in editable table
   ```

2. **Managing Tiers**:
   - **Add Tier**: Click "Add Tier" button to add a new row
   - **Edit Tier**: Modify fields directly in the table:
     - Priority (number): Higher = better tier
     - Name (text): Display name
     - Discount % (0-100): Discount percentage
     - Min Spend (number): Minimum spending threshold (optional)
     - Active (checkbox): Enable/disable tier
   - **Remove Tier**: Click "Remove" button to delete a tier

3. **Saving Tiers**:
   ```javascript
   const payload = tiers.map(t => ({
     name: String(t.name || '').trim(),
     discountPercent: Number(t.discountPercent || 0),
     minSpend: Number(t.minSpend || 0),
     isActive: !!t.isActive,
     priority: Number(t.priority || 0)
   }));
   await saveTiers(payload); // Calls PUT /api/settings/tiers
   ```

**Example Tier Configuration:**
```
Priority | Name   | Discount % | Min Spend | Active
---------|--------|------------|-----------|--------
1        | Bronze | 0%         | 0         | ✓
2        | Silver | 10%        | 10,000    | ✓
3        | Gold   | 20%        | 50,000    | ✓
4        | Platinum | 30%      | 100,000   | ✓
```

---

### Profile.jsx - Customer Tier Display

**Location**: `frontend/src/Components-CustomerPortal/Profile.jsx`

**Purpose**: Shows customers their current tier, discount percentage, and progress to next tier.

**Features:**
- **Current Tier Badge**: Displays tier name and color-coded badge
- **Discount Percentage**: Shows the discount they receive (e.g., "20% Discount")
- **Progress to Next Tier**: If `minSpend` is configured, shows spending progress bar
- **Tier Description**: Brief explanation of tier benefits

**Data Flow:**
```javascript
const tierRes = await getMyTier(); // Calls GET /api/settings/tiers/me
// Returns: { success: true, data: { name: 'Gold', discountPercent: 20, ... } }
```

---

### HandleOrders.jsx - Sales Order Processing

**Location**: `frontend/src/Components-CustomerOrders/HandleOrders.jsx`

**Purpose**: Automatically calculates and applies the best discount when sales staff review/approve orders.

**How it works:**

1. **When "Review" button is clicked:**
   ```javascript
   // 1. Fetch customer's tier
   const tierRes = await getCustomerTier(order.customerId);
   const tierPercent = tierRes.data.discountPercent; // e.g., 20
   
   // 2. Fetch fresh base prices for each order item
   const enriched = await Promise.all(
     order.items.map(async (item) => {
       const r = await getItemById(item.itemId);
       return {
         sellingPrice: r.data.sellingPrice, // Base price
         discountedPrice: r.data.discountedPrice, // Product discount (if any)
         quantity: item.quantity
       };
     })
   );
   
   // 3. Calculate best-of discount
   const best = computeBestOf(enriched, tierPercent);
   // Returns: { applied: 'tier' | 'product', chosenTotal, savingsAmount, ... }
   
   // 4. Store result for modal display
   setReviewDiscount(best);
   ```

2. **In ProcessOrderModal:**
   - Shows **read-only summary**: "Applied Gold Tier 20% (saved ₱X)"
   - Displays original subtotal → crossed out → final total
   - No manual input field (auto-calculated)

3. **On Approval:**
   ```javascript
   await updateOrderStatus(orderId, {
     status: 'approved',
     discountPercent: best.savingsPercent, // e.g., 20
     discountAmount: best.savingsAmount    // e.g., 600
   });
   ```

---

### Cart.jsx - Checkout Preview

**Location**: `frontend/src/Components-CustomerPortal/Cart.jsx`

**Purpose**: Shows customers their tier discount before checkout.

**Features:**
- **Tier Badge**: "Your tier: Gold (20%)"
- **Best Discount Summary**: "Best discount applied: Tier / Product"
- **Savings Display**: "You saved ₱X vs original ₱Y"
- **Visual**: Crossed-out original total → final discounted total

**Data Flow:**
```javascript
// 1. Get customer tier
const tierRes = await getMyTier();

// 2. Calculate best-of for cart items
const best = computeBestOf(cartItems, tierPercent);

// 3. Display in preview modal
```

---

## Backend Requirements

### Expected API Endpoints

#### 1. **GET /api/settings/tiers**
**Purpose**: Get all tiers (admin settings page)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bronze",
      "discountPercent": 0,
      "minSpend": 0,
      "priority": 1,
      "isActive": true
    },
    {
      "id": 2,
      "name": "Gold",
      "discountPercent": 20,
      "minSpend": 50000,
      "priority": 3,
      "isActive": true
    }
  ]
}
```

#### 2. **PUT /api/settings/tiers**
**Purpose**: Save/update tiers (admin settings page)

**Request Body:**
```json
[
  {
    "name": "Bronze",
    "discountPercent": 0,
    "minSpend": 0,
    "priority": 1,
    "isActive": true
  },
  {
    "name": "Gold",
    "discountPercent": 20,
    "minSpend": 50000,
    "priority": 3,
    "isActive": true
  }
]
```

**Response:**
```json
{
  "success": true,
  "message": "Tiers saved successfully"
}
```

#### 3. **GET /api/settings/tiers/me**
**Purpose**: Get current user's tier (customer profile page)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Gold",
    "discountPercent": 20,
    "minSpend": 50000,
    "currentSpend": 75000,
    "nextTier": {
      "name": "Platinum",
      "minSpend": 100000,
      "discountPercent": 30
    }
  }
}
```

#### 4. **GET /api/settings/tiers/customer/:customerId**
**Purpose**: Get specific customer's tier (sales order processing)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Gold",
    "discountPercent": 20
  }
}
```

### How to Calculate Customer Spending (Min Spend Tracking)

**Question**: How do we know if a customer has spent the required `minSpend` for tier upgrades?

**Answer**: Calculate from **Invoice** table using `totalAmount` for completed invoices.

#### Option 1: From Invoices (Recommended - Most Accurate)

**SQL Query:**
```sql
SELECT 
  customer_id,
  COALESCE(SUM(total_amount), 0) AS lifetime_spend
FROM "Invoice"
WHERE customer_id = :customerId
  AND status = 'completed'  -- Only count fully paid/completed invoices
GROUP BY customer_id;
```

**Sequelize Query:**
```javascript
const { Invoice } = getModels();
const lifetimeSpend = await Invoice.sum('totalAmount', {
  where: {
    customerId: customerId,
    status: 'completed'  // Only count completed invoices
  }
}) || 0;
```

**Why Invoices?**
- Invoices represent **actual billed amounts** (after discounts, taxes, etc.)
- `status = 'completed'` ensures we only count fully paid invoices
- More accurate than orders (orders can be rejected/cancelled)

#### Option 2: From Orders (Alternative)

**SQL Query:**
```sql
SELECT 
  customer_id,
  COALESCE(SUM(final_amount), 0) AS lifetime_spend
FROM "Order"
WHERE customer_id = :customerId
  AND status IN ('approved', 'completed')  -- Only count approved/completed orders
GROUP BY customer_id;
```

**Sequelize Query:**
```javascript
const { Order } = getModels();
const lifetimeSpend = await Order.sum('finalAmount', {
  where: {
    customerId: customerId,
    status: { [Op.in]: ['approved', 'completed'] }
  }
}) || 0;
```

**Note**: Orders are less accurate because:
- Orders can be rejected/cancelled
- Final amount might change during approval process
- Invoices are the "source of truth" for what was actually billed

#### Implementation in Backend

**Example: GET /api/settings/tiers/me endpoint**

```javascript
const getMyTier = async (req, res, next) => {
  try {
    const { Customer, Tier, Invoice } = getModels();
    
    // Get customer
    const customer = await Customer.findOne({
      where: { userId: req.user.id },
      include: [{ model: Tier, as: 'tier' }]
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Calculate lifetime spending from completed invoices
    const lifetimeSpend = await Invoice.sum('totalAmount', {
      where: {
        customerId: customer.id,
        status: 'completed'
      }
    }) || 0;
    
    // Get all active tiers sorted by priority
    const allTiers = await Tier.findAll({
      where: { isActive: true },
      order: [['priority', 'ASC']]
    });
    
    // Find current tier and next tier
    const currentTier = customer.tier || allTiers[0]; // Default to lowest tier
    const nextTier = allTiers.find(t => 
      t.priority > currentTier.priority && 
      lifetimeSpend >= t.minSpend
    ) || allTiers.find(t => t.priority > currentTier.priority);
    
    res.json({
      success: true,
      data: {
        id: currentTier.id,
        name: currentTier.name,
        discountPercent: currentTier.discountPercent,
        minSpend: currentTier.minSpend,
        currentSpend: Number(lifetimeSpend),
        nextTier: nextTier ? {
          name: nextTier.name,
          minSpend: nextTier.minSpend,
          discountPercent: nextTier.discountPercent
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};
```

#### Auto-Upgrade Logic (Optional)

You can automatically upgrade customers when they reach `minSpend`:

```javascript
const checkAndUpgradeTier = async (customerId) => {
  const { Customer, Tier, Invoice } = getModels();
  
  // Calculate lifetime spend
  const lifetimeSpend = await Invoice.sum('totalAmount', {
    where: {
      customerId: customerId,
      status: 'completed'
    }
  }) || 0;
  
  // Get all active tiers sorted by priority (highest first)
  const allTiers = await Tier.findAll({
    where: { isActive: true },
    order: [['priority', 'DESC']] // Highest priority first
  });
  
  // Find the highest tier the customer qualifies for
  const eligibleTier = allTiers.find(tier => lifetimeSpend >= tier.minSpend);
  
  if (eligibleTier) {
    // Update customer's tier
    await Customer.update(
      { tierId: eligibleTier.id },
      { where: { id: customerId } }
    );
    
    return eligibleTier;
  }
  
  return null;
};

// Call this after invoice status changes to 'completed'
// Or run as a scheduled job
```

#### Database Columns Used

**From `Invoice` table:**
- `customer_id` (INTEGER) - Foreign key to Customer
- `total_amount` (DECIMAL 10,2) - Total invoice amount
- `status` (ENUM) - Invoice status ('completed', 'awaiting payment', etc.)

**From `Order` table (alternative):**
- `customer_id` (INTEGER) - Foreign key to Customer
- `final_amount` (DECIMAL 10,2) - Final order amount after discounts
- `status` (ENUM) - Order status ('approved', 'completed', etc.)

**Note**: There is **no `lifetimeSpend` column** in the Customer table. Spending is calculated dynamically from invoices/orders.

---

### Database Schema (PostgreSQL + Sequelize)

**Recommended Model: `Tier`**

```javascript
const Tier = sequelize.define('Tier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discountPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'discount_percent'
  },
  minSpend: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'min_spend'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  timestamps: true,
  tableName: 'Tier'
});
```

**Recommended Customer Relation:**
```javascript
// In Customer model
tierId: {
  type: DataTypes.INTEGER,
  references: {
    model: 'Tier',
    key: 'id'
  },
  field: 'tier_id'
}

// Association
Customer.belongsTo(Tier, { foreignKey: 'tierId', as: 'tier' });
Tier.hasMany(Customer, { foreignKey: 'tierId' });
```

---

## Utility Functions

### discounts.js

**Location**: `frontend/src/utils/discounts.js`

**Function: `computeBestOf(items, tierPercent, options)`**

**Purpose**: Calculates which discount path (tier vs product) is better.

**Parameters:**
- `items`: Array of order items with `sellingPrice`, `discountedPrice`, `quantity`
- `tierPercent`: Customer's tier discount percentage (0-100)
- `options`: Optional config object

**Returns:**
```javascript
{
  applied: 'tier' | 'product' | 'none',
  baseSubtotal: 3000,
  productTotal: 2700,      // Total with product discounts
  tierTotal: 2400,         // Total with tier discount
  chosenTotal: 2400,       // Lower of productTotal vs tierTotal
  savingsAmount: 600,      // baseSubtotal - chosenTotal
  savingsPercentOfProduct: 20, // Effective discount %
  tierPercent: 20
}
```

**Logic Flow:**
1. Calculate base subtotal (sum of all items at base price)
2. Calculate product total (sum using product discounts if available)
3. Calculate tier total (base subtotal × (1 - tierPercent/100))
4. Choose the lower total
5. Return metadata about which path was chosen

---

## Service Functions

### tierService.js

**Location**: `frontend/src/services/tierService.js`

**Functions:**
- `getTiers()`: Fetch all tiers for settings page
- `saveTiers(tiers)`: Save tier configuration
- `getMyTier()`: Get current logged-in customer's tier
- `getCustomerTier(customerId)`: Get specific customer's tier (for sales staff)

---

## Implementation Checklist

### ✅ Completed (Frontend)
- [x] Tier management UI in Settings.jsx
- [x] Tier display in Profile.jsx
- [x] Auto-discount calculation in HandleOrders.jsx
- [x] Tier display in Cart.jsx preview
- [x] Best-of discount utility function
- [x] Tier service functions

### 🔲 TODO (Backend)
- [ ] Create `Tier` model in PostgreSQL
- [ ] Create migration script for `Tier` table
- [ ] Add `tierId` column to `Customer` table
- [ ] Implement GET `/api/settings/tiers` endpoint
- [ ] Implement PUT `/api/settings/tiers` endpoint
- [ ] Implement GET `/api/settings/tiers/me` endpoint
- [ ] Implement GET `/api/settings/tiers/customer/:customerId` endpoint
- [ ] Auto-assign tier to customers based on `minSpend` (optional)
- [ ] Update order creation to respect tier discounts in backend (currently frontend-only)

---

## Usage Examples

### Example 1: Admin Creating Tiers

1. Go to **Settings** → **Account Tiers** tab
2. Click **"Add Tier"** button
3. Fill in:
   - Priority: `1`
   - Name: `Bronze`
   - Discount %: `0`
   - Min Spend: `0`
   - Active: ✓
4. Click **"Save Tiers"**

### Example 2: Customer Viewing Their Tier

1. Go to **Profile** → **Account Tier** tab
2. See: "Your tier: Gold - 20% Discount"
3. See progress bar: "Spent ₱75,000 / ₱100,000 to reach Platinum"

### Example 3: Sales Processing Order

1. Go to **Orders** → **Pending** tab
2. Click **"Review"** on an order
3. Modal shows:
   - "Applied Gold Tier 20% (saved ₱600)"
   - Original: ~~₱3,000~~ → Final: ₱2,400
4. Click **"Process Order"** (discount auto-applied)

---

## Notes

- **No Stacking**: Only one discount applies (best-of logic ensures maximum savings)
- **Auto-Calculation**: Discounts are computed automatically; no manual input
- **Tier Assignment**: Currently manual via database; can be automated based on `minSpend`
- **Fallback**: If tier endpoints aren't ready, UI gracefully shows "No tier assigned"

