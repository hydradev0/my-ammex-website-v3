import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, Bell, Search, Clock, AlertCircle, ChevronDown, Filter, TrendingUp, TrendingDown, ExternalLink, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getInventoryAlerts } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip
} from 'recharts';

const InventoryAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [overstockAlerts, setOverstockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('lowStock'); // 'lowStock' or 'overstock'
  const [severityDropdownOpen, setSeverityDropdownOpen] = useState(false);
  const severityDropdownRef = useRef(null);

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getInventoryAlerts();
        // Handle new response structure with separate arrays
        if (response && response.lowStock && response.overstock) {
          setLowStockAlerts(response.lowStock);
          setOverstockAlerts(response.overstock);
        } else {
          setLowStockAlerts([]);
          setOverstockAlerts([]);
        }
      } catch (err) {
        console.error('Error fetching inventory alerts:', err);
        setError(err.message);
        setLowStockAlerts([]);
        setOverstockAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close severity dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (severityDropdownRef.current && !severityDropdownRef.current.contains(event.target)) {
        setSeverityDropdownOpen(false);
      }
    };

    if (severityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [severityDropdownOpen]);

  const getStockStatus = (current, minimumStockLevel) => {
    if (current === 0) return 'Out of Stock';
    if (current <= minimumStockLevel * 0.3) return 'Critical Low';
    if (current <= minimumStockLevel * 0.5) return 'Very Low';
    if (current <= minimumStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getOverstockStatus = (current, maximumStockLevel) => {
    if (current >= maximumStockLevel * 1.5) return 'Critical Overstock';
    if (current >= maximumStockLevel * 1.25) return 'High Overstock';
    if (current >= maximumStockLevel) return 'Overstock';
    return 'Normal';
  };

  // Filter alerts based on active tab
  const currentAlerts = activeTab === 'lowStock' ? lowStockAlerts : overstockAlerts;
  
  const filteredAlerts = currentAlerts.filter(alert => {
    // Skip alerts with missing required properties
    if (!alert.modelNo || !alert.categoryName) {
      return false;
    }
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = alert.modelNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.vendor && alert.vendor.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100/80 border-red-300';
      case 'high': return 'text-amber-700 bg-amber-100/80 border-amber-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100/80 border-yellow-300';
      default: return 'text-gray-700 bg-gray-100/80 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // Get severity-based card styling with refined colors
  const getSeverityCardStyle = (severity) => {
    switch (severity) {
      case 'critical': 
        return {
          border: 'border-red-400/60 border-l-4',
          background: 'bg-gradient-to-r from-red-50/50 to-white',
          hover: 'hover:from-red-50/70 hover:to-red-50/30',
          shadow: 'shadow-sm shadow-red-100/50'
        };
      case 'high': 
        return {
          border: 'border-amber-400/60 border-l-4',
          background: 'bg-gradient-to-r from-amber-50/50 to-white',
          hover: 'hover:from-amber-50/70 hover:to-amber-50/30',
          shadow: 'shadow-sm shadow-amber-100/50'
        };
      case 'medium': 
        return {
          border: 'border-yellow-400/60 border-l-4',
          background: 'bg-gradient-to-r from-yellow-50/50 to-white',
          hover: 'hover:from-yellow-50/70 hover:to-yellow-50/30',
          shadow: 'shadow-sm shadow-yellow-100/50'
        };
      default: 
        return {
          border: 'border-gray-300 border-l-4',
          background: 'bg-white',
          hover: 'hover:bg-gray-50/50',
          shadow: 'shadow-sm'
        };
    }
  };

  // Calculate alert counts by severity
  const getAlertCountsBySeverity = () => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0
    };
    
    currentAlerts.forEach(alert => {
      const severity = alert.severity || 'medium';
      if (counts[severity] !== undefined) {
        counts[severity]++;
      }
    });
    
    return counts;
  };

  // Calculate progress percentage for low stock (current vs minimum)
  const getLowStockProgress = (current, minimum) => {
    if (!minimum || minimum === 0) return 0;
    const percentage = (current / minimum) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Calculate progress percentage for overstock (current vs maximum)
  const getOverstockProgress = (current, maximum) => {
    if (!maximum || maximum === 0) return 100;
    const percentage = (current / maximum) * 100;
    return Math.min(percentage, 200); // Allow up to 200% to show excess
  };

  // Get progress bar color with refined gradient colors
  const getProgressBarColor = (alert, activeTab) => {
    if (activeTab === 'lowStock') {
      const current = alert.currentStock || 0;
      const minimum = alert.minimumStockLevel || 0;
      if (current === 0) return 'bg-gradient-to-r from-red-600 to-red-500';
      if (current <= minimum * 0.3) return 'bg-gradient-to-r from-red-500 to-red-400';
      if (current <= minimum * 0.5) return 'bg-gradient-to-r from-amber-500 to-amber-400';
      if (current <= minimum) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
      return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    } else {
      const current = alert.currentStock || 0;
      const maximum = alert.maximumStockLevel || 0;
      if (current >= maximum * 1.5) return 'bg-gradient-to-r from-red-600 to-red-500';
      if (current >= maximum * 1.25) return 'bg-gradient-to-r from-orange-500 to-orange-400';
      if (current >= maximum) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
      return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    }
  };

  // Prepare data for mini bar chart
  const getMiniChartData = (alert, activeTab) => {
    if (activeTab === 'lowStock') {
      const current = alert.currentStock || 0;
      const minimum = alert.minimumStockLevel || 0;
      const target = minimum || 1;
      
      return [
        { name: 'Current', value: current, label: 'Current' },
        { name: 'Minimum', value: target, label: 'Minimum' }
      ];
    } else {
      const current = alert.currentStock || 0;
      const maximum = alert.maximumStockLevel || 0;
      const target = maximum || 1;
      
      return [
        { name: 'Current', value: current, label: 'Current' },
        { name: 'Maximum', value: target, label: 'Maximum' }
      ];
    }
  };

  // Excel export function
  const exportToExcel = () => {
    if (filteredAlerts.length === 0) {
      return; // Don't export if there are no alerts
    }

    const allData = [];
    
    // Header
    allData.push(['INVENTORY ALERTS REPORT']);
    allData.push(['']);
    allData.push([`Alert Type: ${activeTab === 'lowStock' ? 'Low Stock Alerts' : 'Overstock Alerts'}`]);
    allData.push([`Filter: ${filterSeverity === 'all' ? 'All Severities' : filterSeverity.charAt(0).toUpperCase() + filterSeverity.slice(1)}`]);
    if (searchTerm) {
      allData.push([`Search Term: ${searchTerm}`]);
    }
    allData.push([`Generated Date: ${new Date().toLocaleString()}`]);
    allData.push(['']);
    
    // Column headers
    const headers = [
      'Severity',
      'Model No.',
      'Item Name',
      'Category',
      'Vendor',
      activeTab === 'lowStock' ? 'Current Stock' : 'Current Stock',
      activeTab === 'lowStock' ? 'Minimum Level' : 'Maximum Level',
      activeTab === 'lowStock' ? '' : 'Excess Amount',
      'Unit',
      'Message'
    ].filter(header => header !== ''); // Remove empty headers
    
    allData.push(headers);
    
    // Data rows
    filteredAlerts.forEach(alert => {
      const row = [
        (alert.severity || 'medium').charAt(0).toUpperCase() + (alert.severity || 'medium').slice(1),
        alert.modelNo || '',
        alert.itemName || '',
        alert.categoryName || '',
        alert.vendor || '',
        alert.currentStock || 0,
        activeTab === 'lowStock' ? (alert.minimumStockLevel || 0) : (alert.maximumStockLevel || 0),
        ...(activeTab === 'overstock' ? [alert.excessAmount > 0 ? alert.excessAmount : 0] : []),
        alert.unitName || 'units',
        alert.message || ''
      ];
      allData.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 12 }, // Severity
      { wch: 20 }, // Model No.
      { wch: 30 }, // Item Name
      { wch: 20 }, // Category
      { wch: 20 }, // Vendor
      { wch: 15 }, // Current Stock
      { wch: 15 }, // Min/Max Level
      ...(activeTab === 'overstock' ? [{ wch: 15 }] : []), // Excess Amount
      { wch: 10 }, // Unit
      { wch: 40 }  // Message
    ];
    ws['!cols'] = colWidths;

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    const sheetName = activeTab === 'lowStock' ? 'Low Stock Alerts' : 'Overstock Alerts';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Inventory_Alerts_${activeTab === 'lowStock' ? 'LowStock' : 'Overstock'}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Check if user has access to inventory alerts
  const userRole = user?.role || 'Admin';
  const hasAccess = ['Admin', 'Warehouse Supervisor'].includes(userRole);

  if (!hasAccess) {
    return null; // Don't render anything if user doesn't have access
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300">
        <div className='border-b border-gray-300'>
          <h2 className="text-2xl font-semibold px-6 py-3">Inventory Alerts</h2>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-600">Loading alerts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300">
        <div className='border-b border-gray-300'>
          <h2 className="text-2xl font-semibold px-6 py-3">Inventory Alerts</h2>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="text-red-600">Error loading alerts: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-300">
        <div className='border-b border-gray-300'>
          <h2 className="text-2xl font-semibold px-6 py-3">Inventory Alerts</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            className={`flex items-center cursor-pointer gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'lowStock'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('lowStock')}
          >
            <TrendingDown className="w-5 h-5" />
            Low Stock Alerts
            {lowStockAlerts.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                activeTab === 'lowStock' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {lowStockAlerts.length}
              </span>
            )}
          </button>
          <button
            className={`flex items-center cursor-pointer gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'overstock'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('overstock')}
          >
            <TrendingUp className="w-5 h-5" />
            Overstock Alerts
            {overstockAlerts.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                activeTab === 'overstock' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {overstockAlerts.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items by model or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
            <div className="relative" ref={severityDropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="w-5 h-5 text-gray-600" />
              </div>
              <button
                type="button"
                className="pl-10 cursor-pointer gap-2 pr-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center w-full"
                onClick={() => setSeverityDropdownOpen((open) => !open)}
              >
                <span>{filterSeverity === 'all' ? 'All Severities' : filterSeverity.charAt(0).toUpperCase() + filterSeverity.slice(1)}</span>
                <ChevronDown className={`w-6 h-6 transition-transform ${severityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {severityDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg">
                  {severityOptions.map(option => (
                    <li
                      key={option.value}
                      className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${filterSeverity === option.value ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' : ''}`}
                      onClick={() => {
                        setFilterSeverity(option.value);
                        setSeverityDropdownOpen(false);
                      }}  
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={exportToExcel}
              disabled={filteredAlerts.length === 0}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
              title="Export filtered alerts to Excel"
            >
              <Download className="w-5 h-5" />
              <span>Export Excel</span>
            </button>
          </div>

          {/* Alert Summary Badges */}
          {currentAlerts.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Alert Summary</h3>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const counts = getAlertCountsBySeverity();
                  return Object.entries(counts).map(([severity, count]) => {
                    if (count === 0) return null;
                    const severityColors = {
                      critical: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-300 shadow-sm',
                      high: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-300 shadow-sm',
                      medium: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-300 shadow-sm'
                    };
                    return (
                      <span
                        key={severity}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${severityColors[severity] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                      >
                        {count} {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </span>
                    );
                  });
                })()}
                <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-300 shadow-sm">
                  {currentAlerts.length} Total
                </span>
              </div>
            </div>
          )}

          {/* Alerts List - Card Layout */}
          <div className="grid grid-cols-1 gap-4 max-h-[550px] overflow-y-auto pb-4 pr-4">
            {filteredAlerts.map((alert) => {
              const cardStyle = getSeverityCardStyle(alert.severity || 'medium');
              const progress = activeTab === 'lowStock' 
                ? getLowStockProgress(alert.currentStock || 0, alert.minimumStockLevel || 0)
                : getOverstockProgress(alert.currentStock || 0, alert.maximumStockLevel || 0);
              const chartData = getMiniChartData(alert, activeTab);
              const maxChartValue = Math.max(...chartData.map(d => d.value), 1);
              
              return (
                <div 
                  key={alert.id} 
                  className={`rounded-lg p-5 ${cardStyle.border} ${cardStyle.background} ${cardStyle.hover} ${cardStyle.shadow} transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity || 'medium')}`}>
                        {getSeverityIcon(alert.severity || 'medium')}
                        {(alert.severity || 'medium').charAt(0).toUpperCase() + (alert.severity || 'medium').slice(1)}
                      </span>
                    </div>
                    
                    {/* Alert Message */}
                    {alert.message && (
                      <div className='py-3'>
                        <span className={`p-3 rounded-lg text-sm font-medium border ${
                          alert.severity === 'critical' ? 'bg-red-50/80 text-red-900 border-red-200' :
                          alert.severity === 'high' ? 'bg-amber-50/80 text-amber-900 border-amber-200' :
                          'bg-yellow-50/80 text-yellow-900 border-yellow-200'
                        }`}>
                          {alert.message}
                        </span>
                      </div>
                    )}

                    {/* Details split: left (model, item name) | right (category, vendor) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 ">
                      <div>
                        <div className="flex items-center gap-2 mb-1 ">
                          <h3 className="text-sm text-gray-500">
                            Model: <span className="font-semibold text-gray-900">{alert.modelNo || ''}</span>
                          </h3>
                          {alert.modelNo && (
                            <button
                              type="button"
                              className="text-xs cursor-pointer px-1 py-1 border-transparent rounded hover:text-black text-gray-700 flex items-center gap-1"
                              onClick={() => {
                                if (alert.modelNo) {
                                  navigate(`/inventory/Items?search=${encodeURIComponent(alert.modelNo)}`);
                                }
                              }}
                              title="View item in inventory"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Item</span>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Item Name: <span className="font-semibold text-gray-900">{alert.itemName}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                          <h3 className="text-sm text-gray-500">
                            Category: <span className="font-semibold text-gray-900">{alert.categoryName || ''}</span>
                          </h3>
                        {alert.vendor && (
                          <p className="text-sm text-gray-500">
                            Vendor: <span className="font-semibold text-gray-900">{alert.vendor}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                      {/* Stock Level Visualization */}
                      <div className="mt-4 space-y-3">
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>
                              {activeTab === 'lowStock' ? 'Stock Level vs Minimum' : 'Stock Level vs Maximum'}
                            </span>
                            <span className="font-semibold">
                              {activeTab === 'lowStock' 
                                ? `${Math.round(progress)}% of minimum`
                                : `${Math.round(progress)}% of maximum`
                              }
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(alert, activeTab)} transition-all duration-500 rounded-full`}
                              style={{
                                width: `${Math.min(progress, 100)}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Mini Horizontal Bar Chart with Hover Tooltip */}
                        <div className="mt-4">
                          <div className="text-xs text-gray-600 mb-2 font-medium">Visual Comparison (Hover for details)</div>
                          <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={chartData} 
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                              >
                                <XAxis 
                                  type="number"
                                  domain={[0, maxChartValue]}
                                  hide
                                />
                                <YAxis 
                                  type="category"
                                  dataKey="name"
                                  tick={{ fontSize: 10, fill: '#64748b' }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={60}
                                />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const current = alert.currentStock || 0;
                                      const minimum = alert.minimumStockLevel || 0;
                                      const maximum = alert.maximumStockLevel || 0;
                                      const unitName = alert.unitName || 'units';
                                      
                                      return (
                                        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm text-gray-600">Current Stock:</span>
                                              <span className={`text-sm font-semibold ${
                                                activeTab === 'lowStock' 
                                                  ? ((current || 0) < (minimum || 0) ? 'text-red-600' : 'text-gray-900')
                                                  : ((current || 0) > (maximum || 0) ? 'text-orange-600' : 'text-gray-900')
                                              }`}>
                                                {current} {unitName}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm text-gray-600">
                                                {activeTab === 'lowStock' ? 'Minimum Level:' : 'Maximum Level:'}
                                              </span>
                                              <span className="text-sm font-semibold text-gray-900">
                                                {activeTab === 'lowStock' ? minimum : maximum} {unitName}
                                              </span>
                                            </div>
                                            {activeTab === 'lowStock' && (current || 0) < (minimum || 0) && (
                                              <div className="pt-2 border-t border-gray-200">
                                                <span className="text-sm font-semibold text-red-600">
                                                  Short by: {(minimum || 0) - (current || 0)} {unitName}
                                                </span>
                                              </div>
                                            )}
                                            {activeTab === 'overstock' && alert.excessAmount > 0 && (
                                              <div className="pt-2 border-t border-gray-200">
                                                <span className="text-sm font-semibold text-orange-600">
                                                  Excess: {alert.excessAmount} {unitName} over maximum
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {chartData.map((entry, index) => {
                                    // Refined color palette for charts
                                    const getChartColor = () => {
                                      if (activeTab === 'lowStock') {
                                        if (index === 0) {
                                          const current = alert.currentStock || 0;
                                          const minimum = alert.minimumStockLevel || 0;
                                          if (current === 0) return '#dc2626'; // red-600
                                          if (current <= minimum * 0.3) return '#ea580c'; // orange-600
                                          if (current <= minimum * 0.5) return '#f59e0b'; // amber-500
                                          if (current <= minimum) return '#eab308'; // yellow-500
                                          return '#10b981'; // emerald-500
                                        }
                                        return '#94A3B8'; // slate-400 (softer gray for threshold)
                                      } else {
                                        if (index === 0) {
                                          const current = alert.currentStock || 0;
                                          const maximum = alert.maximumStockLevel || 0;
                                          if (current >= maximum * 1.5) return '#dc2626'; // red-600
                                          if (current >= maximum * 1.25) return '#ea580c'; // orange-600
                                          if (current >= maximum) return '#f59e0b'; // amber-500
                                          return '#10b981'; // emerald-500
                                        }
                                        return '#94A3B8'; // slate-400
                                      }
                                    };
                                    return (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={getChartColor()}
                                      />
                                    );
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredAlerts.length === 0 && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'lowStock' ? 'No low stock alerts' : 'No overstock alerts'}
              </h3>
              <p className="text-gray-600">
                {currentAlerts.length === 0 
                  ? `All items are ${activeTab === 'lowStock' ? 'above minimum levels' : 'below maximum levels'}.`
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryAlerts;