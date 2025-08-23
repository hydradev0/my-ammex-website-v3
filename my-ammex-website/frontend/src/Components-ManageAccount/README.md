# ManageAccountTable Component

## Overview
The `ManageAccountTable` component provides a comprehensive account management interface with a tabbed design that separates **Staff Accounts** and **Client Accounts** management. This component is designed for administrators to manage both internal employee accounts and external client user accounts from a single, organized interface.

## Features

### 🏢 Staff Accounts Tab
- **Create new staff accounts** with roles and departments
- **Edit existing employee information** (name, email, role, department)
- **Delete/Deactivate staff accounts** with confirmation
- **Role-based access control** with predefined roles:
  - Administrator
  - Sales Marketing
  - Warehouse Supervisor
- **Department assignment** with options:
  - Sales
  - Warehouse
  - Administration
  - Client Services
- **Dynamic form validation** and error handling
- **Real-time updates** after CRUD operations

### 👥 Client Accounts Tab
- **Manage client user accounts** (users with "Client" role)
- **Same table style and functionality** as Staff Accounts
- **Create new client accounts** with pre-filled Client role
- **Edit existing client information** (name, email, department)
- **Delete/Deactivate client accounts** with confirmation
- **Consistent user experience** across both tabs

## Technical Implementation

### Backend Integration
- **API Endpoints**: Uses existing `/api/auth/*` endpoints for all user management
- **Dynamic Data**: Fetches roles and departments from new API endpoints:
  - `GET /api/auth/roles` - Returns available user roles
  - `GET /api/auth/departments` - Returns available departments
- **Authentication**: JWT token-based authentication for all operations
- **Authorization**: Admin-only access to all features

### Frontend Architecture
- **Tabbed Interface**: Clean separation between staff and client management
- **State Management**: React hooks for local state management
- **Form Handling**: Controlled components with validation
- **Loading States**: User feedback during API operations
- **Error Handling**: Comprehensive error display and user feedback
- **Data Filtering**: Automatically separates staff and client users by role

### Data Flow
1. **Component Mount**: Fetches all users, then filters by role
2. **Tab Switching**: Dynamically renders appropriate filtered data
3. **Form Operations**: Handles create, read, update, delete operations
4. **Real-time Updates**: Refreshes both lists after successful operations

## Usage

### Access Control
- **Admin Only**: This component is restricted to users with 'Admin' role
- **Protected Routes**: Should be wrapped in appropriate authorization middleware

### Navigation
- **Staff Accounts**: Default tab for managing internal employee accounts (non-Client roles)
- **Client Accounts**: Secondary tab for managing client user accounts (Client role only)
- **Tab Switching**: Seamless navigation between different account types

## API Endpoints Used

### User Management
- `GET /api/auth/users` - Fetch all users (filtered by role for each tab)
- `POST /api/auth/register` - Create new user account
- `PUT /api/auth/users/:id` - Update existing user account
- `DELETE /api/auth/users/:id` - Delete/deactivate user account

### Configuration Data
- `GET /api/auth/roles` - Fetch available user roles
- `GET /api/auth/departments` - Fetch available departments

## Dependencies

### External Components
- `axios` - HTTP client for API communication

### Styling
- Tailwind CSS for responsive design
- Custom styling for form elements and tables

## Benefits of Tabbed Design

1. **Organized Workflow**: Clear separation of concerns between staff and client management
2. **Better UX**: Users can focus on one type of account management at a time
3. **Scalability**: Easy to add more account types in the future
4. **Maintenance**: Cleaner code organization and easier debugging
5. **User Training**: Intuitive interface that reduces learning curve
6. **Consistent Experience**: Same table style and functionality across both tabs

## Future Enhancements

- **Bulk Operations**: Select multiple accounts for batch operations
- **Advanced Filtering**: Role-based, department-based, and status filtering
- **Audit Logging**: Track changes and user actions
- **Export Functionality**: Generate reports and data exports
- **Role Templates**: Predefined role configurations for common job functions
- **Account Status Management**: Active/inactive status indicators

## Notes

- **Phone Number Removal**: The `phone_number` column has been removed from the database schema
- **Soft Delete**: All user accounts use soft deletion for data integrity
- **Password Security**: Passwords are not displayed when editing existing accounts
- **Real-time Validation**: Form validation occurs on both client and server side
- **Role-based Filtering**: Staff tab shows non-Client users, Client tab shows Client role users only
- **Pre-filled Forms**: New client accounts automatically get Client role and Client Services department

