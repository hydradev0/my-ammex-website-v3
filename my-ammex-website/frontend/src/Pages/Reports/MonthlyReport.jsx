import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, Loader2, ChevronLeft, ChevronRight, X, BarChart3 } from 'lucide-react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import { getMonthlyReport, getAvailableYears, getAvailableMonths } from '../../services/monthlyReportsService';
import { createPortal } from 'react-dom';
import ScrollLock from '../../Components/ScrollLock';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import notoSansFontUrl from '../../assets/fonts/NotoSans-Regular.ttf?url';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let cachedNotoSansFont = null;

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return typeof window !== 'undefined' && window.btoa ? window.btoa(binary) : '';
};

const loadNotoSansFont = async () => {
  if (cachedNotoSansFont) return cachedNotoSansFont;
  try {
    const response = await fetch(notoSansFontUrl);
    const buffer = await response.arrayBuffer();
    cachedNotoSansFont = arrayBufferToBase64(buffer);
    return cachedNotoSansFont;
  } catch (error) {
    console.error('Failed to load Noto Sans font for PDF export:', error);
    throw error;
  }
};

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

  // Modal states
  const [modelNumbersModalOpen, setModelNumbersModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedModelNumbers, setSelectedModelNumbers] = useState([]);

  // View toggle states
  const [showProductsChart, setShowProductsChart] = useState(true);
  const [showCustomersChart, setShowCustomersChart] = useState(true);

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

  // Prepare chart data
  const prepareProductsChartData = () => {
    if (!reportData?.topProducts) return [];
    return reportData.topProducts.slice(0, 10).map(product => ({
      name: product.modelNo?.length > 15 ? product.modelNo.substring(0, 15) + '...' : product.modelNo || 'N/A',
      fullName: product.modelNo || 'N/A',
      sales: product.sales || 0,
      orders: product.orderCount || 0,
      category: product.category || 'N/A'
    }));
  };

  const prepareCustomersChartData = () => {
    if (!reportData?.topCustomers) return [];
    return reportData.topCustomers.slice(0, 10).map(customer => ({
      name: customer.customer?.length > 20 ? customer.customer.substring(0, 20) + '...' : customer.customer || 'N/A',
      fullName: customer.customer || 'N/A',
      bulkAmount: customer.bulkAmount || 0,
      bulkCount: customer.bulkCount || 0,
      avgBulkAmount: customer.avgBulkAmount || 0
    }));
  };

  const preparePerformanceChartData = () => {
    if (!reportData) return [];
    return [
      { name: 'Total Sales', value: reportData.totalRevenue || 0, color: '#3b82f6' }, // Blue
      { name: 'Total Bulk Amount', value: reportData.totalBulkAmount || 0, color: '#10b981' }, // Emerald
      { name: 'Avg Order Value', value: reportData.avgOrderValue || 0, color: '#F59E0B' }, // yellow
      { name: 'Avg Bulk Amount', value: reportData.avgBulkAmount || 0, color: '#f97316' } // Orange
    ];
  };

  // Prepare pie chart data for sales by category
  const prepareCategoryPieData = () => {
    if (!reportData?.topProducts) return [];
    
    // Group products by category and sum their sales
    const categoryMap = {};
    reportData.topProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, value: 0 };
      }
      categoryMap[category].value += product.sales || 0;
    });
    
    const data = Object.values(categoryMap).sort((a, b) => b.value - a.value);
    
    // Color palette for pie chart
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    
    return data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if slice is > 5%
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip for currency formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Amount') || entry.name.includes('Sales') || entry.name.includes('Revenue') || entry.name.includes('Value') 
                ? `₱${(entry.value || 0).toLocaleString()}` 
                : entry.value?.toLocaleString() || '0'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for products bar chart with category
  const ProductsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the category from the payload data
      const dataPoint = payload[0]?.payload;
      const category = dataPoint?.category || 'N/A';
      const fullName = dataPoint?.fullName || label;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{fullName}</p>
          <p className="text-xs text-gray-500 mb-2">Category: {category}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Amount') || entry.name.includes('Sales') || entry.name.includes('Revenue') || entry.name.includes('Value') 
                ? `₱${(entry.value || 0).toLocaleString()}` 
                : entry.value?.toLocaleString() || '0'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Excel export function
  const exportToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    try {
      const fontData = await loadNotoSansFont();
      if (fontData) {
        doc.addFileToVFS('NotoSans-Regular.ttf', fontData);
        doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
        doc.setFont('NotoSans', 'normal');
      }
    } catch (fontError) {
      console.warn('Falling back to default font for PDF export:', fontError);
    }

    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const currencyFormatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
    let cursorY = 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Report Summary', marginX, cursorY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedMonth} ${selectedYear}`, marginX, cursorY + 18);
    cursorY += 30;

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 25;

    const metrics = [
      ['Total Revenue', formatCurrency(reportData.totalRevenue)],
      ['Number of Orders', reportData.numberOfOrders?.toLocaleString() || '0'],
      ['Average Order Value', formatCurrency(reportData.avgOrderValue)],
      ['Total Bulk Amount', formatCurrency(reportData.totalBulkAmount)],
      ['Total Bulk Orders', reportData.totalBulkOrders?.toLocaleString() || '0'],
      ['Average Bulk Amount', formatCurrency(reportData.avgBulkAmount)]
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Overall Performance', marginX, cursorY);
    cursorY += 12;

    autoTable(doc, {
      startY: cursorY,
      head: [['Metric', 'Value']],
      body: metrics,
      styles: { font: 'NotoSans', fontSize: 10, halign: 'left' },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: {
        1: { halign: 'left' }
      },
      margin: { left: marginX, right: marginX }
    });

    cursorY = doc.lastAutoTable?.finalY + 30 || cursorY + 30;

    const addSection = (title, tableHead, tableBody, emptyMessage) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, marginX, cursorY);
      cursorY += 12;

      if (tableBody.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(emptyMessage, marginX, cursorY);
        cursorY += 20;
        return;
      }

      autoTable(doc, {
        startY: cursorY,
        head: [tableHead],
        body: tableBody,
        styles: { font: 'NotoSans', fontSize: 9, halign: 'left' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        margin: { left: marginX, right: marginX }
      });

      cursorY = doc.lastAutoTable?.finalY + 30 || cursorY + 30;
    };

    addSection(
      'Top Products of the Month',
      ['Model No.', 'Category', 'No. of Orders', 'Sales'],
      (reportData.topProducts || []).map(product => ([
        product.modelNo || 'N/A',
        product.category || 'N/A',
        product.orderCount?.toLocaleString() || '0',
        formatCurrency(product.sales)
      ])),
      'No product data available for this period.'
    );

    addSection(
      'Top Customers of the Month',
      ['Customer', 'Bulk Count', 'Bulk Amount', 'Avg Bulk Amount', 'Model No.'],
      (reportData.topCustomers || []).map(customer => {
        const modelNumbers = customer.modelNo && customer.modelNo !== 'N/A'
          ? customer.modelNo.split(', ').join(', ')
          : 'N/A';
        return [
          customer.customer || 'N/A',
          customer.bulkCount?.toLocaleString() || '0',
          formatCurrency(customer.bulkAmount),
          formatCurrency(customer.avgBulkAmount),
          modelNumbers
        ];
      }),
      'No customer data available for this period.'
    );

    doc.save(`Report_Summary_${selectedMonth}_${selectedYear}.pdf`);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Summary</h1>
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
                onClick={exportToPDF}
                disabled={isLoading || !reportData}
                className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-slate-600 text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isLoading ? 'Loading...' : 'Export PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>


        {/* Overall Performance */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Revenue Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
              
              {/* Order Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-pink-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Number of Orders</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.numberOfOrders?.toLocaleString() || '0'}</p>
              </div>
              
              {/* Average Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.avgOrderValue?.toLocaleString() || '0'}</p>
              </div>
              
              {/* Bulk Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Total Bulk Amount</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.totalBulkAmount?.toLocaleString() || '0'}</p>
              </div>
              
              {/* Order Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Total Bulk Orders</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalBulkOrders?.toLocaleString() || '0'}</p>
              </div>
              
              {/* Average Metrics */}
              <div className="bg-white p-5 rounded-lg border-l-5 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Average Bulk Amount</p>
                <p className="text-2xl font-bold text-gray-900">₱{reportData.avgBulkAmount?.toLocaleString() || '0'}</p>
              </div>
            </div>
            
            {/* Performance Chart */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Revenue Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={preparePerformanceChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    stroke="#64748b"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="#64748b"
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `₱${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `₱${(value / 1000).toFixed(0)}K`;
                      } else {
                        return `₱${value}`;
                      }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {preparePerformanceChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Top Products */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Top Products of the Month</h2>
              <button
                onClick={() => setShowProductsChart(!showProductsChart)}
                className="flex items-center cursor-pointer gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                {showProductsChart ? 'Show Table' : 'Show Chart'}
              </button>
            </div>
            
            {/* Products Chart */}
            {showProductsChart && prepareProductsChartData().length > 0 && (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Top Products by Sales</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={prepareProductsChartData()} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }} 
                        stroke="#64748b"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        stroke="#64748b"
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `₱${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `₱${(value / 1000).toFixed(0)}K`;
                          } else {
                            return `₱${value}`;
                          }
                        }}
                      />
                      <Tooltip content={<ProductsTooltip />} />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Sales (₱)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="orders" fill="#10b981" name="No. of Orders" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Sales by Category Pie Chart */}
                {prepareCategoryPieData().length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Sales Distribution by Category</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={prepareCategoryPieData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareCategoryPieData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `₱${value.toLocaleString()}`}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {prepareCategoryPieData().map((entry, index) => {
                          const total = prepareCategoryPieData().reduce((sum, item) => sum + item.value, 0);
                          const percentage = ((entry.value / total) * 100).toFixed(1);
                          return (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  ₱{entry.value.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {!showProductsChart && (
              <>
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
              </>
            )}
          </div>
        </section>

        {/* Top Customers */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Top Customers of the Month</h2>
              <button
                onClick={() => setShowCustomersChart(!showCustomersChart)}
                className="flex items-center cursor-pointer gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                {showCustomersChart ? 'Show Table' : 'Show Chart'}
              </button>
            </div>
            
            {/* Customers Chart */}
            {showCustomersChart && prepareCustomersChartData().length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={prepareCustomersChartData()} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }} 
                      stroke="#64748b"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="#64748b"
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `₱${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `₱${(value / 1000).toFixed(0)}K`;
                        } else {
                          return `₱${value}`;
                        }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="bulkAmount" fill="#8b5cf6" name="Bulk Amount (₱)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="bulkCount" fill="#f59e0b" name="Bulk Count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {!showCustomersChart && (
              <>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right pr-8">
                              {(() => {
                                const modelNumbers = customer.modelNo && customer.modelNo !== 'N/A' ? customer.modelNo.split(', ') : [];
                                if (modelNumbers.length <= 2) {
                                  return customer.modelNo;
                                } else {
                                  return (
                                    <button
                                      onClick={() => {
                                        setSelectedCustomer(customer.customer);
                                        setSelectedModelNumbers(modelNumbers);
                                        setModelNumbersModalOpen(true);
                                      }}
                                      className="text-blue-600 cursor-pointer hover:text-blue-800 underline text-sm font-semibold"
                                      title={`Click to view all ${modelNumbers.length} model numbers`}
                                    >
                                      View ({modelNumbers.length})
                                    </button>
                                  );
                                }
                              })()}
                            </td>
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
              </>
            )}
          </div>
        </section>
      </div>
    </div>
    </RoleBasedLayout>

    {/* Model Numbers Modal */}
    <ScrollLock active={modelNumbersModalOpen} />
    {modelNumbersModalOpen && createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 max-h-[70vh] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Model Numbers</h3>
            <button
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => {
                setModelNumbersModalOpen(false);
                setSelectedCustomer(null);
                setSelectedModelNumbers([]);
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 flex-1 overflow-hidden">
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="text-sm font-medium text-gray-900">{selectedCustomer}</p>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Models ({selectedModelNumbers.length})</span>
              </div>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                <div className="divide-y divide-gray-100">
                  {selectedModelNumbers.map((model, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 text-sm font-mono text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
            <button
              className="px-3 py-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              onClick={() => {
                setModelNumbersModalOpen(false);
                setSelectedCustomer(null);
                setSelectedModelNumbers([]);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}