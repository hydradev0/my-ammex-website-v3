# Price Adjustment Feature

## Overview
The Price Adjustment feature allows users to quickly increase or decrease pricing for existing inventory items without going through the full edit process. This feature maintains price integrity by validating against floor and ceiling price constraints.

## How to Use

### Method 1: Quick Access Button
1. Navigate to the Inventory > Items page
2. In the Price column, click the small "$" button next to any item's price
3. The Price Adjustment Modal will open
4. Choose whether to increase or decrease the price
5. Enter the amount to add/subtract and reason
6. Click "Increase Price" or "Decrease Price"

### Method 2: Dropdown Menu
1. Navigate to the Inventory > Items page
2. Click the three-dot menu (⋮) on any item row
3. Select "Adjust Price" from the dropdown
4. Follow the same steps as above

## Features

### Increase Price
- Add amount to current price
- Green-themed interface
- Real-time preview of new price

### Decrease Price
- Subtract amount from current price
- Red-themed interface
- Prevents price from going below 0
- Shows warning for negative price scenarios

### Price Validation
- Amount must be positive
- Reason is required
- New price cannot be below floor price
- New price cannot exceed ceiling price
- Real-time preview of new price level

### User Experience
- Clean, intuitive interface
- Item information displayed with current pricing
- Floor and ceiling price constraints shown
- Price change preview with percentage calculation
- Responsive design
- Loading states during API calls

## Technical Details

### Frontend Components
- `PriceAdjustmentModal.jsx` - Main modal component
- Integrated into `ItemsTable.jsx`
- Added to `dropdownActions.js`

### Backend Integration
- Uses new `updateItemPrice` API endpoint
- PATCH `/api/items/:id/price`
- Updates item price in database
- Validates against floor/ceiling constraints

### State Management
- Local state for modal visibility
- Loading states for better UX
- Error handling and validation
- Success feedback via existing SuccessModal

## Benefits

1. **Speed**: Quick price adjustments without full item editing
2. **Audit Trail**: Reason field for tracking changes
3. **User-Friendly**: Intuitive interface for common operations
4. **Validation**: Prevents invalid price operations
5. **Consistency**: Follows existing design patterns
6. **Price Integrity**: Respects floor/ceiling price constraints

## Future Enhancements

- Price movement history tracking
- Bulk price adjustments
- Integration with supplier pricing
- Price adjustment notifications
- Advanced reporting on price changes
- Price trend analysis
- Competitive pricing insights

## Security & Access Control

- **Admin**: Full access to adjust prices
- **Warehouse Supervisor**: Full access to adjust prices
- **Sales Marketing**: Read-only access (cannot adjust prices)
- **Client**: Read-only access (cannot adjust prices)

## API Endpoint

```
PATCH /api/items/:id/price
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "price": 150.00,
  "reason": "Market price increase due to supply chain costs"
}

Response:
{
  "success": true,
  "data": { /* updated item object */ },
  "message": "Price updated successfully from ₱120.00 to ₱150.00"
}
```
