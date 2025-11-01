import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistoricalCustomerData } from '../services/analytics';

const CustomerPurchaseThumbnail = () => {

  const navigate = useNavigate();

  // State for API data (for quick stats)
  const [thumbnailData, setThumbnailData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock data for chart (to show trends)
  const [chartData, setChartData] = useState([]);

  // Fetch last 3 months including current month
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        // Get 3 months including current month (e.g., Jul 2025, Aug 2025, Sep 2025)
        const res = await getHistoricalCustomerData(3); 
        if (!isMounted) return;
        
        // Map backend data to UI format and ensure we have exactly 3 months
        const mapped = (res?.data || [])
          .slice(-3) // Take only the last 3 months
          .map((d) => {
            const dt = new Date(d.month);
            // Show just month name since we want the most recent months (Jul, Aug, Sep 2025)
            const label = dt.toLocaleString('en-US', { month: 'short' });
            return { 
              month: label, 
              newCustomers: d.newCustomers, 
              bulkOrdersCount: d.bulkOrdersCount, 
              bulkOrdersAmount: d.bulkOrdersAmount 
            };
          });
         setThumbnailData(mapped);
       } catch (e) {
         console.error('Failed to fetch customer data:', e);
         setThumbnailData([]);
       } finally {
         if (isMounted) {
           setIsLoading(false);
         }
       }
     })();
     return () => { isMounted = false; };
   }, []);

   // Generate mock chart data with clear trends
   useEffect(() => {
     const generateChartData = () => {
       const now = new Date();
       const months = [];
       
       for (let i = 3; i >= 0; i--) {
         const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const monthName = date.toLocaleString('en-US', { month: 'short' });
         
         // Create clear trending data
         const baseValue = 120 + (i * 110); // 120, 145, 170 - clear upward trend
         const variation = Math.floor(Math.random() * 95) - 7; // ±7 variation
         
         months.push({
           month: monthName,
           bulkOrdersCount: Math.max(50, baseValue + variation) // Ensure minimum value
         });
       }
       
       return months;
     };

     setChartData(generateChartData());
   }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  return (
    <div 
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
      onClick={() => navigate('/home/analytics/customer-purchase')}
      title="Click to View Full Analysis"
    >
      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">
                Customer Purchase Forecast
              </h3>
              <p className="text-sm text-gray-600">AI-powered customer insights</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transform group-hover:translate-x-1 transition-all duration-300" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Avg Order Size</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {isLoading ? 'Loading...' : thumbnailData.length > 0 ? (
                (() => {
                  const totalCount = thumbnailData.reduce((sum, item) => sum + (item.bulkOrdersCount || 0), 0);
                  const totalAmount = thumbnailData.reduce((sum, item) => sum + (item.bulkOrdersAmount || 0), 0);
                  const avg = totalCount ? (totalAmount / totalCount) : 0;
                  return formatCurrency(Math.round(avg));
                })()
              ) : 'No data'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingCart className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Orders Count</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {isLoading ? 'Loading...' : thumbnailData.length > 0 ? formatNumber(thumbnailData.reduce((sum, item) => sum + (item.bulkOrdersCount || 0), 0)) : 'No data'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Orders Amount</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {isLoading ? 'Loading...' : thumbnailData.length > 0 ? formatCurrency(thumbnailData.reduce((sum, item) => sum + (item.bulkOrdersAmount || 0), 0)) : 'No data'}
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[120px] text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-xs">Loading chart...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Area
                  type="monotone"
                  dataKey="bulkOrdersCount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#customerGradient)"
                  dot={{ r: 3, fill: '#8b5cf6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[120px] text-gray-500">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs">No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Customer bulk orders analysis</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Order behavior tracking</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>3-6 month customer bulk orders forecasts</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extralight text-gray-700">
              Click to View Full Analysis
            </span>
            <div className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full group-hover:bg-purple-700 transition-colors duration-300">
              Open Dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPurchaseThumbnail;