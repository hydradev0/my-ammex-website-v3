import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, ChevronDown } from 'lucide-react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';

// Sample data - organized by year and month
const salesData = {
  '2025': {
    'October': {
      totalRevenue: 80000,
      numberOfOrders: 1247,
      avgOrderValue: 64.15,
      newCustomers: 156,
      returningCustomers: 736,
      topSellingCategory: 'Electronics',
      categoryBreakdown: [
        { category: 'Electronics', revenue: 28000, orders: 342, avgOrder: 81.87 },
        { category: 'Clothing', revenue: 20000, orders: 456, avgOrder: 43.86 },
        { category: 'Home & Garden', revenue: 16000, orders: 267, avgOrder: 59.93 },
        { category: 'Sports & Outdoors', revenue: 9600, orders: 182, avgOrder: 52.75 },
        { category: 'Books & Media', revenue: 6400, orders: 145, avgOrder: 44.14 },
      ],
      topProducts: [
        { modelNo: 'WH-PRO-2025', category: 'Electronics', units: 245, sales: 12250 },
        { modelNo: 'SW-S5-BLK', category: 'Electronics', units: 189, sales: 37800 },
        { modelNo: 'RS-ELITE-42', category: 'Sports & Outdoors', units: 167, sales: 15030 },
        { modelNo: 'YM-PREM-GRN', category: 'Sports & Outdoors', units: 143, sales: 4290 },
        { modelNo: 'CM-DLX-2000', category: 'Home & Garden', units: 128, sales: 8960 },
      ],
      topCustomers: [
        { customer: 'ABC Retail Corp', bulkCount: 24, bulkAmount: 15600, avgBulkAmount: 650, modelNo: 'SW-S5-BLK' },
        { customer: 'XYZ Electronics Ltd', bulkCount: 18, bulkAmount: 12800, avgBulkAmount: 711.11, modelNo: 'WH-PRO-2025' },
        { customer: 'Global Sports Inc', bulkCount: 15, bulkAmount: 9500, avgBulkAmount: 633.33, modelNo: 'RS-ELITE-42' },
        { customer: 'Home Essentials Co', bulkCount: 12, bulkAmount: 7200, avgBulkAmount: 600, modelNo: 'CM-DLX-2000' },
        { customer: 'Tech Distributors SA', bulkCount: 10, bulkAmount: 6400, avgBulkAmount: 640, modelNo: 'SW-S5-BLK' },
      ],
      paymentMethods: [
        { method: 'Credit Card', transactions: 687, amount: 44560 },
        { method: 'Debit Card', transactions: 312, amount: 18720 },
        { method: 'Digital Wallet', transactions: 198, amount: 12640 },
        { method: 'Cash on Delivery', transactions: 50, amount: 4080 },
      ],
    },
    'September': {
      totalRevenue: 69500,
      numberOfOrders: 1150,
      avgOrderValue: 60.43,
      newCustomers: 138,
      returningCustomers: 698,
      topSellingCategory: 'Electronics',
      categoryBreakdown: [
        { category: 'Electronics', revenue: 24300, orders: 310, avgOrder: 78.39 },
        { category: 'Clothing', revenue: 18200, orders: 420, avgOrder: 43.33 },
        { category: 'Home & Garden', revenue: 14800, orders: 245, avgOrder: 60.41 },
        { category: 'Sports & Outdoors', revenue: 8400, orders: 165, avgOrder: 50.91 },
        { category: 'Books & Media', revenue: 3800, orders: 110, avgOrder: 34.55 },
      ],
      topProducts: [
        { modelNo: 'WH-PRO-2024', category: 'Electronics', units: 220, sales: 11000 },
        { modelNo: 'SW-S5-BLK', category: 'Electronics', units: 165, sales: 33000 },
        { modelNo: 'RS-ELITE-42', category: 'Sports & Outdoors', units: 145, sales: 13050 },
        { modelNo: 'YM-PREM-GRN', category: 'Sports & Outdoors', units: 120, sales: 3600 },
        { modelNo: 'CM-DLX-2000', category: 'Home & Garden', units: 105, sales: 7350 },
      ],
      topCustomers: [
        { customer: 'ABC Retail Corp', bulkCount: 22, bulkAmount: 14200, avgBulkAmount: 645.45, modelNo: 'SW-S5-BLK' },
        { customer: 'XYZ Electronics Ltd', bulkCount: 16, bulkAmount: 11500, avgBulkAmount: 718.75, modelNo: 'WH-PRO-2024' },
        { customer: 'Global Sports Inc', bulkCount: 14, bulkAmount: 8800, avgBulkAmount: 628.57, modelNo: 'RS-ELITE-42' },
        { customer: 'Home Essentials Co', bulkCount: 11, bulkAmount: 6600, avgBulkAmount: 600, modelNo: 'CM-DLX-2000' },
        { customer: 'Tech Distributors SA', bulkCount: 9, bulkAmount: 5800, avgBulkAmount: 644.44, modelNo: 'SW-S5-BLK' },
      ],
      paymentMethods: [
        { method: 'Credit Card', transactions: 630, amount: 38850 },
        { method: 'Debit Card', transactions: 285, amount: 16270 },
        { method: 'Digital Wallet', transactions: 180, amount: 10980 },
        { method: 'Cash on Delivery', transactions: 55, amount: 3400 },
      ],
    },
  },
  '2024': {
    'October': {
      totalRevenue: 72000,
      numberOfOrders: 1180,
      avgOrderValue: 61.02,
      newCustomers: 145,
      returningCustomers: 710,
      topSellingCategory: 'Clothing',
      categoryBreakdown: [
        { category: 'Electronics', revenue: 25200, orders: 320, avgOrder: 78.75 },
        { category: 'Clothing', revenue: 19800, orders: 435, avgOrder: 45.52 },
        { category: 'Home & Garden', revenue: 15100, orders: 255, avgOrder: 59.22 },
        { category: 'Sports & Outdoors', revenue: 8200, orders: 160, avgOrder: 51.25 },
        { category: 'Books & Media', revenue: 3700, orders: 110, avgOrder: 33.64 },
      ],
      topProducts: [
        { modelNo: 'WH-PRO-2023', category: 'Electronics', units: 210, sales: 10500 },
        { modelNo: 'SW-S4-BLK', category: 'Electronics', units: 155, sales: 27900 },
        { modelNo: 'RS-ELITE-42', category: 'Sports & Outdoors', units: 140, sales: 12600 },
        { modelNo: 'YM-PREM-GRN', category: 'Sports & Outdoors', units: 115, sales: 3450 },
        { modelNo: 'CM-DLX-2000', category: 'Home & Garden', units: 100, sales: 7000 },
      ],
      topCustomers: [
        { customer: 'ABC Retail Corp', bulkCount: 20, bulkAmount: 13000, avgBulkAmount: 650, modelNo: 'SW-S4-BLK' },
        { customer: 'XYZ Electronics Ltd', bulkCount: 15, bulkAmount: 10800, avgBulkAmount: 720, modelNo: 'WH-PRO-2023' },
        { customer: 'Global Sports Inc', bulkCount: 13, bulkAmount: 8200, avgBulkAmount: 630.77, modelNo: 'RS-ELITE-42' },
        { customer: 'Home Essentials Co', bulkCount: 10, bulkAmount: 6000, avgBulkAmount: 600, modelNo: 'CM-DLX-2000' },
        { customer: 'Tech Distributors SA', bulkCount: 8, bulkAmount: 5300, avgBulkAmount: 662.50, modelNo: 'SW-S4-BLK' },
      ],
      paymentMethods: [
        { method: 'Credit Card', transactions: 650, amount: 40320 },
        { method: 'Debit Card', transactions: 295, amount: 17280 },
        { method: 'Digital Wallet', transactions: 170, amount: 10800 },
        { method: 'Cash on Delivery', transactions: 65, amount: 3600 },
      ],
    },
  },
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  const currentData = salesData[selectedYear]?.[selectedMonth];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setYearDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setMonthDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">No data available for {selectedMonth} {selectedYear}</p>
      </div>
    );
  }

  return (
    <>
    <RoleBasedLayout>
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header Actions */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-3">
            {/* Year Dropdown */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => {
                  setYearDropdownOpen(!yearDropdownOpen);
                  setMonthDropdownOpen(false);
                }}
                className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition-colors min-w-[120px]"
              >
                <span>{selectedYear}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {yearDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]">
                  {['2025', '2024', '2023'].map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        selectedYear === year ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Month Dropdown */}
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => {
                  setMonthDropdownOpen(!monthDropdownOpen);
                  setYearDropdownOpen(false);
                }}
                className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 transition-colors min-w-[140px]"
              >
                <span>{selectedMonth}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[140px] max-h-48 overflow-y-auto">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(month);
                        setMonthDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                        selectedMonth === month ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-300">
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download PDF</span>
            </button>
          </div>
        </div>

        {/* Report Title */}
        <div className="border-b-2 border-gray-500 pb-6 mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Sales Report</h1>
          <p className="text-xl text-gray-600">{selectedMonth} {selectedYear}</p>
          {/* <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p> */}
        </div>

        {/* Overall Performance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">₱{currentData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Number of Orders</p>
              <p className="text-3xl font-bold text-gray-900">{currentData.numberOfOrders.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Average Order Value</p>
              <p className="text-3xl font-bold text-gray-900">₱{currentData.avgOrderValue}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Bulk Orders</p>
              <p className="text-3xl font-bold text-gray-900">{currentData.newCustomers}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Bulk Amount</p>
              <p className="text-3xl font-bold text-gray-900">₱{currentData.returningCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Average Bulk Amount</p>
              <p className="text-3xl font-bold text-gray-900">₱{(currentData.returningCustomers / currentData.newCustomers).toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Top Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Product of the Month</h2>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Model No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Units Sold</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentData.topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.modelNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">{product.units}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      ₱{product.sales.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Customers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Customers of the Month</h2>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Bulk Count</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Bulk Amount</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Avg Bulk Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Model No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentData.topCustomers.map((customer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.customer}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">{customer.bulkCount}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      ₱{customer.bulkAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      ₱{customer.avgBulkAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{customer.modelNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Report Footer */}
        {/* <div className="border-t-2 border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500">
            This report is confidential and intended for internal use only.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Report ID: SR-{selectedYear}-{selectedMonth}-001 | Page 1 of 1
          </p>
        </div> */}
      </div>
    </div>
    </RoleBasedLayout>
    </>
  );
}