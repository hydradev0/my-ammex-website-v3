import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Import your page components
import Dashboard from './Pages/Home/Dashboard'; // Update this path to where your Dashboard component is located
import Analytics from './Pages/Home/Analytics';
import Customers from './Pages/BusinessPartners/Customers';
import Suppliers from './Pages/BusinessPartners/Suppliers';
import SalesQuotes from './Pages/Sales/SalesQuotes';
import PurchaseQuotes from './Pages/Purchasing/PurchaseQuotes';
import PurchaseOrder from './Pages/Purchasing/PurchaseOrder';
import Inventory from './Pages/Inventory/Inventory';
import SalesOrder from './Pages/Sales/SalesOrder';
import SalesInvoice from './Pages/Sales/SalesInvoice';
import AccountManagement from './Pages/Admin/AccountManagement';
import CustomerPortal from './Pages/CustomerPortal/CustomerPortal';
import Cart from './Components-CustomerPortal/Cart';
import Profile from './Components-CustomerPortal/Profile';
import Orders from './Components-CustomerPortal/Orders';
import Invoice from './Components-CustomerPortal/Invoice';
import ProductSpecs from './Pages/Inventory/ProductSpecs';
import ProtectedRoute from './Components/ProtectedRoute';
import Login from './Pages/Auth/Login';

import CustomerOrders from './Pages/Sales/CustomerOrders';
import CustomerPayments from './Pages/Sales/CustomerPayments';
import Invoices from './Pages/Sales/Invoices';

function App() {
  return (
    <>
    <BrowserRouter>
      <div className="app-scale-wrapper">
      <div className='text-gray-900 min-h-screen '>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        
        {/* Home */}
        <Route path="Home/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="Home/Analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

        {/* Business Partners - Admin and Sales Marketing */} 
        <Route
          path="BusinessPartners/Customers"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="BusinessPartners/Suppliers"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />

        {/* Sales - Admin and Sales Marketing */}
        <Route
          path="Sales/Orders"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="Sales/Invoices"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="Sales/Payments"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <CustomerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="Sales/SalesQuotes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesQuotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="Sales/SalesOrder"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="Sales/SalesInvoice"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesInvoice />
            </ProtectedRoute>
          }
        />
        {/* Inventory - Admin, Warehouse Supervisor, Sales Marketing (read-only for Sales) */}
        <Route
          path="Inventory/*"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor", "Sales Marketing"]}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Inventory/ProductSpecs"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor"]}>
              <ProductSpecs />
            </ProtectedRoute>
          }
        />

        {/* Purchasing - Admin and Sales Marketing */}
        <Route
          path="Purchasing/PurchaseQuotes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <PurchaseQuotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="Purchasing/PurchaseOrder"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <PurchaseOrder />
            </ProtectedRoute>
          }
        />
        {/* Administration */}
        <Route path="Admin/AccountManagement" element={<ProtectedRoute requiredRole="Admin"><AccountManagement /></ProtectedRoute>} />
        
        {/* Customer Portal - Client role only */}
        <Route
          path="Products"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="Products/Cart"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="Products/Profile"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="Products/Orders"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="Products/Invoices"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Invoice />
            </ProtectedRoute>
          }
        />
        
        {/* Default Page */}
        <Route path="/" element={<Login />} />
      </Routes>
        </div>
      </div>
    </BrowserRouter>
    </>
  );
}

export default App;