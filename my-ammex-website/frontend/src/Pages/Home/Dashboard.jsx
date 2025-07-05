import React, { useState, useEffect, useRef } from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import { AlertTriangle, Package, Bell, Search, Clock, AlertCircle, ChevronDown, Filter, Loader } from 'lucide-react';
// import { getInventoryAlerts } from '../../services/inventoryService';
import { getDashboardMetrics } from '../../services/dashboardService';
import MetricsCard from '../../Components-Dashboard/MetricsCard';
import QuickActions from '../../Components-Dashboard/QuickActions';
import ReorderModal from '../../Components/ReorderModal';
import { inventoryAlertsData } from '../../data/inventoryAlertsData';

const quickActions = [
  {
    label: 'New Quotes',
    color: 'border-blue-500 text-blue-600 hover:bg-blue-50',
    link: '/Sales/SalesQuotes',
    icon: <img src="/Resource/icons8-quote-100.png" alt="Add Customer" className="w-8 h-8 mr-2 inline" />,
  },
  {
    label: 'New Invoice',
    color: 'border-blue-500 text-blue-600 hover:bg-blue-50',
    link: '/Sales/SalesInvoice',
    icon: <img src="/Resource/icons8-invoice-100.png" alt="Add Customer" className="w-8 h-8 mr-2 inline" />,
  },
  {
    label: 'New Order',
    color: 'border-green-500 text-green-600 hover:bg-green-50',
    link: '/Sales/SalesOrder',
    icon: <img src="/Resource/icons8-sales-order-100.png" alt="Add Customer" className="w-8 h-8 mr-2 inline" />,
  },
  {
    label: 'Add Customer',
    color: 'border-cyan-500 text-cyan-600 hover:bg-cyan-50',
    link: '/BusinessPartners/Customers',
    icon: <img src="/Resource/user-round-plus-48.png" alt="Add Customer" className="w-8 h-8 mr-2 inline" />,
  },
];

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [severityDropdownOpen, setSeverityDropdownOpen] = useState(false);
  const severityDropdownRef = useRef(null);
  const [metrics, setMetrics] = useState({
    sales: { total: 0, averageOrderValue: 0 },
    orders: { total: 0, pending: 0 },
    inventory: { lowStock: 0, critical: 0 },
    customers: { active: 0, newSignups: 0 }
  });

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
        // const [alertsData, metricsData] = await Promise.all([
        //   getInventoryAlerts(),
        //   getDashboardMetrics()
        // ]);
        const metricsData = await getDashboardMetrics();
        setAlerts(inventoryAlertsData);
        setMetrics(metricsData);
      } catch (err) {
        setError(err.message);
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
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
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

  const handleReorder = (productId, quantity) => {
    // TODO: Implement reorder logic
    console.log(`Reordering ${quantity} units of product ${productId}`);
    setIsReorderModalOpen(false);
    setSelectedProduct(null);
  };

  const openReorderModal = (alert) => {
    setSelectedProduct({
      id: alert.id,
      productName: alert.productName,
      sku: alert.sku,
      currentStock: alert.currentStock,
      minimumStockLevel: alert.minimumStockLevel,
      reorderQuantity: alert.minimumStockLevel * 2,
      monthlySales: alert.monthlySales || Math.ceil(alert.minimumStockLevel * 0.8),
      setReorderQuantity: (quantity) => {
        setSelectedProduct(prev => ({ ...prev, reorderQuantity: quantity }));
      }
    });
    setIsReorderModalOpen(true);
  };

  if (loading) {
    return (
      <>
        <TopBar />
        <Navigation />
        <div className="w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 text-lg">Loading Dashboard Data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <Navigation />
        <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center">
          <div className="text-red-600">Error loading dashboard data: {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Navigation />
      <div className="w-full min-h-[calc(100vh-140px)]">
        <div className="w-full mt-8 px-20 pb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
          
          {/* Card Container */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <MetricsCard
              title="Today's Sales"
              value={metrics.sales.total}
              valuePrefix="₱"
              subtitle={`Average order value: ₱${metrics.sales.averageOrderValue.toLocaleString()}`}
            />

            <MetricsCard
              title="Today's Orders"
              value={metrics.orders.total}
              subtitle={`${metrics.orders.pending} orders pending`}
            />

            <MetricsCard
              title="Low Stock Items"
              value={metrics.inventory.lowStock}
              valueSuffix=" items"
              statusIndicator={{
                text: metrics.inventory.critical > 0 ? 'Critical' : 'Warning',
                color: metrics.inventory.critical > 0 ? 'red' : 'yellow'
              }}
              subtitle={`${metrics.inventory.critical} items out of stock`}
            />

            <MetricsCard
              title="Today's Customers"
              value={metrics.customers.active}
              subtitle={`${metrics.customers.newSignups} new signups`}
            />
          </div>

          <div className="flex gap-6">
            <QuickActions actions={quickActions} />

            {/* Inventory Alert Container */}
            <div className="flex-[1.5] bg-white rounded-xl shadow-sm border border-gray-300">
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
                        placeholder="Search products or SKUs..."
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
                      className="pl-10 gap-2 pr-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center w-full"
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
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                              {getSeverityIcon(alert.severity)}
                              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {alert.productName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">SKU: {alert.sku}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Current Stock:</span>
                              <span className={`ml-2 font-semibold text-xl ${alert.currentStock < alert.minimumStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                                {alert.currentStock} units
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Minimum Stock Level:</span>
                              <span className="ml-2 font-semibold text-xl text-gray-900">{alert.minimumStockLevel} units</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-4">
                            <span className={`text-sm font-medium ${
                              alert.currentStock === 0 ? 'text-red-600' : 
                              alert.currentStock <= alert.minimumStockLevel * 0.3 ? 'text-red-500' :
                              alert.currentStock <= alert.minimumStockLevel * 0.5 ? 'text-orange-500' : 'text-yellow-600'
                            }`}>
                              {getStockStatus(alert.currentStock, alert.minimumStockLevel)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            onClick={() => openReorderModal(alert)}
                          >
                            Reorder
                          </button>
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
          </div>
        </div>
      </div>

      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => {
          setIsReorderModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onReorder={handleReorder}
      />
    </>
  );
};

export default Dashboard;