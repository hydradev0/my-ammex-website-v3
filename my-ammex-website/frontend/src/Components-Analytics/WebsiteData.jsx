import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer
} from 'recharts';
import { Eye, MousePointer, ShoppingCart, ArrowLeft, ChartBar, RefreshCw, ChevronDown, Calendar, TrendingUp, Lightbulb, Sparkles, Tag, ArrowRight, Zap, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import RoleBasedLayout from '../Components/RoleBasedLayout';
import { getWebsiteCategoryTraffic, getWebsiteTopClickedItems, getWebsiteCartAdditions, refreshWebsiteAnalytics, generateAIInsights } from '../services/websiteAnalytics';
import { formatNumber, formatCurrency } from '../utils/format';

// Custom Dropdown Component
const CustomDropdown = ({ options, value, onChange, icon: Icon, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center cursor-pointer justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-600" />}
          <span className="text-sm font-medium">{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left cursor-pointer px-4 py-2 text-sm hover:bg-indigo-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                option.value === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton Loaders
const PieChartSkeleton = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="relative">
      <div className="w-48 h-48 rounded-full border-8 border-gray-200 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse"></div>
      </div>
    </div>
  </div>
);

const HorizontalBarChartSkeleton = () => (
  <div className="space-y-4 h-[300px] flex flex-col justify-center px-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div 
          className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" 
          style={{ width: `${Math.random() * 60 + 20}%` }}
        ></div>
      </div>
    ))}
  </div>
);

const VerticalBarChartSkeleton = () => (
  <div className="flex items-end justify-center gap-4 h-[400px] px-8">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 flex-1">
        <div 
          className="w-full bg-gradient-to-t from-gray-300 to-gray-200 rounded-t animate-pulse" 
          style={{ height: `${Math.random() * 60 + 20}%` }}
        ></div>
        <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    ))}
  </div>
);

