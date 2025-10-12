import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistoricalSales, postForecast, getTopProducts, getYTDSalesGrowth } from '../services/analytics';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Calendar,
  Brain,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FilePlus2,
  FileChartColumn,
  AlignEndHorizontal,
  ChevronDown,
  ArrowLeft,
  Package
} from 'lucide-react';
import Modal from './Modal';
import LoadingModal from './LoadingModal';
import RoleBasedLayout from '../Components/RoleBasedLayout';

// Custom Dropdown Component
const CustomDropdown = ({ options, value, onChange, placeholder, icon: Icon, className = "" }) => {
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
        className="w-full flex items-center cursor-pointer justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-600" />}
          <span className="text-sm font-medium">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-5 h-5 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              className={`w-full text-left cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
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

const SalesTrend = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('3');
  const [historicalPeriod, setHistoricalPeriod] = useState('3');
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [selectedProductTab, setSelectedProductTab] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Historical sales state (fetched from backend)
  const [allHistoricalData, setAllHistoricalData] = useState([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(true);

  // Top products state
  const [topProductsData, setTopProductsData] = useState({});
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);

  // YTD growth state
  const [ytdGrowthData, setYtdGrowthData] = useState(null);
  const [isLoadingYtdGrowth, setIsLoadingYtdGrowth] = useState(true);

  // Filter historical data based on selected period
  const getHistoricalData = () => {
    if (historicalPeriod === 'current') {
      // For current month, show only the most recent month
      return allHistoricalData.slice(-1);
    }
    const periods = parseInt(historicalPeriod);
    return allHistoricalData.slice(-periods);
  };

  const historicalSalesData = getHistoricalData();

  // Get latest top products for display
  const getLatestTopProducts = () => {
    const months = Object.keys(topProductsData).sort((a, b) => new Date(b) - new Date(a));
    return months.length > 0 ? topProductsData[months[0]] : [];
  };

  const latestTopProducts = getLatestTopProducts();

  // Check cooldown status on component mount and periodically
  useEffect(() => {
    const checkCooldown = () => {
      const lastSuccessTime = localStorage.getItem('lastSalesForecastSuccess');
      if (lastSuccessTime) {
        const now = Date.now();
        const cooldownPeriod = 10000; // 10 seconds
        const remaining = cooldownPeriod - (now - parseInt(lastSuccessTime));
        
        if (remaining > 0) {
          setCooldownRemaining(Math.ceil(remaining / 1000));
        } else {
          setCooldownRemaining(null);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoadingHistorical(true);
      try {
        const months = historicalPeriod === 'current' ? 1 : Math.max(parseInt(historicalPeriod), 1);
        const includeCurrent = historicalPeriod === 'current';
        const res = await getHistoricalSales(months, includeCurrent);
        if (!isMounted) return;
        // Backend returns items like { month: '2025-09-01', sales: 750000 }
        // Map to UI labels like 'Sep 2025'
        const mapped = (res?.data || []).map((d) => {
          const dt = new Date(d.month);
          const label = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          return { month: label, sales: d.sales, trend: 'stable' };
        });
        setAllHistoricalData(mapped);
      } catch (e) {
        console.error('Failed to fetch historical sales data:', e);
        // No fallback data - let the UI show "No historical data available"
        setAllHistoricalData([]);
      } finally {
        if (isMounted) {
          setIsLoadingHistorical(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [historicalPeriod]);

  // Fetch top products data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoadingTopProducts(true);
      try {
        const months = historicalPeriod === 'current' ? 1 : Math.max(parseInt(historicalPeriod), 1);
        const res = await getTopProducts({ months, limit: 10 });
        if (!isMounted) return;
        setTopProductsData(res?.data || {});
      } catch (e) {
        console.error('Failed to fetch top products data:', e);
        setTopProductsData({});
      } finally {
        if (isMounted) {
          setIsLoadingTopProducts(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [historicalPeriod]);

  // Fetch YTD growth data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoadingYtdGrowth(true);
      try {
        const res = await getYTDSalesGrowth();
        if (!isMounted) return;
        setYtdGrowthData(res?.data || null);
      } catch (e) {
        console.error('Failed to fetch YTD growth data:', e);
        setYtdGrowthData(null);
      } finally {
        if (isMounted) {
          setIsLoadingYtdGrowth(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Update loading progress while analyzing
  useEffect(() => {
    if (isAnalyzing) {
      setLoadingProgress(0);
      const duration = 10000; // 10 seconds estimated duration
      const interval = 50; // Update every 50ms
      const increment = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + increment;
          // Cap at 95% until actual completion
          return next >= 95 ? 95 : next;
        });
      }, interval);
      
      return () => clearInterval(timer);
    } else {
      // Complete the progress when done
      setLoadingProgress(100);
      const resetTimer = setTimeout(() => {
        setLoadingProgress(0);
      }, 500);
      return () => clearTimeout(resetTimer);
    }
  }, [isAnalyzing]);

  // Dropdown options
  const historicalPeriodOptions = [
    { value: 'current', label: 'Current Month' },
    { value: '1', label: 'Last Month' },
    { value: '3', label: 'Last 3 Months' },
    { value: '6', label: 'Last 6 Months' },
    { value: '12', label: 'Last 12 Months' },
  ];

  const forecastPeriodOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' }
  ];


  // Prediction generator (backend + fallback)
  const generatePredictions = async () => {
    // Check cooldown period (10 seconds = 10000ms)
    const lastSuccessTime = localStorage.getItem('lastSalesForecastSuccess');
    const now = Date.now();
    const cooldownPeriod = 10000; // 10 seconds in milliseconds
    
    if (lastSuccessTime && (now - parseInt(lastSuccessTime)) < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - parseInt(lastSuccessTime))) / 1000);
      alert(`Please wait ${remainingTime} more seconds before making another forecast request.`);
      return;
    }
    
    setIsAnalyzing(true);
    const periodInt = parseInt(selectedPeriod);
    try {
      // Use 3 years of historical data for optimal accuracy vs cost balance
      const res = await postForecast({ period: periodInt, historicalMonths: 36 }); // 36 months = 3 years
      // Backend forecast shape → adapt to UI
      const f = res?.forecast;
      if (f?.monthlyBreakdown?.length) {
        // Use backend-provided monthly breakdown with MoM calculations
        const monthly = f.monthlyBreakdown.map((p) => ({
          month: p.month,
          predicted: Math.round(p.predicted || 0),
          momChange: p.momChange || 0,
          topProducts: p.topProducts || []
        }));
        const totalPredicted = monthly.reduce((s, m) => s + (m.predicted || 0), 0);
        const avgMonthly = monthly.length ? Math.round(totalPredicted / monthly.length) : 0;
        const payload = {
          period: `${periodInt} months`,
          totalPredicted,
          avgMonthly,
          totalGrowth: f.totalGrowth || 0,
          growthRate: f.growthRate || 0,
          monthlyBreakdown: monthly,
          insights: f.insights || [],
          recommendations: f.recommendations || []
        };
        setPredictions(payload);

        // Select first month by default for product tabs if available
        const hasTopProducts = payload.monthlyBreakdown.some(item => item.topProducts && item.topProducts.length > 0);
        if (hasTopProducts) {
          setSelectedProductTab(0);
        }

        // Only set cooldown on successful prediction
        localStorage.setItem('lastSalesForecastSuccess', Date.now().toString());
      } else {
        throw new Error('Empty forecast');
      }
    } catch (err) {
      console.error('Forecast generation failed:', err);
      
      // Parse error response for better user feedback
      let errorMessage = 'Failed to generate AI forecast.';
      let errorDetails = err.message || 'Unknown error occurred';
      let suggestions = [
        'Check OpenRouter API key configuration',
        'Verify backend connectivity', 
        'Ensure historical data is available'
      ];
      
      // Check if it's a structured error response
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          errorDetails = errorData.details;
        }
        
        // Provide specific suggestions based on error type
        if (errorMessage.includes('model') && errorMessage.includes('not available')) {
          suggestions = [
            'The AI model is currently unavailable',
            'Contact support to update model configuration',
            'Try again later when the model is available'
          ];
        } else if (errorMessage.includes('rate limited') || errorMessage.includes('temporarily busy')) {
          suggestions = [
            'The AI service is experiencing high demand',
            'Wait a few moments and try again',
            'Consider using a different time'
          ];
        } else if (errorMessage.includes('quota exceeded')) {
          suggestions = [
            'AI service quota has been exceeded',
            'Wait for quota to reset',
            'Contact support for quota increase'
          ];
        }
      }
      
      setPredictions({
        error: errorMessage,
        details: errorDetails,
        period: `${periodInt} months`,
        totalPredicted: 0,
        avgMonthly: 0,
        growthRate: 0,
        monthlyBreakdown: [],
        insights: ['AI forecasting service unavailable'],
        recommendations: suggestions
      });
    } finally {
      setIsAnalyzing(false);
      setShowModal(true);
    }
  };

  const exportHistoricalData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Sales\n"
      + historicalSalesData.map(row => `${row.month},${row.sales}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historical_sales_${historicalPeriod}months.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPredictionData = () => {
    if (!predictions || predictions.error || !predictions.monthlyBreakdown) return;

    let csvRows = ["Month,Predicted Sales,MoM Change"];

    predictions.monthlyBreakdown.forEach(row => {
      csvRows.push(`${row.month},${row.predicted},${row.momChange}%`);
    });

    // Add top products section if available
    const allTopProducts = predictions.monthlyBreakdown.flatMap(item => item.topProducts || []);
    if (allTopProducts.length > 0) {
      csvRows.push("");
      csvRows.push("Top Products Forecast");
      csvRows.push("Rank,Product Name,Category,Expected Orders");
      allTopProducts.slice(0, 6).forEach((product, index) => {
        csvRows.push(`${index + 1},"${product.name}",${product.category},${product.expectedOrders}`);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_forecast_${predictions.period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              Sales: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // const TrendIndicator = ({ trend, value }) => (
  //   <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
  //     trend === 'up' 
  //       ? 'bg-green-100 text-green-700' 
  //       : trend === 'down' 
  //       ? 'bg-red-100 text-red-700'
  //       : 'bg-gray-100 text-gray-700'
  //   }`}>
  //     {trend === 'up' && <ArrowUp className="w-3 h-3" />}
  //     {trend === 'down' && <ArrowDown className="w-3 h-3" />}
  //     {formatCurrency(value)}
  //   </span>
  // );

  return (
    <>
    <RoleBasedLayout />
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center -mx-36 gap-4 mb-5">
            <button
              onClick={() => navigate('/home/analytics')}
              className="group flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2 -mt-17">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Sales Forecast
          </h1>
          <p className="text-gray-600 -mt-2">Analyze historical sales data and generate AI-powered forecasts</p>
        </div>

        {/* Controls */}
        <div className="relative mb-8 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                  Historical Data
                </label>
                <CustomDropdown
                  options={historicalPeriodOptions}
                  value={historicalPeriod}
                  onChange={setHistoricalPeriod}
                  icon={BarChart3}
                  className="min-w-[160px]"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                  Forecast Period
                </label>
                <CustomDropdown
                  options={forecastPeriodOptions}
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  icon={Calendar}
                  className="min-w-[160px]"
                />
              </div>
              
              <button
                onClick={generatePredictions}
                disabled={isAnalyzing || cooldownRemaining > 0}
                className="group px-6 py-3 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>
                  {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Generate AI Forecast'}
                </span>
              </button>

              {/* Testing Button for Loading Modal */}
              {/* <button
                onClick={() => {
                  setIsAnalyzing(true);
                  setTimeout(() => {
                    setIsAnalyzing(true);
                  }, 1000); // Show loading for 3 seconds
                }}
                className="group px-4 py-2 cursor-pointer bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Test Loading Modal</span>
              </button> */}
            </div>
          </div>
        </div>

        {/* Sales Trends Chart */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Historical Sales Performance</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Last ${historicalPeriod} months`}
                </div>
                <button
                  onClick={exportHistoricalData}
                  className="group px-4 py-2 cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <FilePlus2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          
          {isLoadingHistorical ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading historical data...</p>
              </div>
            </div>
          ) : historicalSalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={historicalSalesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }} 
                  stroke="#64748b"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="#64748b"
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-2xl mb-4 inline-block">
                  <BarChart3 className="w-16 h-16 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No historical data available</p>
                <p className="text-sm text-gray-500 mt-1">Start collecting sales data to see insights here</p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Sales Performance Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <AlignEndHorizontal className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sales Performance</h2>
            </div>

        {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    {historicalPeriod === 'current' ? 'Current Month\'s Sales' : 
                     historicalPeriod === '1' ? 'Last Month\'s Sales' : 
                     'Total Sales'}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoadingHistorical ? 'Loading...' : historicalSalesData.length > 0 ? (
                    (historicalPeriod === 'current' || historicalPeriod === '1')
                      ? formatCurrency(historicalSalesData[historicalSalesData.length - 1].sales)
                      : formatCurrency(historicalSalesData.reduce((sum, item) => sum + item.sales, 0))
                  ) : 'No data'}
                </p>
                <div className="text-sm font-extralight text-gray-900">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Total across the last ${historicalPeriod} months`}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Average Monthly Sales</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoadingHistorical ? 'Loading...' : historicalSalesData.length > 0 ? formatCurrency(historicalSalesData.reduce((sum, item) => sum + item.sales, 0) / historicalSalesData.length) : 'No data'}
                </p>
                <div className="text-sm font-extralight text-gray-900">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Average across the last ${historicalPeriod} months`}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">YTD Sales Growth</h3>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {isLoadingYtdGrowth ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : ytdGrowthData ? (
                    <span className={ytdGrowthData.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {ytdGrowthData.growthPercentage >= 0 ? '+' : ''}{ytdGrowthData.growthPercentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </p>
                <div className="text-xs text-gray-600">
                  {ytdGrowthData ? `Compared to ${ytdGrowthData.previousYear} (${ytdGrowthData.period})` : 'Compared to last year'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products Section */}
        {/* <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Top Performing Products</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                  {historicalPeriod === '1' ? 'Current month' : `Last ${historicalPeriod} months`}
                </div>
              </div>
            </div>

            {isLoadingTopProducts ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p>Loading top products...</p>
                </div>
              </div>
            ) : latestTopProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestTopProducts.slice(0, 9).map((product, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          index < 6 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          'bg-gradient-to-r from-orange-600 to-red-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{product.modelNo}</h3>
                          <p className="text-xs text-gray-500">{product.categoryName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-600">Rank #{product.ranking}</div>
                        <div className="text-xs text-gray-500">Category: {product.categoryId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        product.categoryName === 'Electronics' ? 'bg-blue-500' :
                        product.categoryName === 'Tools' ? 'bg-green-500' :
                        product.categoryName === 'Gadgets' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}></div>
                      <span className="text-xs text-gray-600 capitalize">{product.categoryName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 rounded-2xl mb-4 inline-block">
                    <TrendingUp className="w-16 h-16 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">No product data available</p>
                  <p className="text-sm text-gray-500 mt-1">Start collecting sales data to see top products here</p>
                </div>
              </div>
            )}
          </div>
        </div> */}

        {/* Full Screen Loading Modal */}
        <LoadingModal isOpen={isAnalyzing}>
          <div className="text-center max-w-md mx-auto">
            {/* Clean Data Analysis Icon */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Analyzing Sales Data
            </h2>
            <p className="text-gray-600 mb-8 text-base leading-relaxed">
              Our AI is processing your historical sales data to generate accurate forecasts and insights.
            </p>

            {/* Clean Progress Steps */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Processing historical trends</p>
                  <p className="text-sm text-gray-600">Analyzing past sales patterns</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Applying seasonal adjustments</p>
                  <p className="text-sm text-gray-600">Adjusting for seasonal patterns</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Generating insights</p>
                  <p className="text-sm text-gray-600">Creating actionable recommendations</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>

            {/* Minimal Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out" style={{width: `${loadingProgress}%`}}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Processing data... {Math.round(loadingProgress)}%</p>
            </div>

            {/* Simple Footer */}
            <div className="text-sm text-gray-500">
              This usually takes 5-10 seconds
            </div>
          </div>
        </LoadingModal>

        {/* Prediction Modal */}
        <Modal
          isOpen={!!(showModal && predictions)}
          onClose={() => setShowModal(false)}
          title={predictions ? `AI Sales Forecast - ${predictions.period}` : ''}
          icon={Brain}
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportPredictionData}
                  disabled={predictions?.error || !predictions?.monthlyBreakdown}
                  className="px-4 py-2 bg-green-600 cursor-pointer text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <FileChartColumn className="w-4 h-4" />
                  Export Forecast
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border cursor-pointer border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          {predictions && (
            <>
              {/* Summary Cards */}
              {predictions.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">AI Forecast Error</h3>
                    </div>
                  </div>
                  <div className="text-sm text-red-700">
                    <p className="mb-2">{predictions.error}</p>
                    {predictions.details && (
                      <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                        {predictions.details}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Total Predicted Sales</h3>
                    <p className="text-2xl font-bold">{formatCurrency(predictions.totalPredicted)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Monthly Average</h3>
                    <p className="text-2xl font-bold">{formatCurrency(predictions.avgMonthly)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Total Growth</h3>
                    <p className="text-2xl font-bold">
                      {predictions.totalGrowth > 0 ? `+${predictions.totalGrowth}%` : `${predictions.totalGrowth}%`}
                    </p>
                  </div>
                </div>
              )}

              {/* Monthly Breakdown Chart */}
              {!predictions.error && (
                <>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={predictions.monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        stroke="#64748b"
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Predicted Sales']}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#3b82f6' }}
                        activeDot={{ r: 7, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              {/* Monthly Sales Forecast Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Forecast</h3>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Month-over-Month (MoM) calculations are based on <strong>Predicted Sales</strong> to show sales volume growth trends.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Predicted Sales</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Monthly Average</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Month over Month (MoM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.monthlyBreakdown.map((item, index) => {
                        const momChange = item.momChange || 0;

                        return (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.predicted)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(predictions.avgMonthly)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                momChange > 0 ? 'bg-green-100 text-green-800' :
                                momChange < 0 ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {momChange > 0 ? '+' : ''}{momChange}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}

              {/* Top Products by Month */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expected Products by Month</h3>
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>AI-Predicted:</strong> These products are expected to be the top performers for each forecasted month based on historical patterns.
                  </p>
                </div>

                {/* Month Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {predictions.monthlyBreakdown.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedProductTab(index)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                        selectedProductTab === index
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item.month}
                      {item.topProducts && item.topProducts.length > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          selectedProductTab === index
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {item.topProducts.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected Month Content */}
                {predictions.monthlyBreakdown[selectedProductTab] && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">

                    {predictions.monthlyBreakdown[selectedProductTab].topProducts &&
                     predictions.monthlyBreakdown[selectedProductTab].topProducts.length > 0 ? (
                      <div className="space-y-3">
                        {predictions.monthlyBreakdown[selectedProductTab].topProducts.map((product, prodIndex) => (
                          <div
                            key={prodIndex}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {prodIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-600 text-sm">Model: <span className="font-semibold text-gray-900">{product.name}</span></p>
                                <p className="text-gray-600 text-sm">Category: <span className="font-semibold text-gray-900">{product.category}</span></p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="text-lg font-bold text-blue-600">{formatNumber(product.expectedOrders)}</p>
                              <p className="text-xs text-gray-500">expected orders</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">No specific product predictions</p>
                        <p className="text-sm mt-1">AI could not identify specific top products for this month</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Insights and Recommendations */}
              {!predictions.error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
                  <div className="space-y-3">
                    {predictions.insights.map((insight, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {predictions.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </Modal>
      </div>
    </div>
    </>
  );
};

export default SalesTrend;