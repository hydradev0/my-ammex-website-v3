# Authentication System

This directory contains the authentication components for the Ammex website.

## Components

### Login.jsx
A modern login form that handles user authentication. Features include:
- Email and password validation
- Loading states
- Error handling
- Role-based redirects after login
- Remember me functionality
- Responsive design with Tailwind CSS

## Usage

### Accessing the Login Page
Navigate to `/login` in your application to access the login form.

### Authentication Flow
1. User enters email and password
2. Form validates input
3. Credentials are sent to `/api/auth/login` endpoint
4. On success, JWT token is stored in localStorage
5. User is redirected based on their role:
   - Admin → `/admin/dashboard`
   - Sales → `/sales/dashboard`
   - Inventory → `/inventory/dashboard`
   - Default → `/dashboard`

### Protected Routes
Use the `ProtectedRoute` component to secure routes that require authentication:

```jsx
import ProtectedRoute from '../components/ProtectedRoute';

<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### Authentication Context
The `AuthContext` provides authentication state throughout the application:

```jsx
import { useAuth } from '../contexts/AuthContext';

const { user, login, logout, isAuthenticated } = useAuth();
```

## Backend Requirements

The login system expects the following backend endpoints:
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

## Security Features

- JWT token-based authentication
- Automatic token expiration handling
- Role-based access control
- Secure password handling (backend)
- Protected route components
- Automatic logout on token expiration

## Styling

The login form uses Tailwind CSS for styling and is fully responsive. The design follows modern UI/UX principles with:
- Clean, minimalist interface
- Proper form validation states
- Loading indicators
- Error message display
- Hover and focus states