const WebsiteData = () => {
  const navigate = useNavigate();

  // Date range (default last 30 days)
  const [endDate, setEndDate] = useState(() => new Date());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // 30 days back to match default
    return d;
  });
  const [quickRange, setQuickRange] = useState('30');

  // Data state
  const [categoryTrafficData, setCategoryTrafficData] = useState([]);
  const [topClickedItems, setTopClickedItems] = useState([]);
  const [cartAdditionsData, setCartAdditionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // Ref for scrolling to insights
  const insightsRef = useRef(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const startParam = useMemo(() => startDate.toISOString().slice(0,10), [startDate]);
  const endParam = useMemo(() => endDate.toISOString().slice(0,10), [endDate]);

  // Debounced data fetching
  useEffect(() => {
    // Debounce timer - wait 500ms after last change before fetching
    const debounceTimer = setTimeout(() => {
      const load = async () => {
        setLoading(true);
        setError('');
        try {
          const [cats, items, carts] = await Promise.all([
            getWebsiteCategoryTraffic({ start: startParam, end: endParam }),
            getWebsiteTopClickedItems({ start: startParam, end: endParam, limit: 5 }),
            getWebsiteCartAdditions({ start: startParam, end: endParam })
          ]);

        // Process data to include model numbers in display names
        const processedItems = items.map(item => {
          let displayName = '';

          // Always show product name if available
          if (item.name && item.name !== 'Unknown') {
            displayName = item.name;
            // Add model number if it's different from the name and not N/A
            if (item.modelNo && item.modelNo !== 'N/A' && item.modelNo !== item.name) {
              displayName += ` (${item.modelNo})`;
            }
          } else if (item.modelNo && item.modelNo !== 'N/A') {
            // If no name but have model, show model
            displayName = item.modelNo;
          } else {
            // Fallback
            displayName = item.name || 'Unknown Product';
          }

          // Truncate very long display names to prevent overflow (for vertical chart)
          const MAX_LENGTH = 15;
          if (displayName.length > MAX_LENGTH) {
            // Try to keep model number if present
            if (displayName.includes(' (')) {
              const parts = displayName.split(' (');
              const namePart = parts[0];
              const modelPart = '(' + parts[1];

              // If name part is too long, truncate it
              if (namePart.length > MAX_LENGTH - 8) { // Leave room for model
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

        const processedCarts = carts.map(item => {
          let displayName = '';

          // Always show product name if available
          if (item.name && item.name !== 'Unknown') {
            displayName = item.name;
            // Add model number if it's different from the name and not N/A
            if (item.modelNo && item.modelNo !== 'N/A' && item.modelNo !== item.name) {
              displayName += ` (${item.modelNo})`;
            }
          } else if (item.modelNo && item.modelNo !== 'N/A') {
            // If no name but have model, show model
            displayName = item.modelNo;
          } else {
            // Fallback
            displayName = item.name || 'Unknown Product';
          }

          // Truncate very long display names to prevent overflow
          const MAX_LENGTH = 25;
          if (displayName.length > MAX_LENGTH) {
            // Try to keep model number if present
            if (displayName.includes(' (')) {
              const parts = displayName.split(' (');
              const namePart = parts[0];
              const modelPart = '(' + parts[1];

              // If name part is too long, truncate it
              if (namePart.length > MAX_LENGTH - 8) { // Leave room for model
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

        setCategoryTrafficData(cats);
        setTopClickedItems(processedItems);
        setCartAdditionsData(processedCarts);
      } catch (e) {
        setError('Failed to load website analytics');
      } finally {
        setLoading(false);
      }
    };
      void load();
    }, 1000); // 1000ms debounce

    // Cleanup function - cancel the timer if dates change again
    return () => clearTimeout(debounceTimer);
  }, [startParam, endParam]);

  const scrollToInsights = () => {
    setTimeout(() => {
      insightsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const onQuickRangeChange = (val) => {
    setQuickRange(val);
    
    // Only update dates if NOT custom (custom uses existing dates)
    if (val !== 'custom') {
      const now = new Date();
      setEndDate(now);
      const d = new Date(now);
      if (val === '30') d.setDate(now.getDate() - 30);
      else if (val === '90') d.setDate(now.getDate() - 90);
      else if (val === '365') d.setDate(now.getDate() - 365);
      setStartDate(d);
    }
    // If custom, just update the dropdown state - don't change dates
    // User will manually select dates via calendar inputs
    
    // Scroll to insights when dropdown changes (if insights exist)
    if (insights) {
      scrollToInsights();
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      console.log('🤖 Generating AI insights...');
      console.log('📅 Date range:', startParam, 'to', endParam);
      console.log('📊 Using already-loaded data from charts');
      
      // Check if we have data
      if (!categoryTrafficData.length && !topClickedItems.length && !cartAdditionsData.length) {
        throw new Error('No data available. Please wait for data to load or select a different date range.');
      }
      
      const insights = await generateAIInsights({ 
        categoryTraffic: categoryTrafficData,
        topClickedItems: topClickedItems,
        cartAdditions: cartAdditionsData,
        dateRange: {
          start: startParam,
          end: endParam
        }
      });
      
      console.log('✅ Insights generated successfully:', insights);
      setInsights(insights);
      
      // Scroll to insights after generation
      scrollToInsights();
    } catch (error) {
      console.error('❌ Failed to generate insights:', error);
      setError('Failed to generate insights: ' + error.message);
      
      // Show fallback message
      setInsights({
        trends: [
          'Unable to generate AI insights at this time',
          'Please check your OpenRouter API key configuration',
          'Or try again in a few moments'
        ],
        recommendations: [
          'Ensure OPENROUTER_API_KEY is set in your environment variables',
          'Check backend logs for more details',
          'Contact support if the issue persists'
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      await refreshWebsiteAnalytics();
      setRefreshMessage('Data refreshed successfully! Reloading data...');
      
      // Reload data after refresh
      setTimeout(async () => {
        try {
          const [cats, items, carts] = await Promise.all([
            getWebsiteCategoryTraffic({ start: startParam, end: endParam }),
            getWebsiteTopClickedItems({ start: startParam, end: endParam, limit: 5 }),
            getWebsiteCartAdditions({ start: startParam, end: endParam })
          ]);

          // Process items (same logic as in useEffect)
          const processedItems = items.map(item => {
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

            const MAX_LENGTH = 15;
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

          const processedCarts = carts.map(item => {
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

            const MAX_LENGTH = 25;
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

          setCategoryTrafficData(cats);
          setTopClickedItems(processedItems);
          setCartAdditionsData(processedCarts);
          setRefreshMessage('Data reloaded successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => setRefreshMessage(''), 3000);
        } catch (e) {
          setError('Failed to reload data after refresh');
        }
      }, 1000);
    } catch (error) {
      setRefreshMessage('Failed to refresh analytics: ' + error.message);
      setTimeout(() => setRefreshMessage(''), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportInsightsToExcel = () => {
    if (!insights) return;

    const allData = [];
    
    // Header
    allData.push(['AI INSIGHTS & RECOMMENDATIONS REPORT']);
    allData.push(['']);
    allData.push([`Report Period: ${startParam} to ${endParam}`]);
    allData.push(['Generated Date:', new Date().toLocaleString()]);
    allData.push(['']);
    
    // INSIGHTS Section
    allData.push(['INSIGHTS']);
    allData.push(['']);
    allData.push(['#', 'Trend']);
    
    if (insights.trends && insights.trends.length > 0) {
      insights.trends.forEach((trend, index) => {
        allData.push([index + 1, trend]);
      });
    } else {
      allData.push(['N/A', 'No trends available']);
    }
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Recommendations Section
    allData.push(['RECOMMENDATIONS']);
    allData.push(['']);
    allData.push(['#', 'Recommendation']);
    
    if (insights.recommendations && insights.recommendations.length > 0) {
      insights.recommendations.forEach((rec, index) => {
        allData.push([index + 1, rec]);
      });
    } else {
      allData.push(['N/A', 'No recommendations available']);
    }
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Suggested Discounts Section (if available)
    if (insights.suggestedDiscounts && insights.suggestedDiscounts.length > 0) {
      allData.push(['SUGGESTED DISCOUNTS']);
      allData.push(['']);
      allData.push(['#', 'Product Name', 'Model No.', 'Recommended Discount (%)', 'Reason', 'Expected Impact']);
      
      insights.suggestedDiscounts.forEach((product, index) => {
        allData.push([
          index + 1,
          product.productName || 'N/A',
          product.modelNo && product.modelNo !== 'N/A' ? product.modelNo : 'N/A',
          product.recommendedDiscount || 'N/A',
          product.reason || 'N/A',
          product.expectedImpact || 'N/A'
        ]);
      });
    }
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 8 },  // # column
      { wch: 40 }, // Trend/Recommendation/Product Name column
      { wch: 20 }, // Model No. column
      { wch: 22 }, // Discount column
      { wch: 50 }, // Reason column
      { wch: 50 }  // Expected Impact column
    ];

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AI Insights');
    
    const filename = `Website_Insights_${startParam}_to_${endParam}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportChartsToExcel = () => {
    const allData = [];
    
    // Header
    allData.push(['WEBSITE TRAFFIC ANALYTICS REPORT']);
    allData.push(['']);
    allData.push([`Report Period: ${startParam} to ${endParam}`]);
    allData.push(['Generated Date:', new Date().toLocaleString()]);
    allData.push(['']);
    
    // Category Traffic Distribution Section
    allData.push(['CATEGORY TRAFFIC DISTRIBUTION']);
    allData.push(['']);
    allData.push(['Category', 'Clicks', 'Percentage (%)']);
    
    if (categoryTrafficData && categoryTrafficData.length > 0) {
      categoryTrafficData.forEach((item) => {
        allData.push([
          item.category || 'N/A',
          item.clicks || 0,
          item.percentage ? `${item.percentage}%` : '0%'
        ]);
      });
    } else {
      allData.push(['No data available', '', '']);
    }
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Most Clicked Items Section
    allData.push(['MOST CLICKED ITEMS']);
    allData.push(['']);
    allData.push(['#', 'Product Name', 'Model No.', 'Clicks']);
    
    if (topClickedItems && topClickedItems.length > 0) {
      topClickedItems.forEach((item, index) => {
        allData.push([
          index + 1,
          item.originalName || item.name || 'N/A',
          item.modelNo && item.modelNo !== 'N/A' ? item.modelNo : 'N/A',
          item.clicks || 0
        ]);
      });
    } else {
      allData.push(['No data available', '', '', '']);
    }
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Most Added to Cart Section
    allData.push(['MOST ADDED TO CART']);
    allData.push(['']);
    allData.push(['#', 'Product Name', 'Model No.', 'Additions', 'Total Value']);
    
    if (cartAdditionsData && cartAdditionsData.length > 0) {
      cartAdditionsData.forEach((item, index) => {
        allData.push([
          index + 1,
          item.originalName || item.name || 'N/A',
          item.modelNo && item.modelNo !== 'N/A' ? item.modelNo : 'N/A',
          item.additions || 0,
          item.value ? formatCurrency(item.value) : '₱0'
        ]);
      });
    } else {
      allData.push(['No data available', '', '', '', '']);
    }
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 8 },  // # column
      { wch: 35 }, // Category/Product Name column
      { wch: 20 }, // Model No. column
      { wch: 12 }, // Clicks/Additions column
      { wch: 15 }, // Percentage column
      { wch: 18 }  // Total Value column
    ];

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Website Traffic');
    
    const filename = `Website_Traffic_Charts_${startParam}_to_${endParam}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Try to get additional data from the payload
      const firstEntry = payload[0];
      const data = firstEntry?.payload;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>

          {/* Show product details if available */}
          {data && (data.originalName || data.modelNo) && (
            <div className="mb-3 pb-2 border-b border-gray-100">
              {data.originalName && data.originalName !== 'Unknown' && data.originalName !== 'Unknown Product' && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {data.originalName}
                </p>
              )}
              {data.modelNo && data.modelNo !== 'N/A' && data.modelNo !== data.originalName && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Model:</span> {data.modelNo}
                </p>
              )}
            </div>
          )}

          {/* Show metrics */}
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              <span className="font-medium">{entry.name}:</span> {entry.value.toLocaleString()}
            </p>
          ))}

          {/* Show percentage for category traffic */}
          {data && data.percentage !== undefined && (
            <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
              {data.percentage}% of total traffic
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <RoleBasedLayout />
    <div className="min-h-screen p-8 ">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center -mx-36 gap-4 mb-5">
            <button
              onClick={() => navigate('/home/analytics')}
              className="group flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2 -mt-17">
            <ChartBar className="w-8 h-8 text-pink-600" />
            Website Traffics
          </h1>
          <p className="text-gray-600 mt-2">Analyze website traffic patterns and user behavior</p>
          {/* Filters */}
          <div className="mt-4 space-y-3">
            {/* Top Row: Dropdown, AI Button, Export Charts Button, Refresh Button */}
            <div className="flex flex-wrap items-center gap-3">
              <CustomDropdown
                options={[
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: '365', label: 'Last 365 days' },
                  { value: 'custom', label: 'Custom Range' }
                ]}
                value={quickRange}
                onChange={onQuickRangeChange}
                icon={Calendar}
                className="w-48"
              />
              
              {/* AI Insights Button - Next to Dropdown */}
              <button
                onClick={generateInsights}
                disabled={isGenerating || loading}
                className="group cursor-pointer relative px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Generate AI insights and recommendations"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Generate AI Insights'}</span>
              </button>

              {/* Export Charts Button */}
              <button
                onClick={exportChartsToExcel}
                disabled={loading || (!categoryTrafficData.length && !topClickedItems.length && !cartAdditionsData.length)}
                className="group cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export chart data to Excel"
              >
                <Download className="w-4 h-4" />
                <span>Export Charts</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefreshAnalytics}
                disabled={isRefreshing}
                className="group cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                title="Refresh materialized views with latest data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
            </div>

            {/* Calendar Inputs - Only show when custom is selected */}
            {quickRange === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pl-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startParam}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="pl-10 cursor-pointer pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent hover:bg-gray-50 transition-colors"
                  />
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endParam}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="pl-10 cursor-pointer pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent hover:bg-gray-50 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        {refreshMessage && (
          <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${
            refreshMessage.includes('Failed') 
              ? 'text-red-600 bg-red-50 border-red-200' 
              : 'text-green-600 bg-green-50 border-green-200'
          }`}>
            {refreshMessage.includes('Failed') ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {refreshMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Traffic Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Category Traffic Distribution
          </h3>
          {loading ? (
            <PieChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryTrafficData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.category} (${entry.percentage}%)`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="clicks"
                >
                  {categoryTrafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Clicked Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-pink-600" />
            Most Clicked Items
          </h3>
          {loading ? (
            <HorizontalBarChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClickedItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={180} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clicks" fill="#ec4899" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Added to Cart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Most Added to Cart
          </h3>
          {loading ? (
            <VerticalBarChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cartAdditionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  angle={-40}
                  textAnchor="end"
                  height={140}
                  tick={{ fontSize: 15 }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="additions" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Insights Display */}
      <div ref={insightsRef} className="scroll-mt-8">
        {insights && (
          <div className="max-w-6xl mx-auto mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Insights & Recommendations</h3>
                    <p className="text-sm text-purple-100">Based on your selected date range</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 border border-white/100 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-white">{startParam} to {endParam}</span>
                  </div>
                  <button
                    onClick={exportInsightsToExcel}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-white/100 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Export insights to Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export Insights</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* INSIGHTS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Insights</h4>
                </div>
                <ul className="space-y-3">
                  {insights.trends.map((trend, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{trend}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-pink-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Recommendations</h4>
                </div>
                <ul className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Suggested Discounts Section */}
            {insights.suggestedDiscounts && insights.suggestedDiscounts.length > 0 && (
              <div className="mt-1 border-t border-gray-300 p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      Suggested Discounts
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Products that could benefit from promotional pricing to boost conversions</p>
                  </div>
                  <button
                    onClick={() => {
                      const productNames = insights.suggestedDiscounts.map(p => p.productName).join(',');
                      const modelNos = insights.suggestedDiscounts.map(p => p.modelNo).join(',');
                      const url = `${window.location.origin}/product-discounts?suggested=ai&products=${encodeURIComponent(productNames)}&models=${encodeURIComponent(modelNos)}`;
                      window.open(url, '_blank');
                    }}
                    className="cursor-pointer px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <Tag className="w-5 h-5" />
                    Apply Discounts to All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {insights.suggestedDiscounts.map((product, index) => (
                    <div key={index} className="bg-white border-2 border-orange-200 rounded-xl p-4 hover:border-orange-400 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900 text-lg">{product.productName}</h5>
                              {product.modelNo && product.modelNo !== 'N/A' && (
                                <p className="text-sm text-gray-600 mt-1">Model: {product.modelNo}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="inline-flex items-center px-3 py-1.5 bg-slate-600 text-white rounded-full font-semibold text-sm">
                                {product.recommendedDiscount}% OFF
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 ml-11">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-orange-600 uppercase mt-0.5">Reason:</span>
                              <p className="text-sm text-gray-700 flex-1">{product.reason}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-green-600 uppercase mt-0.5">Impact:</span>
                              <p className="text-sm text-gray-700 flex-1">{product.expectedImpact}</p>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/product-discounts?suggested=ai&products=${encodeURIComponent(product.productName)}&models=${encodeURIComponent(product.modelNo)}&discount=${product.recommendedDiscount}`;
                            window.open(url, '_blank');
                          }}
                          className="flex-shrink-0 cursor-pointer px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
                        >
                          Apply Discount
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State - Show when no insights generated yet */}
        {!insights && !isGenerating && (
          <div className="max-w-6xl mx-auto mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generate AI Insights</h3>
                <p className="text-gray-600 max-w-md">
                  Click the "Generate AI Insights" button above to get insights and recommendations based on your website traffic data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="max-w-6xl mx-auto mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
                <div className="absolute inset-0 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Insights...</h3>
                <p className="text-gray-600">Analyzing your data and preparing recommendations</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    </>
  );
};

export default WebsiteData;