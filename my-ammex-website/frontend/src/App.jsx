import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './Layout';

import Dashboard from './Pages/Home/Dashboard'; 
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
import Payment from './Components-CustomerPortal/Payment';
import ProductSpecs from './Pages/Inventory/ProductSpecs';

import ProtectedRoute from './Components/ProtectedRoute';
import Login from './Pages/Auth/Login';

import CustomerOrders from './Pages/Sales/CustomerOrders';
import CustomerPayments from './Pages/Sales/CustomerPayments';
import ManagePaymentMethods from './Components-CustomerPayments/ManagePaymentMethods';
import Invoices from './Pages/Sales/Invoices';

import SalesTrend from './Components-Analytics/SalesTrend';
import CustomerPurchase from './Components-Analytics/CustomerPurchase';

function AppContent() {
  const location = useLocation();
  const shouldShowGradient = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/Home/HistoricalSales';
  const shouldShowAnalyticsGradient = location.pathname === '/home/salestrend' || location.pathname === '/home/customerpurchase';
  
  useEffect(() => {
    if (shouldShowAnalyticsGradient) {
      document.body.classList.add('analytics-gradient-bg');
    } else {
      document.body.classList.remove('analytics-gradient-bg');
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('analytics-gradient-bg');
    };
  }, [shouldShowAnalyticsGradient, location.pathname]);
  
  useEffect(() => {
    if (shouldShowGradient) {
      document.body.classList.add('gradient-bg');
    } else {
      document.body.classList.remove('gradient-bg');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('gradient-bg');
    };
  }, [shouldShowGradient, location.pathname]);


  
  return (
    <>
      <Layout>
        <div className="app-scale-wrapper">
          <div className='text-gray-900 min-h-screen'>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        
        {/* Home */}
        <Route 
          path="home/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor", "Sales Marketing"]}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="home/analytics" 
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing", "Warehouse Supervisor"]}>
              <Analytics />
            </ProtectedRoute>
          } 
        />

        {/* Business Partners - Admin and Sales Marketing */} 
        <Route
          path="businesspartners/customers"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing",]}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="businesspartners/suppliers"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor"]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />

        {/* Sales - Admin and Sales Marketing */}
        <Route
          path="sales/orders"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/invoices"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/payments"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <CustomerPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/managepaymentmethods"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <ManagePaymentMethods />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/salesquotes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesQuotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/salesorder"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/salesinvoice"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <SalesInvoice />
            </ProtectedRoute>
          }
        />
        {/* Inventory - Admin, Warehouse Supervisor, Sales Marketing (read-only for Sales) */}
        <Route
          path="inventory/*"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor", "Sales Marketing"]}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/productspecs"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Warehouse Supervisor"]}>
              <ProductSpecs />
            </ProtectedRoute>
          }
        />

        {/* Purchasing - Admin and Sales Marketing */}
        <Route
          path="purchasing/purchasequotes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <PurchaseQuotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchasing/purchaseorder"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Sales Marketing"]}>
              <PurchaseOrder />
            </ProtectedRoute>
          }
        />
        {/* Administration */}
        <Route path="admin/accountmanagement" element={<ProtectedRoute requiredRole="Admin"><AccountManagement /></ProtectedRoute>} />
        
        {/* Customer Portal - Client role only */}
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/cart"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/profile"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/orders"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/invoices"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Invoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/payment"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <Payment />
            </ProtectedRoute>
          }
        />

          
        <Route path="home/salestrend" element={<SalesTrend />} />
        <Route path="home/customerpurchase" element={<CustomerPurchase />} />
        
        {/* Default Page */}
        <Route path="/" element={<Login />} />
      </Routes>
          </div>
        </div>
      </Layout>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;