# Role-Based Metrics Cards Testing Guide

## How to Test Different User Roles

### Current Role Configuration (2-4 cards per role):

| Role | Cards | Card Names |
|------|-------|------------|
| **Admin** | 4 cards | Today's Sales, Today's Orders, Low Stock Items, Today's Customers |
| **Sales User** | 3 cards | Today's Sales, Today's Orders, Today's Customers |
| **Inventory Manager** | 4 cards | Low Stock Items, Total Stock Value, Out of Stock Items, Reorder Pending |
| **Logistics User** | 3 cards | Today's Orders, Low Stock Items, Reorder Pending |

### Testing Steps:

1. **Open Browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Set different roles by running these commands:**

```javascript
// Test Admin role (4 cards)
localStorage.setItem('userRole', 'admin');
location.reload();

// Test Sales User role (3 cards)
localStorage.setItem('userRole', 'sales');
location.reload();

// Test Inventory Manager role (4 cards)
localStorage.setItem('userRole', 'inventory');
location.reload();

// Test Logistics User role (3 cards)
localStorage.setItem('userRole', 'logistics');
location.reload();
```

### What You'll See:

- **Admin**: 4 cards + Inventory Alerts section
- **Sales**: 3 sales-focused cards, no inventory alerts
- **Inventory**: 4 inventory-focused cards + Inventory Alerts section
- **Logistics**: 3 mixed cards + Inventory Alerts section

### In Production:

Replace the localStorage system with your authentication system:

```javascript
// In utils/roleManager.js, update getCurrentUserRole():
export const getCurrentUserRole = () => {
  // Get from JWT token, auth context, or API
  return authContext.user?.role || 'admin';
};
``` 