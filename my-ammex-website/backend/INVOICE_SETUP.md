# Invoice Backend Implementation

## Overview
This document describes the invoice backend functionality that has been implemented for the Ammex Website. The invoice system automatically creates invoices when orders are approved by sales staff and provides separate views for current invoices and invoice history.

## Features Implemented

### 1. Database Models
- **Invoice Model**: Main invoice entity with all required fields
- **InvoiceItem Model**: Individual items within each invoice
- **Relationships**: Proper foreign key relationships with Orders, Customers, Items, and Users

### 2. Invoice Status Flow
- **Awaiting Payment**: Invoices created from approved orders (shown in "Current Invoices")
- **Completed**: Manually marked as completed (shown in "Invoice History")
- **Partially Paid**: Invoices with some payments made
- **Overdue**: Invoices past due date with remaining balance
- **Rejected**: Invoices that have been rejected

### 3. Automatic Invoice Generation
- Invoices are automatically created when orders are approved by Admin or Sales Marketing staff
- Invoice numbers follow format: `INV-YYYYMMDD-XXXX` (4-digit random number)

### 4. API Endpoints

#### Admin/Sales Marketing Access
- `GET /api/invoices` - Get all invoices with pagination and filtering
- `GET /api/invoices/status/:status` - Get invoices by status (awaiting payment/completed/partially paid/overdue/rejected)
- `GET /api/invoices/:id` - Get single invoice details
- `POST /api/invoices` - Manually create invoice from approved order
- `PATCH /api/invoices/:id/status` - Update invoice status

#### Client Access
- `GET /api/invoices/my` - Get authenticated client's own invoices

## Database Schema

### Invoice Table
```sql
- id (Primary Key, Auto Increment)
- invoiceNumber (Unique String)
- orderId (Foreign Key to Order)
- customerId (Foreign Key to Customer)
- invoiceDate (Date, Default: Now)
- dueDate (Date, 30 days from invoice date)
- totalAmount (Decimal 10,2)
- status (Enum: 'awaiting payment', 'partially paid', 'completed', 'rejected', 'overdue')
- paymentTerms (String, Default: '30 days')
- notes (Text, Optional)
- createdBy (Foreign Key to User)
- createdAt, updatedAt (Timestamps)
```

### InvoiceItem Table
```sql
- id (Primary Key, Auto Increment)
- invoiceId (Foreign Key to Invoice)
- itemId (Foreign Key to Item)
- quantity (Integer)
- unitPrice (Decimal 10,2)
- totalPrice (Decimal 10,2)
- createdAt, updatedAt (Timestamps)
```

## Setup Instructions

### 1. Create Database Tables
Run the migration script to create the invoice tables:
```bash
cd backend
node scripts/createInvoiceTables.js
```

### 2. Restart Server
Restart your backend server to load the new models and routes:
```bash
npm run dev
```

## Usage Examples

### 1. Automatic Invoice Creation
When an Admin or Sales Marketing user approves an order:
```javascript
// PATCH /api/orders/:id/status
{
  "status": "approved"
}
```
This automatically creates an invoice with status "awaiting payment".

### 2. Get Current Invoices (Awaiting Payment)
```javascript
// GET /api/invoices/status/awaiting payment
// Returns invoices with status "awaiting payment"
```

### 3. Get Invoice History (Completed)
```javascript
// GET /api/invoices/status/completed
// Returns invoices with status "completed"
```

### 4. Mark Invoice as Completed
```javascript
// PATCH /api/invoices/:id/status
{
  "status": "completed"
}
```

### 5. Client Viewing Their Invoices
```javascript
// GET /api/invoices/my
// Returns authenticated client's invoices in frontend-compatible format
```

## Frontend Integration

The backend is designed to work with your existing frontend components:

### ProcessedInvoices.jsx
- **Current Invoices Tab**: Shows invoices with status "awaiting payment"
- **Invoice History Tab**: Shows invoices with status "completed"

### Invoice.jsx (Client Portal)
- Shows client's own invoices with proper formatting
- Includes payment status logic (awaiting payment/overdue/partially paid/completed)

## Data Flow

1. **Order Creation**: Customer creates order
2. **Order Approval**: Admin/Sales approves order → Invoice automatically created
3. **Current Invoices**: Shows awaiting payment invoices to staff
4. **Invoice Completion**: Staff marks invoice as completed → Moves to history
5. **Client Access**: Clients can view their invoices in the portal

## Permissions

- **Admin**: Full access to all invoice operations
- **Sales Marketing**: Full access to all invoice operations
- **Client**: Can only view their own invoices
- **Warehouse Supervisor**: No invoice access (as per requirements)

## Error Handling

- Duplicate invoice creation is prevented
- Only approved orders can be converted to invoices
- Proper validation on all endpoints
- Graceful error handling with meaningful messages

## Future Enhancements

This implementation provides a solid foundation for future enhancements:
- Payment tracking and status updates
- PDF invoice generation
- Email notifications
- Advanced reporting and analytics
- Invoice templates and customization

## Testing

To test the implementation:

1. Create and approve an order
2. Check that an invoice was automatically created
3. Verify invoice appears in "Current Invoices" tab
4. Mark invoice as completed
5. Verify invoice appears in "Invoice History" tab
6. Test client access to their invoices

## Files Modified/Created

### New Files
- `backend/controllers/invoiceController.js`
- `backend/routes/invoices.js`
- `backend/scripts/createInvoiceTables.js`
- `backend/INVOICE_SETUP.md`

### Modified Files
- `backend/models-postgres/index.js` - Added Invoice and InvoiceItem models
- `backend/controllers/orderController.js` - Added automatic invoice creation
- `backend/server.js` - Added invoice routes
