# Notification System Implementation

## Overview

This document describes the comprehensive notification system implemented for the Ammex Website. The system now supports:

1. **Order Approval Notifications** - Notifies sales/admin when orders are approved
2. **Stock Level Notifications** - Notifies warehouse/admin when items reach minimum or maximum stock levels
3. **Existing Notifications** - Order rejections and appeals (already implemented)

## New Features Added

### 1. Order Approval Notifications

When an order is approved:
- **Customer Notification**: Customer receives a notification about order approval
- **Admin/Sales Notification**: Admin and Sales Marketing users receive notifications about approved orders

### 2. Stock Level Notifications

When stock levels change:
- **Low Stock Alert**: Triggered when item quantity reaches or goes below minimum level
- **High Stock Alert**: Triggered when item quantity reaches or exceeds maximum level
- **Severity Levels**: Critical (out of stock), High (30% of min level), Medium (below min level)

## Implementation Details

### Database Changes

#### Updated Notification Model
```javascript
// New notification types added to enum
type: {
  type: DataTypes.ENUM(
    'payment_rejected', 
    'payment_approved', 
    'invoice_overdue', 
    'order_rejected', 
    'order_appeal', 
    'order_approved',    // NEW
    'stock_low',         // NEW
    'stock_high',        // NEW
    'general'
  ),
  allowNull: false
}
```

### New Files Created

1. **`/backend/services/notificationService.js`**
   - Handles stock level monitoring
   - Creates stock notifications
   - Manages notification queries

2. **`/backend/controllers/notificationController.js`**
   - Unified notification controller
   - Handles all notification types
   - Role-based notification filtering

3. **`/backend/routes/notifications.js`**
   - RESTful API endpoints for notifications
   - Role-based access control

4. **`/backend/scripts/updateNotificationTypes.js`**
   - Database migration script
   - Updates enum types in PostgreSQL

5. **`/backend/scripts/testNotificationSystem.js`**
   - Comprehensive test suite
   - Validates all notification features

### Modified Files

1. **`/backend/models-postgres/index.js`**
   - Added new notification types to enum

2. **`/backend/controllers/orderController.js`**
   - Added order approval notifications
   - Updated notification fetching logic
   - Added stock level monitoring after inventory deduction

3. **`/backend/controllers/itemController.js`**
   - Added stock level monitoring to stock updates
   - Integrated with notification service

4. **`/backend/server.js`**
   - Added notification routes

## API Endpoints

### Notification Endpoints

```
GET    /api/notifications              # Get all notifications for user
GET    /api/notifications/stock         # Get stock notifications (Admin/Warehouse Supervisor)
PATCH  /api/notifications/:id/read      # Mark notification as read
PATCH  /api/notifications/read-all      # Mark all notifications as read
GET    /api/notifications/stats         # Get notification statistics
```

### Role-Based Access

- **Admin**: Can see all notifications (orders, stock, general)
- **Sales Marketing**: Can see order and general notifications (NO stock alerts)
- **Warehouse Supervisor**: Can see stock notifications only
- **Client**: Can see their own order notifications

## Notification Types

### Order Notifications
- `order_approved`: Order has been approved
- `order_rejected`: Order has been rejected
- `order_appeal`: Customer appealed a rejected order

### Stock Notifications
- `stock_low`: Item quantity at or below minimum level
- `stock_high`: Item quantity at or above maximum level

### General Notifications
- `general`: System-wide notifications for admins

## Stock Level Monitoring

### Automatic Triggers
1. **Item Stock Updates**: When `updateItemStock` is called
2. **Order Approval**: When inventory is deducted after order approval
3. **Manual Stock Adjustments**: Any quantity changes

### Severity Levels
- **CRITICAL**: Item is out of stock (quantity = 0)
- **HIGH**: Item quantity ≤ 30% of minimum level
- **MEDIUM**: Item quantity ≤ minimum level

## Usage Examples

### Testing the System

```bash
# Run the migration script
node backend/scripts/updateNotificationTypes.js

# Test the notification system
node backend/scripts/testNotificationSystem.js
```

### API Usage

```javascript
// Get all notifications for current user
GET /api/notifications

// Get stock notifications (Admin/Warehouse Supervisor only)
GET /api/notifications/stock

// Mark notification as read
PATCH /api/notifications/123/read

// Mark all notifications as read
PATCH /api/notifications/read-all
```

## Integration Points

### Order Approval Flow
1. Order status changed to 'approved'
2. Inventory deducted from items
3. Stock level monitoring triggered
4. Notifications created for customer and admin
5. Stock notifications created if levels reached

### Stock Management Flow
1. Item quantity updated
2. Stock level monitoring triggered
3. Notifications created if thresholds reached
4. Warehouse supervisor notified

## Error Handling

- Notification failures don't break main operations
- Comprehensive error logging
- Graceful degradation if notification service fails

## Performance Considerations

- Notifications are created asynchronously
- Database queries are optimized with proper indexing
- Role-based filtering reduces unnecessary data transfer

## Security

- Role-based access control
- User ownership validation for client notifications
- Admin-only access to system notifications

## Future Enhancements

1. **Email Notifications**: Send email alerts for critical notifications
2. **Push Notifications**: Real-time browser notifications
3. **Notification Preferences**: User-configurable notification settings
4. **Bulk Operations**: Batch notification management
5. **Notification History**: Archive old notifications

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check PostgreSQL connection and permissions
2. **Notifications Not Created**: Verify database models are loaded
3. **Permission Errors**: Ensure user has correct role assignments

### Debug Commands

```bash
# Check notification types in database
SELECT DISTINCT type FROM "Notification";

# Check recent notifications
SELECT * FROM "Notification" ORDER BY created_at DESC LIMIT 10;

# Check stock levels
SELECT item_name, quantity, min_level, max_level FROM "Item" WHERE quantity <= min_level;
```

## Conclusion

The notification system is now fully integrated and provides comprehensive monitoring for:
- Order lifecycle events
- Stock level management
- Role-based notification delivery
- Real-time alerting for critical situations

The system is designed to be robust, scalable, and maintainable while providing essential business intelligence through timely notifications.
