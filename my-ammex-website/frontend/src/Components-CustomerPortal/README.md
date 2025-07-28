# Customer Portal Components

This directory contains the components for the Industrial Equipment Customer Portal (POS system).

## Component Structure

### Main Components

- **IndustrialPOS.jsx** - Main container component that manages state and coordinates all sub-components
- **ProductGrid.jsx** - Displays products in a responsive grid layout
- **ProductCard.jsx** - Individual product card with add to cart functionality
- **SearchFilters.jsx** - Search input and category filter buttons
- **CartSidebar.jsx** - Shopping cart sidebar with item management
- **Pagination.jsx** - Page navigation for product grid

## Features

- **Product Browsing**: Grid layout with responsive design
- **Search & Filter**: Real-time search and category filtering
- **Shopping Cart**: Add/remove items, quantity management
- **Pagination**: Navigate through product pages
- **Stock Management**: Shows stock levels and prevents over-ordering

## Usage

The customer portal is accessible via the navigation menu under "Customer Portal" > "Shop Equipment".

## Data Structure

### Product Object
```javascript
{
  id: number,
  name: string,
  category: string,
  price: number,
  image: string, // Emoji or image URL
  stock: number
}
```

### Cart Item Object
```javascript
{
  id: number,
  name: string,
  category: string,
  price: number,
  image: string,
  stock: number,
  quantity: number
}
```

## Future Enhancements

- Integration with backend API for real product data
- User authentication and order history
- Payment processing integration
- Wishlist functionality
- Product reviews and ratings
- Advanced filtering (price range, brand, etc.)
- Bulk ordering capabilities
- Order tracking 