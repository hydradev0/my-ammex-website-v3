import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Package, Bell, Search, Clock, AlertCircle, ChevronDown, Filter } from 'lucide-react';
import { getInventoryAlerts } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';

const InventoryAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
        const alertsData = await getInventoryAlerts();
        setAlerts(alertsData);
      } catch (err) {
        console.error('Error fetching inventory alerts:', err);
        setError(err.message);
        setAlerts([]);
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

  const filteredAlerts = alerts.filter(alert => {
    // Skip alerts with missing required properties
    if (!alert.modelNo || !alert.categoryName) {
      return false;
    }
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = alert.modelNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.modelNo && alert.modelNo.toLowerCase().includes(searchTerm.toLowerCase()));
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
                    
                    <h3 className="text-sm text-gray-500 mb-1">
                      Model: <span className="font-semibold text-gray-900">{alert.modelNo || 'Unknown Item'}</span>
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">Category: <span className="font-semibold text-gray-900">{alert.categoryName || 'N/A'}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Current Stock:</span>
                        <span className={`ml-2 font-semibold text-lg ${(alert.currentStock || 0) < (alert.minimumStockLevel || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                          {alert.currentStock || 0} units
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Minimum Stock Level:</span>
                        <span className="ml-2 font-semibold text-lg text-gray-900">{alert.minimumStockLevel || 0} units</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <span className={`text-sm font-medium ${
                        (alert.currentStock || 0) === 0 ? 'text-red-600' : 
                        (alert.currentStock || 0) <= (alert.minimumStockLevel || 0) * 0.3 ? 'text-red-500' :
                        (alert.currentStock || 0) <= (alert.minimumStockLevel || 0) * 0.5 ? 'text-orange-500' : 'text-yellow-600'
                      }`}>
                        {getStockStatus(alert.currentStock || 0, alert.minimumStockLevel || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAlerts.length === 0 && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryAlerts;