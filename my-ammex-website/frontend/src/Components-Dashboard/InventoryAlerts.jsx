import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, Bell, Search, Clock, AlertCircle, ChevronDown, Filter, TrendingUp, TrendingDown, ExternalLink, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getInventoryAlerts } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';

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
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

          {/* Alerts List */}
          <div className="divide-y divide-gray-200 max-h-[550px] overflow-y-auto pb-4 pr-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity || 'medium')}`}>
                        {getSeverityIcon(alert.severity || 'medium')}
                        {(alert.severity || 'medium').charAt(0).toUpperCase() + (alert.severity || 'medium').slice(1)}
                      </span>
                    </div>
                    
                    {/* Alert Message */}
                    {alert.message && (
                      <div className='py-3'>
                        <span className={`p-2 rounded-lg text-sm font-medium ${
                          alert.severity === 'critical' ? 'bg-red-50 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-50 text-orange-800' :
                          'bg-yellow-50 text-yellow-800'
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
                    
                    {activeTab === 'lowStock' ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Current Stock:</span>
                          <span className={`ml-2 font-semibold text-lg ${(alert.currentStock || 0) < (alert.minimumStockLevel || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                            {alert.currentStock || 0} {alert.unitName || 'units'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Minimum Level:</span>
                          <span className="ml-2 font-semibold text-lg text-gray-900">{alert.minimumStockLevel || 0} {alert.unitName || 'units'}</span>
                        </div>
                        {/* {alert.reorderAmount > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Suggested Reorder:</span>
                            <span className="ml-2 font-semibold text-lg text-blue-600">{alert.reorderAmount} {alert.unitName || 'units'}</span>
                          </div>
                        )} */}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Current Stock:</span>
                          <span className={`ml-2 font-semibold text-lg ${(alert.currentStock || 0) > (alert.maximumStockLevel || 0) ? 'text-orange-600' : 'text-gray-900'}`}>
                            {alert.currentStock || 0} {alert.unitName || 'units'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Maximum Level:</span>
                          <span className="ml-2 font-semibold text-lg text-gray-900">{alert.maximumStockLevel || 0} {alert.unitName || 'units'}</span>
                        </div>
                        {alert.excessAmount > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Excess Stock:</span>
                            <span className="ml-2 font-semibold text-lg text-orange-600">{alert.excessAmount} {alert.unitName || 'units'} over maximum</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* <div className="mt-3 flex items-center gap-4">
                      <span className={`text-sm font-medium ${
                        activeTab === 'lowStock' ? (
                          (alert.currentStock || 0) === 0 ? 'text-red-600' : 
                          (alert.currentStock || 0) <= (alert.minimumStockLevel || 0) * 0.3 ? 'text-red-500' :
                          (alert.currentStock || 0) <= (alert.minimumStockLevel || 0) * 0.5 ? 'text-orange-500' : 'text-yellow-600'
                        ) : (
                          (alert.currentStock || 0) >= (alert.maximumStockLevel || 0) * 1.5 ? 'text-red-600' :
                          (alert.currentStock || 0) >= (alert.maximumStockLevel || 0) * 1.25 ? 'text-orange-500' : 'text-yellow-600'
                        )
                      }`}>
                        {activeTab === 'lowStock' 
                          ? getStockStatus(alert.currentStock || 0, alert.minimumStockLevel || 0)
                          : getOverstockStatus(alert.currentStock || 0, alert.maximumStockLevel || 0)
                        }
                      </span>
                    </div> */}
                  </div>
                </div>
              </div>
            ))}
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