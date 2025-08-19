# Cart Database Setup and API Documentation

## Overview
The cart system has been implemented with full database persistence using PostgreSQL. The system is designed for authenticated customers only (no guest cart functionality).

## Database Models

### Cart Table
- `id` - Primary key
- `customerId` - Foreign key to Customer table
- `status` - ENUM: 'active', 'converted', 'abandoned'
- `lastUpdated` - Timestamp of last cart modification
- `notes` - Optional notes field
- `createdAt`, `updatedAt` - Timestamps

### CartItem Table
- `id` - Primary key
- `cartId` - Foreign key to Cart table
- `itemId` - Foreign key to Item table
- `quantity` - Item quantity (minimum 1)
- `unitPrice` - Price at time of adding to cart
- `addedAt` - Timestamp when item was added
- `createdAt`, `updatedAt` - Timestamps

## Setup Instructions

### 1. Database Tables Creation
The cart tables will be automatically created when you start the server (in development mode) due to `sequelize.sync({ alter: true })`.

Alternatively, you can run the dedicated script:
```bash
cd backend
node scripts/createCartTables.js
```

### 2. Environment Variables
Ensure your `.env` file contains:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
NODE_ENV=development
```

## API Endpoints

### Base URL
```
/api/cart
```

### Endpoints

#### Get Customer Cart
```
GET /api/cart/:customerId
```
Returns the customer's active cart with all items.

#### Add Item to Cart
```
POST /api/cart/:customerId/items
```
Body: `{ "itemId": 123, "quantity": 2 }`

#### Update Cart Item Quantity
```
PUT /api/cart/items/:cartItemId
```
Body: `{ "quantity": 3 }`

#### Remove Item from Cart
```
DELETE /api/cart/items/:cartItemId
```

#### Clear Customer Cart
```
DELETE /api/cart/:customerId/clear
```

#### Convert Cart to Order
```
POST /api/cart/:customerId/convert
```
Marks the cart as 'converted' (useful when creating orders).

## Frontend Integration

### Cart Service
A `cartService.js` has been created in `frontend/src/services/` with methods to interact with the cart API.

### Usage Example
```javascript
import { addToCart, getCustomerCart } from '../services/cartService';

// Add item to cart
await addToCart(customerId, itemId, quantity);

// Get customer's cart
const cartData = await getCustomerCart(customerId);
```

## Key Features

1. **Customer-Specific Carts**: Each customer has their own cart
2. **Stock Validation**: Prevents adding more items than available stock
3. **Price Tracking**: Stores the price at time of adding to cart
4. **Automatic Cart Creation**: Carts are created automatically when needed
5. **Status Tracking**: Carts can be active, converted, or abandoned
6. **Unique Constraints**: Prevents duplicate items in cart (updates quantity instead)

## Database Relationships

- `Customer` has one `Cart` (one-to-one)
- `Cart` has many `CartItem` (one-to-many)
- `Item` has many `CartItem` (one-to-many)
- `CartItem` belongs to both `Cart` and `Item`

## Security Considerations

- No guest cart functionality (as requested)
- All cart operations require a valid customer ID
- Stock validation prevents overselling
- Price validation ensures data integrity

## Testing

To test the cart functionality:

1. Ensure PostgreSQL is running
2. Start the backend server
3. Use the cart API endpoints with valid customer IDs
4. Verify cart operations work as expected

## Migration from localStorage

The existing frontend uses localStorage for cart functionality. To migrate to the database:

1. Update the frontend components to use the cart service
2. Replace localStorage operations with API calls
3. Handle authentication and customer identification
4. Update error handling for network requests

## Troubleshooting

### Common Issues

1. **Tables not created**: Ensure DATABASE_URL is set and database is accessible
2. **Foreign key errors**: Verify that Customer and Item records exist before adding to cart
3. **Stock validation errors**: Check item quantities in the database
4. **Connection issues**: Verify PostgreSQL is running and accessible

### Debug Mode
Set `NODE_ENV=development` to see detailed database logs and enable automatic table synchronization.

