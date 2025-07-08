import React, { useState, useEffect } from 'react'
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import { Loader } from 'lucide-react';

// Import new components
import SalesPerformance from '../../Components-Analytics/SalesPerformance';
import SmartReorder from '../../Components-Analytics/SmartReorder';
import StockMovement from '../../Components-Analytics/StockMovement';
import MetricsCard from '../../Components-Analytics/MetricsCard';
import TopProducts from '../../Components-Analytics/TopProducts';
import { getSalesData, getCartInsights } from '../../services/analyticsService';
import { getFormattedMetrics } from '../../data/analyticsData';
import CartInsights from '../../Components-Analytics/CartInsights';

const Analytics = () => {
  const [metrics, setMetrics] = useState({
    profit: { value: '₱0', previousMonth: '₱0', percentageChange: 0 },
    averageOrderValue: { value: '₱0', previousMonth: '₱0', percentageChange: 0 },
    orders: { value: '0 Orders', previousMonth: '0 Orders', percentageChange: 0 }
  });
  const [salesData, setSalesData] = useState(null);
  const [cartInsightsData, setCartInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [formattedMetrics, salesData, cartInsightsData] = await Promise.all([
          Promise.resolve(getFormattedMetrics()),
          getSalesData(),
          getCartInsights()
        ]);
        setMetrics(formattedMetrics);
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
        <TopBar />
        <Navigation />
        <div className="w-full min-h-[calc(100vh)] flex flex-col items-center justify-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-gray-600 text-lg">Loading Analytics Data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return <div className='flex justify-center items-center h-screen text-xl text-red-600'>{error}</div>;
  }

  return (
    <>
      <TopBar />
      <Navigation />
      
      <div className="w-full min-h-[calc(100vh-140px)]">
        <div className="w-full mt-8 px-20 pb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
          
          <div className="flex gap-6">
            {/* First Column - 2/3 width */}
            <div className="flex-[2] flex flex-col gap-6">
              
              <div className="grid grid-cols-3 gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                <MetricsCard 
                  title="Monthly Profit"
                  value={metrics.profit.value}
                  percentageChange={metrics.profit.percentageChange}
                  previousMonth={metrics.profit.previousMonth}
                />
                <MetricsCard 
                  title="Average Order Value"
                  value={metrics.averageOrderValue.value}
                  percentageChange={metrics.averageOrderValue.percentageChange}
                  previousMonth={metrics.averageOrderValue.previousMonth}
                />
                <MetricsCard 
                  title="Monthly Orders"
                  value={metrics.orders.value}
                  percentageChange={metrics.orders.percentageChange}
                  previousMonth={metrics.orders.previousMonth}
                />
                
              </div>

              {/* Sales Performance */}
              <div className="w-full mt-1">
                <SalesPerformance data={salesData} />
              </div>

              <div className="w-full mt-1">
                <TopProducts 
                  title="Top Products"
                  data={salesData?.topProducts.map(product => ({
                    name: product.name,
                    revenue: `₱${product.revenue.toLocaleString()}`,
                    sales: `${product.sales} units`,
                    growth: product.growth
                  })) || []}
                />  
              </div>
              <div className="w-full mt-1">
                <CartInsights data={cartInsightsData} />
              </div>
            </div>
            
            {/* Second Column - 1/3 width */}
            <div className="flex-1 flex flex-col gap-6">
              <StockMovement />
              <SmartReorder />
            </div>
          </div>
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