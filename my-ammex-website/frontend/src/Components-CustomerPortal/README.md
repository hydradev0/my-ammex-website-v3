# Customer Portal Components

This directory contains all the components for the customer portal functionality.

## Components Overview

### IndustrialPOS.jsx
The main product catalog and shopping interface where customers can:
- Browse products by category
- Search for products
- Add items to cart
- View cart contents
- Checkout and place orders

### Cart.jsx (New Cart Page)
The dedicated shopping cart page that displays:
- Cart items with quantity controls
- Total price calculation
- Checkout functionality
- Order confirmation modal
- Modern, responsive design with improved UX

### Orders.jsx
The orders page where customers can:
- View all their placed orders
- See order details including items and totals
- Track order status
- View order history

### TopBarPortal.jsx
The navigation bar with:
- Ammex branding
- Navigation links (Products, Orders)
- Mobile-responsive menu
- Notification bell

## Checkout Functionality

### How it Works
1. **Add to Cart**: Customers can add products to their cart from the product grid
2. **Cart Management**: Click the cart button to navigate to the dedicated cart page
3. **Checkout Process**: 
   - Click "Proceed to Checkout" button on the cart page
   - Order is saved to localStorage with unique order number
   - Confirmation modal shows order details
   - Cart is cleared and user is redirected to products page
4. **Order Tracking**: Orders are displayed in the Orders page with full details

### Order Data Structure
```javascript
{
  id: "ORD-1234567890-123",
  orderNumber: "ORD-1234567890-123",
  items: [
    {
      id: 1,
      name: "Product Name",
      price: 99.99,
      quantity: 2,
      total: 199.98
    }
  ],
  totalAmount: 199.98,
  orderDate: "2024-01-01T12:00:00.000Z",
  status: "pending",
  customerName: "Customer",
  customerEmail: "customer@example.com"
}
```

### Testing the Checkout Flow
1. Navigate to `/Products` (Customer Portal)
2. Add items to cart by clicking "Add to Cart" on products
3. Navigate to cart page by clicking the cart icon
4. Click "Checkout" button
5. Confirm order in the modal
6. Navigate to `/Products/Orders` to view the order
7. Click "View" to see order details

### Data Persistence
- Orders are stored in browser localStorage under key `customerOrders`
- Data persists across browser sessions
- In production, this would be replaced with API calls to backend

## Responsive Design
All components are fully responsive and work on:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## Styling
Uses Tailwind CSS with custom color scheme:
- Primary blue: `#3182ce`
- Dark blue: `#2c5282`
- Consistent rounded corners and spacing
- Hover effects and transitions 