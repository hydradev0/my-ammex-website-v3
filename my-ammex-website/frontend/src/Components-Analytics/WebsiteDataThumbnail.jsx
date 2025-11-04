import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Eye,
  MousePointer,
  ArrowRight,
  BarChart3,
  ChartBar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWebsiteTopClickedItems } from '../services/websiteAnalytics';

const WebsiteDataThumbnail = () => {
  const navigate = useNavigate();

  // State for API data
  const [topClickedItems, setTopClickedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch last 30 days data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const data = await getWebsiteTopClickedItems({
          start: startDate.toISOString().slice(0, 10),
          end: endDate.toISOString().slice(0, 10),
          limit: 5
        });

        if (!isMounted) return;
        
        // Process data to include model numbers in display names (truncated for thumbnail)
        const processedItems = data.map(item => {
          let displayName = '';
          
          if (item.name && item.name !== 'Unknown') {
            displayName = item.name;
            if (item.modelNo && item.modelNo !== 'N/A' && item.modelNo !== item.name) {
              displayName += ` (${item.modelNo})`;
            }
          } else if (item.modelNo && item.modelNo !== 'N/A') {
            displayName = item.modelNo;
          } else {
            displayName = item.name || 'Unknown Product';
          }
          
          // Truncate long names for horizontal chart
          const MAX_LENGTH = 20;
          if (displayName.length > MAX_LENGTH) {
            if (displayName.includes(' (')) {
              const parts = displayName.split(' (');
              const namePart = parts[0];
              const modelPart = '(' + parts[1];
              
              if (namePart.length > MAX_LENGTH - 8) {
                displayName = namePart.substring(0, MAX_LENGTH - 11) + '...' + modelPart;
              }
            } else {
              displayName = displayName.substring(0, MAX_LENGTH - 3) + '...';
            }
          }
          
          return {
            ...item,
            name: displayName,
            originalName: item.name,
            modelNo: item.modelNo
          };
        });
        
        setTopClickedItems(processedItems);
      } catch (e) {
        console.error('Failed to fetch top clicked items:', e);
        setTopClickedItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Calculate metrics
  const totalClicks = topClickedItems.reduce((sum, item) => sum + (item.clicks || 0), 0);
  const topItem = topClickedItems.length > 0 ? topClickedItems[0] : null;
  const totalItems = topClickedItems.length;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/home/analytics/website-data');
  };

  return (
    <div
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
      onClick={handleClick}
      title="Click to View Full Analysis"
    >
      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors duration-300">
              <ChartBar className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-900 transition-colors">
                Website Traffics
              </h3>
              <p className="text-sm text-gray-600">Traffic & user behavior insights & recommendations</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 transform group-hover:translate-x-1 transition-all duration-300" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MousePointer className="w-4 h-4 text-pink-600" />
              <span className="text-xs text-gray-600">Total Clicks</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {isLoading ? 'Loading...' : formatNumber(totalClicks)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Top Item</span>
            </div>
            <p className="text-sm font-bold text-blue-600 truncate px-1" title={topItem?.originalName || topItem?.name}>
              {isLoading ? 'Loading...' : topItem?.name || 'No data'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Items</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {isLoading ? 'Loading...' : totalItems}
            </p>
          </div>
        </div>

        {/* Mini Chart - Horizontal Bar Chart */}
        <div className="mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[180px] text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-2"></div>
                <p className="text-xs">Loading chart...</p>
              </div>
            </div>
          ) : topClickedItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topClickedItems} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  width={120}
                />
                <Bar
                  dataKey="clicks"
                  fill="#ec4899"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-gray-500">
              <div className="text-center">
                <MousePointer className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs">No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Most clicked items tracking</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Category traffic analysis</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Cart addition insights</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extralight text-gray-700">
              Click to View Full Analysis
            </span>
            <div className="px-3 py-1 bg-pink-600 text-white text-xs rounded-full group-hover:bg-pink-700 transition-colors duration-300">
              Open Dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteDataThumbnail;
