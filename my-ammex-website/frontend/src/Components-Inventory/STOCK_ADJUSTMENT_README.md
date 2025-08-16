# Stock Adjustment Feature

## Overview
The Stock Adjustment feature allows users to quickly add or remove quantities from existing inventory items without going through the full edit process.

## How to Use

### Method 1: Quick Access Button
1. Navigate to the Inventory > Items page
2. In the Quantity column, click the small "+" button next to any item's quantity
3. The Stock Adjustment Modal will open
4. Choose whether to add or remove stock
5. Enter the quantity and reason
6. Click "Add Stock" or "Remove Stock"

### Method 2: Dropdown Menu
1. Navigate to the Inventory > Items page
2. Click the three-dot menu (⋮) on any item row
3. Select "Adjust Stock" from the dropdown
4. Follow the same steps as above

## Features

### Add Stock
- Increase item quantity
- Green-themed interface
- No quantity limits

### Remove Stock
- Decrease item quantity
- Red-themed interface
- Prevents removing more than current stock
- Shows warning for negative stock scenarios

### Validation
- Quantity must be positive
- Reason is required
- Cannot remove more stock than available
- Real-time preview of new stock level

### User Experience
- Clean, intuitive interface
- Item information displayed
- Current stock vs. new stock preview
- Responsive design
- Loading states during API calls

## Technical Details

### Frontend Components
- `StockAdjustmentModal.jsx` - Main modal component
- Integrated into `ItemsTable.jsx`
- Added to `dropdownActions.js`

### Backend Integration
- Uses existing `updateItemStock` API endpoint
- PATCH `/api/items/:id/stock`
- Updates item quantity in database

### State Management
- Local state for modal visibility
- Loading states for better UX
- Error handling and validation
- Success feedback via existing SuccessModal

## Benefits

1. **Speed**: Quick stock adjustments without full item editing
2. **Audit Trail**: Reason field for tracking changes
3. **User-Friendly**: Intuitive interface for common operations
4. **Validation**: Prevents invalid stock operations
5. **Consistency**: Follows existing design patterns

## Future Enhancements

- Stock movement history tracking
- Bulk stock adjustments
- Integration with purchase orders
- Stock adjustment notifications
- Advanced reporting on stock changes