import React, { useState, useEffect } from 'react'
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import { Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Import new components
import SalesPerformance from '../../Components-Analytics/SalesPerformance';
import SmartReorder from '../../Components-Analytics/SmartReorder';
import StockMovement from '../../Components-Analytics/StockMovement';
import MetricsCard from '../../Components-Analytics/MetricsCard';
import CustomerPerformance from '../../Components-Analytics/CustomerPerformance';
import { getSalesData, getCartInsights } from '../../services/analyticsService';
import { getFormattedMetrics } from '../../data/analyticsData';
import CartInsights from '../../Components-Analytics/CartInsights';
import { getAnalyticsCardsForRole } from '../../utils/roleManager';

const Analytics = () => {
  const { user } = useAuth();
  const role = user?.role || 'Admin';
  const isAdmin = role === 'Admin';
  const isSalesMarketing = role === 'Sales Marketing';
  const isWarehouseSupervisor = role === 'Warehouse Supervisor';

  const [metrics, setMetrics] = useState({
    profit: { value: '₱0', previousMonth: '₱0', percentageChange: 0 },
    averageOrderValue: { value: '₱0', previousMonth: '₱0', percentageChange: 0 },
    orders: { value: '0 Orders', previousMonth: '0 Orders', percentageChange: 0 },
    fastMovingItems: { value: '0 Items', previousMonth: '0 Items', percentageChange: 0 },
    slowMovingItems: { value: '0 Items', previousMonth: '0 Items', percentageChange: 0 },
    inventoryGrowthRate: { value: '0%', previousMonth: '0%', percentageChange: 0 }
  });
  const [salesData, setSalesData] = useState(null);
  const [cartInsightsData, setCartInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine which analytics metric cards to show based on role
  const analyticsCards = getAnalyticsCardsForRole(role);

  // Render analytics metric cards based on title (similar to Dashboard)
  const renderAnalyticsCard = (title) => {
    switch (title) {
      case 'Monthly Profit':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.profit?.value || '₱0'}
            percentageChange={metrics.profit?.percentageChange || 0}
            previousMonth={metrics.profit?.previousMonth || '₱0'}
          />
        );
      case 'Average Order Value':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.averageOrderValue?.value || '₱0'}
            percentageChange={metrics.averageOrderValue?.percentageChange || 0}
            previousMonth={metrics.averageOrderValue?.previousMonth || '₱0'}
          />
        );
      case 'Monthly Orders':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.orders?.value || '0 Orders'}
            percentageChange={metrics.orders?.percentageChange || 0}
            previousMonth={metrics.orders?.previousMonth || '0 Orders'}
          />
        );
        case 'Monthly Fast Moving Items':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.fastMovingItems?.value || '0 Items'}
            percentageChange={metrics.fastMovingItems?.percentageChange || 0}
            previousMonth={metrics.fastMovingItems?.previousMonth || '0 Items'}
          />
        );
        case 'Monthly Slow Moving Items':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.slowMovingItems?.value || '0 Items'}
            percentageChange={metrics.slowMovingItems?.percentageChange || 0}
            previousMonth={metrics.slowMovingItems?.previousMonth || '0 Items'}
          />
        );
        case 'Inventory Growth Rate':
        return (
          <MetricsCard 
            key={title}
            title={title}
            value={metrics.inventoryGrowthRate?.value || '0%'}
            percentageChange={metrics.inventoryGrowthRate?.percentageChange || 0}
            previousMonth={metrics.inventoryGrowthRate?.previousMonth || '0%'}
          />
        );
        
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [formattedMetrics, salesData, cartInsightsData] = await Promise.all([
          Promise.resolve(getFormattedMetrics()),
          getSalesData(),
          getCartInsights()
        ]);
        setMetrics((prev) => ({ ...prev, ...formattedMetrics }));
        setSalesData(salesData);
        setCartInsightsData(cartInsightsData);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex flex-col items-center justify-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 text-lg">Loading Analytics Data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <RoleBasedLayout />
        <div className="w-full min-h-[calc(100vh)] flex items-center justify-center">
          <div className="text-red-600">Error loading analytics data: {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedLayout />
      
      <div className="max-w-7xl mx-auto min-h-[calc(100vh-140px)]">
        <div className="w-full mt-8 px-20 pb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

          {/* Card Container - role-based analytics metrics */}
          {/* {analyticsCards?.length > 0 && (
            <div className="grid grid-cols-4 gap-6 mb-10 lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
              {analyticsCards.map((title) => renderAnalyticsCard(title))}
            </div>
          )} */}

          {/* Role-aware content area */}
          {(isAdmin || isSalesMarketing || isWarehouseSupervisor) && (
            <>
              {/* Admin: single column layout */}
              {isAdmin && (
                <div className="flex flex-col gap-6">
                  <div className="w-full">
                    <SalesPerformance/>
                  </div>
                  <div className="w-full">
                    <CustomerPerformance />
                  </div>
                  <div className="w-full">
                    <CartInsights data={cartInsightsData} />
                  </div>
                </div>
              )}

              {/* Sales Marketing only: single column layout */}
              {(!isAdmin && isSalesMarketing) && (
                <div className="flex flex-col gap-6">
                  <div className="w-full">
                    <SalesPerformance />
                  </div>
                  <div className="w-full">
                    <CustomerPerformance />
                  </div>
                  <div className="w-full">
                    <CartInsights data={cartInsightsData} />
                  </div>
                </div>
              )}

              {/* Warehouse Supervisor only: single column layout */}
              {/* {(!isAdmin && isWarehouseSupervisor) && (
                <div className="flex flex-col gap-6">
                  <div className="w-full">
                    <StockMovement />
                  </div>
                  <div className="w-full">
                    <SmartReorder />
                  </div>
                </div>
              )} */}
            </>
          )}

          {/* Fallback: no analytics for this role */}
          {!isAdmin && !isSalesMarketing  && (
            <div className="flex min-h-[calc(90vh-200px)] justify-center items-center mt-6 text-gray-600">No analytics available for your role.</div>
          )}
        </div>
      </div>
    </>
  )
}

export default Analytics

{/* Height options:
                  h-[500px] - Fixed height of 500px
                  min-h-[300px] - Minimum height of 300px
                  max-h-[600px] - Maximum height of 600px
                  h-[calc(100vh-200px)] - Dynamic height based on viewport
                  h-full - Full height of parent
              */}