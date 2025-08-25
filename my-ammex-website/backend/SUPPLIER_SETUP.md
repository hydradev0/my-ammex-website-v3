# Supplier Backend Setup

This document describes how to set up and test the supplier backend functionality for the Ammex Website.

## Overview

The supplier backend follows the same pattern as the customer backend, providing CRUD operations for managing supplier information. Suppliers are used in the inventory system for the vendor field in items.

## Database Model

The `Supplier` model includes the following fields:

- `id` - Primary key (auto-increment)
- `supplierId` - Unique supplier identifier (auto-generated as SUP001, SUP002, etc.)
- `companyName` - Company name (required)
- `street` - Street address
- `city` - City
- `postalCode` - Postal code
- `country` - Country
- `contactName` - Contact person name
- `telephone1` - Primary telephone (required)
- `telephone2` - Secondary telephone
- `email1` - Primary email (required)
- `email2` - Secondary email
- `isActive` - Active status (default: true)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

### Authentication Required
All endpoints require authentication via JWT token.

### GET /api/suppliers
- **Description**: Get all suppliers with pagination and search
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10)
  - `search` - Search term for company name, supplier ID, or email
  - `isActive` - Filter by active status (true/false)
- **Access**: Admin, Sales Marketing, Client (read-only)

### GET /api/suppliers/stats
- **Description**: Get supplier statistics
- **Access**: Admin, Sales Marketing, Client (read-only)

### GET /api/suppliers/:id
- **Description**: Get single supplier by ID
- **Query Parameters**:
  - `include` - Include related data (future use)
- **Access**: Admin, Sales Marketing, Client (read-only)

### POST /api/suppliers
- **Description**: Create new supplier
- **Required Fields**: companyName, telephone1, email1
- **Access**: Admin, Sales Marketing

### PUT /api/suppliers/:id
- **Description**: Update existing supplier
- **Access**: Admin, Sales Marketing

### DELETE /api/suppliers/:id
- **Description**: Soft delete supplier (sets isActive to false)
- **Access**: Admin, Sales Marketing

## Setup Instructions

### 1. Database Setup
The suppliers table will be automatically created when you run the database setup:

```bash
npm run setup-db
```

### 2. Install Dependencies
Make sure axios is installed for testing:

```bash
npm install
```

### 3. Create Sample Data (Optional)
To create sample supplier data for testing:

```bash
npm run create:suppliers
```

### 4. Test API Endpoints
To test all supplier API endpoints:

```bash
npm run test:suppliers
```

**Note**: The test script requires authentication. Make sure you have a valid JWT token or are logged in.

## Integration with Frontend

The supplier backend integrates with the frontend in the following ways:

1. **SupplierTable Component**: Displays and manages suppliers
2. **NewItemModal**: Uses suppliers for the vendor dropdown
3. **Inventory Management**: Suppliers are referenced in item creation

## Validation Rules

- `companyName`: Required, non-empty string
- `telephone1`: Required, non-empty string
- `email1`: Required, valid email format
- `email2`: Optional, but must be valid email if provided
- `telephone2`: Optional, but must be non-empty if provided

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Security

- All endpoints require authentication
- Role-based access control implemented
- Input validation and sanitization
- SQL injection protection via Sequelize ORM

## Testing

### Manual Testing
1. Start the backend server: `npm run dev`
2. Use Postman or similar tool to test endpoints
3. Include Authorization header: `Bearer <your-jwt-token>`

### Automated Testing
Run the test script: `npm run test:suppliers`

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   - Ensure you have a valid JWT token
   - Check if the token has expired

2. **Validation Errors (400)**
   - Verify required fields are provided
   - Check email format for email fields

3. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in .env file

4. **Table Not Found**
   - Run `npm run setup-db` to create tables
   - Check database connection

### Logs
Check server logs for detailed error information and debugging.

## Future Enhancements

Potential improvements for the supplier system:

1. **Supplier Categories**: Add categorization for different types of suppliers
2. **Performance Metrics**: Track supplier performance and ratings
3. **Payment Terms**: Add payment terms and credit limit fields
4. **Order History**: Link suppliers to purchase orders
5. **Document Management**: Store supplier contracts and documents
6. **Audit Trail**: Track changes to supplier information

## Support

For issues or questions regarding the supplier backend, check the logs and ensure all setup steps have been completed correctly.
