import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Import your page components
import Dashboard from './Pages/Home/Dashboard'; // Update this path to where your Dashboard component is located
import Analytics from './Pages/Home/Analytics';
import Customers from './Pages/BusinessPartners/Customers';
import SalesQuotes from './Pages/Sales/SalesQuotes';
import PurchaseQuotes from './Pages/Purchasing/PurchaseQuotes';
import PurchaseOrder from './Pages/Purchasing/PurchaseOrder';
import Inventory from './Pages/Inventory/Inventory';
import SalesOrder from './Pages/Sales/SalesOrder';
import SalesInvoice from './Pages/Sales/SalesInvoice';
import CustomerOrders from './Pages/Sales/CustomerOrders';
import EmployeeManagement from './Pages/Admin/EmployeeManagement';

function App() {
  return (
    <>
    <BrowserRouter>
      <div className="app-scale-wrapper">
      <div className='bg-gray-100 min-h-screen'>
      <Routes>
        {/* Home */}
        <Route path="Home/Dashboard" element={<Dashboard />} />
        <Route path="Home/Analytics" element={<Analytics />} />

        {/* Business Partners */} 
        <Route path="BusinessPartners/Customers" element={<Customers />} />

        {/* Sales */}
        <Route path="Sales/CustomerOrders" element={<CustomerOrders />} />
        <Route path="Sales/SalesQuotes" element={<SalesQuotes />} />
        <Route path="Sales/SalesOrder" element={<SalesOrder />} />
        <Route path="Sales/SalesInvoice" element={<SalesInvoice />} />
        {/* Inventory */}
        <Route path="Inventory/*" element={<Inventory />} />

        {/* Purchasing */}
        <Route path="Purchasing/PurchaseQuotes" element={<PurchaseQuotes />} />
        <Route path="Purchasing/PurchaseOrder" element={<PurchaseOrder />} />
        {/* Administration */}
        <Route path="Admin/EmployeeManagement" element={<EmployeeManagement />} />
        {/* Default Page */}
        <Route path="/" element={<Dashboard />} />
      </Routes>
        </div>
      </div>
    </BrowserRouter>
    </>
  );
}

export default App;