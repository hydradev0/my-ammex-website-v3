import React, { useState, useEffect } from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import { Loader } from 'lucide-react';
import { getDashboardMetrics } from '../../services/dashboardService';
import MetricsCard from '../../Components-Dashboard/MetricsCard';
import InventoryAlerts from '../../Components-Dashboard/InventoryAlerts';
import DailyComparison from '../../Components-Dashboard/DailyComparison';
import { getMetricsCardsForRole } from '../../utils/roleManager';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    sales: { total: 0, averageOrderValue: 0, growth: 0 },
    orders: { total: 0, pending: 0, growth: 0 },
    inventory: { lowStock: 0, critical: 0, totalStockValue: 0, outOfStock: 0, reorderPending: 0 },
    customers: { active: 0, newSignups: 0 },
    comparison: { yesterday: { sales: 0, orders: 0 } }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const metricsData = await getDashboardMetrics();
        setMetrics(metricsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Get metrics cards for current user role
  const userRole = user?.role || 'Admin';
  const metricsCards = getMetricsCardsForRole(userRole);

  // Helper function to format growth percentage
  const formatGrowth = (growth) => {
    if (growth === null || growth === undefined || growth === 0) return null;
    const isPositive = growth > 0;
    const color = isPositive ? 'green' : 'red';
    const sign = isPositive ? '+' : '';
    return {
      text: `${sign}${growth.toFixed(1)}%`,
      color
    };
  };

  // Render metrics card based on title
  const renderMetricsCard = (title) => {
    switch (title) {
      case "Today's Sales":
        return (
          <MetricsCard
            key={title}
            title={title}
            value={metrics.sales?.total || 0}
            valuePrefix="₱"
            subtitle={`Average order value: ₱${(metrics.sales?.averageOrderValue || 0).toLocaleString()}`}
            statusIndicator={formatGrowth(metrics.sales?.growth)}
          />
        );
      
      case "Today's Orders":
        return (
          <MetricsCard
            key={title}
            title={title}
            value={metrics.orders?.total || 0}
            subtitle={`${metrics.orders?.pending || 0} orders pending`}
            statusIndicator={formatGrowth(metrics.orders?.growth)}
          />
        );
      
      case "Low Stock Items":
        return (
          <MetricsCard
            key={title}
            title={title}
            value={metrics.inventory?.lowStock || 0}
            valueSuffix=" items"
            statusIndicator={{
              text: (metrics.inventory?.critical || 0) > 0 ? 'Critical' : 'Warning',
              color: (metrics.inventory?.critical || 0) > 0 ? 'red' : 'yellow'
            }}
          />
        );
      
      
      
      case "Total Stock Value":
        return (
          <MetricsCard
            key={title}
            title={title}
            value={metrics.inventory?.totalStockValue || 0}
            valuePrefix="₱"
            subtitle="Total value of all inventory in stock"
          />
        );
      
      case "Out of Stock Items":
        return (
          <MetricsCard
            key={title}
            title={title}
            value={metrics.inventory?.outOfStock || 0}
            valueSuffix=" items"
            statusIndicator={{
              text: 'Good',
              color: 'green'
            }}
          />
        );
      
      // case "Reorder Pending":
      //   return (
      //     <MetricsCard
      //       key={title}
      //       title={title}
      //       value={metrics.inventory.reorderPending}
      //       valueSuffix=" items"
      //       statusIndicator={{
      //         text: 'Good',
      //         color: 'green'
      //       }}
      //       subtitle="Items needing reorder"
      //     />
      //   );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex flex-col items-center justify-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 text-lg">Loading Dashboard Data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex items-center justify-center">
          <div className="text-red-600">Error loading dashboard data: {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedLayout />
      <div className="w-full min-h-[calc(100vh-140px)]">
        <div className="w-full mt-8 px-20 pb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
          
          {/* Card Container */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            {metricsCards.map((title) => renderMetricsCard(title))}
          </div>


          <div className="flex gap-6 items-start">
            {/* Daily Comparison Component - Only visible to Admin and Sales Marketing */}
            <div className="flex-1">
              <DailyComparison metrics={metrics} />
            </div>

            {/* Inventory Alert Container - Only show for Admin and Warehouse Supervisor roles */}
            <div className="flex-2">
              <InventoryAlerts />
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default Dashboard;