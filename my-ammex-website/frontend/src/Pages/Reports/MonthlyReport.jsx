import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, Loader2, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import { getMonthlyReport, getAvailableYears, getAvailableMonths } from '../../services/monthlyReportsService';
import * as XLSX from 'xlsx';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Helper function to get current month name
const getCurrentMonth = () => {
  const now = new Date();
  return months[now.getMonth()];
};

// Helper function to get current year
const getCurrentYear = () => {
  return new Date().getFullYear().toString();
};

export default function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);
  
  // Data states
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch available years on component mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await getAvailableYears();
        setAvailableYears(response.data || []);
      } catch (err) {
        console.error('Failed to fetch years:', err);
      }
    };
    fetchYears();
  }, []);

  // Fetch available months when year changes
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await getAvailableMonths(selectedYear);
        setAvailableMonths(response.data || []);
      } catch (err) {
        console.error('Failed to fetch months:', err);
      }
    };
    if (selectedYear) {
      fetchMonths();
    }
  }, [selectedYear]);

  // Fetch report data when year or month changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedYear || !selectedMonth) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getMonthlyReport(selectedYear, selectedMonth);
        setReportData(response.data);
        // Reset pagination when data changes
        setProductsPage(1);
        setCustomersPage(1);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [selectedYear, selectedMonth]);

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

  // Pagination helper functions
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Excel export function
  const exportToExcel = () => {
    if (!reportData) return;

    // Helper function to format currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
      }).format(value);
    };

    // Build all data in one sheet with proper spacing
    const allData = [];
    
    // Header
    allData.push(['MONTHLY REPORT']);
    allData.push(['']);
    allData.push([`Report Period: ${selectedMonth} ${selectedYear}`]);
    allData.push(['']);
    
    // Overall Performance Section
    allData.push(['OVERALL PERFORMANCE']);
    allData.push(['']);
    allData.push(['Metric', 'Value']);
    allData.push(['Total Revenue', `₱${reportData.totalRevenue?.toLocaleString() || '0'}`]);
    allData.push(['Number of Orders', reportData.numberOfOrders?.toLocaleString() || '0']);
    allData.push(['Average Order Value', `₱${reportData.avgOrderValue?.toLocaleString() || '0'}`]);
    allData.push(['Total Bulk Orders', reportData.totalBulkOrders?.toLocaleString() || '0']);
    allData.push(['Total Bulk Amount', `₱${reportData.totalBulkAmount?.toLocaleString() || '0'}`]);
    allData.push(['Average Bulk Amount', `₱${reportData.avgBulkAmount?.toLocaleString() || '0'}`]);
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Top Products Section
    allData.push(['TOP PRODUCTS OF THE MONTH']);
    allData.push(['']);
    allData.push(['Model No.', 'Category', 'No. of Orders', 'Sales']);
    
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      reportData.topProducts.forEach(product => {
        allData.push([
          product.modelNo || '',
          product.category || '',
          product.orderCount || 0,
          product.sales || 0
        ]);
      });
    }
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Top Customers Section
    allData.push(['TOP CUSTOMERS OF THE MONTH']);
    allData.push(['']);
    allData.push(['Customer', 'Bulk Count', 'Bulk Amount', 'Avg Bulk Amount', 'Model No.']);
    
    if (reportData.topCustomers && reportData.topCustomers.length > 0) {
      reportData.topCustomers.forEach(customer => {
        allData.push([
          customer.customer || '',
          customer.bulkCount || 0,
          customer.bulkAmount || 0,
          customer.avgBulkAmount || 0,
          customer.modelNo || ''
        ]);
      });
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 35 }, // First column (Labels and headers)
      { wch: 30 }, // Second column (Values, Category, etc.)
      { wch: 20 }, // Third column (Numbers)
      { wch: 20 }, // Fourth column (Sales, Avg Bulk Amount, etc.)
      { wch: 20 }  // Fifth column (Model No.)
    ];

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Monthly Report ${selectedMonth} ${selectedYear}`);
    
    const filename = `Monthly_Report_${selectedMonth}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (isLoading && !reportData) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 text-lg">Loading Report Data...</div>
        </div>
      </>
    );
  }

  if (error && !reportData) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex items-center justify-center">
          <div className="text-red-600">Error loading report data: {error}</div>
        </div>
      </>
    );
  }

  if (!reportData) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex items-center justify-center">
          <p className="text-gray-500">No data available for {selectedMonth} {selectedYear}</p>
        </div>
      </>
    );
  }

  return (
    <>
    <RoleBasedLayout>
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Report</h1>
              <p className="text-lg text-gray-600">{selectedMonth} {selectedYear}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Year Dropdown */}
              <div className="relative" ref={yearDropdownRef}>
                <button
                  onClick={() => {
                    setYearDropdownOpen(!yearDropdownOpen);
                    setMonthDropdownOpen(false);
                  }}
                  disabled={isLoading}
                  className="flex items-center cursor-pointer justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{selectedYear}</span>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {yearDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setYearDropdownOpen(false);
                        }}
                        className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
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
                  disabled={isLoading}
                  className="flex items-center cursor-pointer justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{selectedMonth}</span>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
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
                        className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                          selectedMonth === month ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={exportToExcel}
                disabled={isLoading || !reportData}
                className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isLoading ? 'Loading...' : 'Export Excel'}
                </span>
              </button>
            </div>
          </div>
        </div>


        {/* Overall Performance */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Number of Orders</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.numberOfOrders?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.avgOrderValue?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Bulk Orders</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalBulkOrders?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Bulk Amount</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.totalBulkAmount?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Average Bulk Amount</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.avgBulkAmount?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Products */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Products of the Month</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.topProducts && reportData.topProducts.length > 0 ? (
                    getPaginatedData(reportData.topProducts, productsPage).map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.modelNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{product.orderCount?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          ₱{product.sales?.toLocaleString() || '0'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No product data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Products Pagination */}
            {reportData.topProducts && reportData.topProducts.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((productsPage - 1) * itemsPerPage) + 1} to {Math.min(productsPage * itemsPerPage, reportData.topProducts.length)} of {reportData.topProducts.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setProductsPage(prev => Math.max(prev - 1, 1))}
                    disabled={productsPage === 1}
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {productsPage} of {getTotalPages(reportData.topProducts)}
                  </span>
                  <button
                    onClick={() => setProductsPage(prev => Math.min(prev + 1, getTotalPages(reportData.topProducts)))}
                    disabled={productsPage === getTotalPages(reportData.topProducts)}
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Top Customers */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Customers of the Month</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bulk Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bulk Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Bulk Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Model No.</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.topCustomers && reportData.topCustomers.length > 0 ? (
                    getPaginatedData(reportData.topCustomers, customersPage).map((customer, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{customer.bulkCount?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          ₱{customer.bulkAmount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ₱{customer.avgBulkAmount ? parseFloat(customer.avgBulkAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{customer.modelNo}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No customer data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Customers Pagination */}
            {reportData.topCustomers && reportData.topCustomers.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((customersPage - 1) * itemsPerPage) + 1} to {Math.min(customersPage * itemsPerPage, reportData.topCustomers.length)} of {reportData.topCustomers.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCustomersPage(prev => Math.max(prev - 1, 1))}
                    disabled={customersPage === 1}
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {customersPage} of {getTotalPages(reportData.topCustomers)}
                  </span>
                  <button
                    onClick={() => setCustomersPage(prev => Math.min(prev + 1, getTotalPages(reportData.topCustomers)))}
                    disabled={customersPage === getTotalPages(reportData.topCustomers)}
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
    </RoleBasedLayout>
    </>
  );
}