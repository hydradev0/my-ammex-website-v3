import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistoricalCustomerData, postCustomerBulkForecast } from '../services/analytics';
import * as XLSX from 'xlsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp,
  TrendingDown, 
  Calendar,
  Brain,
  Sparkles,
  ArrowUp,
  ArrowDown,
  UserPlus,
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
        className="w-full flex items-center cursor-pointer justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 transition-colors"
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
                option.value === value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
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

const CustomerPurchaseForecast = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('3');
  const [historicalPeriod, setHistoricalPeriod] = useState('3');
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [selectedMonthTab, setSelectedMonthTab] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Historical customer data (fetched from backend)
  const [allHistoricalData, setAllHistoricalData] = useState([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(true);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter historical data based on selected period
  const getHistoricalData = () => {
    if (historicalPeriod === 'current') {
      // For current month, show only the most recent month
      return allHistoricalData.slice(-1);
    }
    const periods = parseInt(historicalPeriod);
    return allHistoricalData.slice(-periods);
  };

  const historicalCustomerData = getHistoricalData();

  // Check cooldown status on component mount and periodically
  useEffect(() => {
    const checkCooldown = () => {
      const lastSuccessTime = localStorage.getItem('lastCustomerForecastSuccess');
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
        const res = await getHistoricalCustomerData(months);
        if (!isMounted) return;
        // Backend returns items like { month: '2024-09-01', newCustomers: 1950, bulkOrdersCount: 120, bulkOrdersAmount: 250000 }
        // Map to UI-friendly labels like 'Sep 2024'
        const mapped = (res?.data || []).map((d) => {
          const dt = new Date(d.month);
          const label = dt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          return { 
            month: label, 
            newCustomers: d.newCustomers, 
            bulkOrdersCount: d.bulkOrdersCount, 
            bulkOrdersAmount: d.bulkOrdersAmount 
          };
        });
        setAllHistoricalData(mapped);
      } catch (e) {
        console.error('Failed to fetch historical customer data:', e);
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
    { value: '12', label: 'Last 12 Months' }
  ];

  const forecastPeriodOptions = [
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' }
  ];

  // Real prediction generator
  const generatePredictions = async () => {
    // Check cooldown period (10 seconds = 10000ms)
    const lastSuccessTime = localStorage.getItem('lastCustomerForecastSuccess');
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
      const res = await postCustomerBulkForecast({ period: periodInt });
      const f = res?.forecast;
      if (f?.monthlyBreakdown?.length) {
        const monthly = f.monthlyBreakdown.map((p) => ({
          month: p.month, // backend labels months
          bulkOrdersCount: Math.round(p.bulkOrdersCount || 0),
          bulkOrdersAmount: Math.round(p.bulkOrdersAmount || 0),
          momChange: p.momChange || 0,
          topCustomers: p.topCustomers || []
        }));
        const payload = {
          period: `${periodInt} months`,
          totalGrowth: f.totalGrowth || 0,
          monthlyBreakdown: monthly,
          insights: f.insights || [],
          recommendations: f.recommendations || []
        };
        setPredictions(payload);
        
        // Select first month by default
        setSelectedMonthTab(0);
        
        // Only set cooldown on successful prediction
        localStorage.setItem('lastCustomerForecastSuccess', Date.now().toString());
      } else {
        throw new Error('Empty forecast');
      }
    } catch (err) {
      console.error('Customer bulk forecast failed:', err);
      
      // Parse error response for better user feedback
      let errorMessage = 'Failed to generate customer bulk forecast.';
      let errorDetails = err.message || 'Unknown error occurred';
      let suggestions = [
        'Check OpenRouter API configuration',
        'Verify backend connectivity',
        'Ensure customer data is available'
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
        totalGrowth: 0,
        monthlyBreakdown: [],
        topBulkCustomers: [],
        insights: ['AI customer forecasting service unavailable'],
        recommendations: suggestions
      });
    } finally {
      setIsAnalyzing(false);
      setShowModal(true);
    }
  };

  const exportHistoricalData = () => {
    const allData = [];
    
    // Header
    allData.push(['CUSTOMER PURCHASE TREND REPORT']);
    allData.push(['']);
    allData.push([`Historical Period: ${historicalPeriod === 'current' ? 'Current Month' : historicalPeriod === '1' ? 'Last Month' : `Last ${historicalPeriod} Months`}`]);
    allData.push(['']);
    
    // Historical Customer Data
    allData.push(['HISTORICAL CUSTOMER DATA']);
    allData.push(['']);
    allData.push(['Month', 'New Customers', 'Bulk Orders Count', 'Bulk Orders Amount']);
    
    historicalCustomerData.forEach(row => {
      allData.push([row.month, row.newCustomers, row.bulkOrdersCount, row.bulkOrdersAmount]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set tight column widths for better cross-platform compatibility
    ws['!cols'] = [
      { wch: 15 }, // Month
      { wch: 15 }, // New Customers
      { wch: 18 }, // Bulk Orders Count
      { wch: 18 }  // Bulk Orders Amount
    ];

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Data');
    
    const filename = `customer_data_${historicalPeriod}months.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportPredictionData = () => {
    if (!predictions || !predictions.monthlyBreakdown) return;
    
    const allData = [];
    
    // Header
    allData.push(['CUSTOMER PURCHASE FORECAST REPORT']);
    allData.push(['']);
    allData.push([`Forecast Period: ${predictions.period}`]);
    allData.push(['']);
    
    // Summary Section
    allData.push(['FORECAST SUMMARY']);
    allData.push(['']);
    allData.push(['Metric', 'Value']);
    const totalAmount = predictions.monthlyBreakdown.reduce((sum, m) => sum + (m.bulkOrdersAmount || 0), 0);
    const avgAmount = predictions.monthlyBreakdown.length ? Math.round(totalAmount / predictions.monthlyBreakdown.length) : 0;
    allData.push(['Total Predicted Amount', `₱${totalAmount.toLocaleString()}`]);
    allData.push(['Average Monthly Amount', `₱${avgAmount.toLocaleString()}`]);
    allData.push(['Total Growth', `${predictions.totalGrowth > 0 ? '+' : ''}${predictions.totalGrowth}%`]);
    
    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Monthly Breakdown
    allData.push(['MONTHLY BREAKDOWN']);
    allData.push(['']);
    allData.push(['Month', 'Bulk Orders Count', 'Bulk Orders Amount', 'Avg Order Size', 'MoM Change']);
    
    predictions.monthlyBreakdown.forEach(row => {
      const avgSize = row.bulkOrdersCount ? Math.round(row.bulkOrdersAmount / row.bulkOrdersCount) : 0;
      allData.push([row.month, row.bulkOrdersCount, row.bulkOrdersAmount, avgSize, `${row.momChange}%`]);
    });

    // Spacing
    allData.push(['']);
    allData.push(['']);
    
    // Top Customers by Month
    allData.push(['TOP CUSTOMERS BY MONTH']);
    allData.push(['']);
    
    predictions.monthlyBreakdown.forEach((row, monthIndex) => {
      if (row.topCustomers && row.topCustomers.length > 0) {
        allData.push(['']);
        allData.push([`${row.month} - Top Customers`]);
        allData.push(['Rank', 'Customer Name', 'Model No.', 'Expected Amount']);
        
        row.topCustomers.forEach((customer, index) => {
          allData.push([index + 1, customer.name, customer.modelNo, customer.expectedAmount]);
        });
      }
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set tight column widths for better cross-platform compatibility
    ws['!cols'] = [
      { wch: 18 }, // Month/Metric/Rank
      { wch: 20 }, // Customer Name/Value
      { wch: 18 }, // Model No./Count
      { wch: 18 }, // Expected Amount/Amount
      { wch: 12 }  // MoM Change
    ];

    // Create workbook and write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Forecast');
    
    const filename = `customer_forecast_${predictions.period.replace(' ', '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
    }).format(value);
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes('Value') ? formatCurrency(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // const TrendIndicator = ({ trend, value, isCurrency = false , name}) => (
  //   <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
  //     trend === 'up' 
  //       ? 'bg-green-100 text-green-700' 
  //       : trend === 'down' 
  //       ? 'bg-red-100 text-red-700'
  //       : 'bg-gray-100 text-gray-700'
  //   }`}>
  //     {trend === 'up' && <ArrowUp className="w-3 h-3" />}
  //     {trend === 'down' && <ArrowDown className="w-3 h-3" />}
  //     {isCurrency ? formatCurrency(value) : formatNumber(value)} {name}
  //   </div>
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
              className="group flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-white hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-xl border border-gray-200 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2 -mt-17">
            <Users className="w-8 h-8 text-purple-600" />
            Customer Purchase Forecast
          </h1>
          <p className="text-gray-600 -mt-2">Analyze customer acquisition trends and predict future purchase behavior</p>
        </div>

        {/* Controls */}
        <div className="relative mb-8 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl blur-xl"></div>
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
                  icon={Users}
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
                className="group px-6 py-3 cursor-pointer bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
                  }, 3000); // Show loading for 3 seconds
                }}
                className="group px-4 py-2 cursor-pointer bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Test Loading Modal</span>
              </button> */}
            </div>
          </div>
        </div>

        {/* Full Screen Loading Modal */}
        <LoadingModal isOpen={isAnalyzing}>
          <div className="text-center max-w-md mx-auto">
            {/* Clean Customer Analysis Icon */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Analyzing Customer Data
            </h2>
            <p className="text-gray-600 mb-8 text-base leading-relaxed">
              Our AI is processing your customer acquisition patterns to generate accurate forecasts and insights.
            </p>

            {/* Clean Progress Steps */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Processing customer acquisition trends</p>
                  <p className="text-sm text-gray-600">Analyzing customer growth patterns</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Analyzing purchase behavior patterns</p>
                  <p className="text-sm text-gray-600">Understanding buying trends</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-fuchsia-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Generating customer insights</p>
                  <p className="text-sm text-gray-600">Creating actionable recommendations</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>

            {/* Minimal Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300 ease-out" style={{width: `${loadingProgress}%`}}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Processing data... {Math.round(loadingProgress)}%</p>
            </div>

            {/* Simple Footer */}
            <div className="text-sm text-gray-500">
              This usually takes 10-20 seconds
            </div>
          </div>
        </LoadingModal>

        {/* Customer Trends Chart */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Historical Customer Performance</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Last ${historicalPeriod} months`}
                </div>
                <button
                  onClick={exportHistoricalData}
                  disabled={isLoadingHistorical || historicalCustomerData.length === 0}
                  className="group px-4 py-2 cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <FilePlus2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          
          {isLoadingHistorical ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p>Loading customer data...</p>
              </div>
            </div>
          ) : historicalCustomerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={historicalCustomerData}>
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
                  yAxisId="left" 
                  tick={{ fontSize: 12 }} 
                  stroke="#64748b"
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 12 }} 
                  stroke="#64748b"
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `₱${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `₱${(value / 1000).toFixed(0)}K`;
                    } else {
                      return `₱${value}`;
                    }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bulkOrdersCount"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Bulk Orders Count"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bulkOrdersAmount"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Bulk Orders Amount"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-2xl mb-4 inline-block">
                  <Users className="w-16 h-16 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No customer data available</p>
                <p className="text-sm text-gray-500 mt-1">Start collecting customer data to see insights here</p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Customer Performance Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <AlignEndHorizontal className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Customer's Performance</h2>
            </div>

            {/* Customer Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    {historicalPeriod === 'current' ? 'Current Month\'s Avg Order Size' : 
                     historicalPeriod === '1' ? 'Last Month\'s Avg Order Size' : 
                     'Avg Bulk Order Size'}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoadingHistorical ? 'Loading...' : historicalCustomerData.length > 0 ? (
                    (() => {
                      const totalCount = historicalCustomerData.reduce((sum, item) => sum + (item.bulkOrdersCount || 0), 0);
                      const totalAmount = historicalCustomerData.reduce((sum, item) => sum + (item.bulkOrdersAmount || 0), 0);
                      const avg = totalCount ? (totalAmount / totalCount) : 0;
                      return formatCurrency(Math.round(avg));
                    })()
                  ) : 'No data'}
                </p>
                <div className="text-sm font-extralight text-gray-900">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Average across the last ${historicalPeriod} months`}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    {historicalPeriod === 'current' ? 'Current Month\'s Orders Count' : 
                     historicalPeriod === '1' ? 'Last Month\'s Orders Count' : 
                     'Total Bulk Orders Count'}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoadingHistorical ? 'Loading...' : historicalCustomerData.length > 0 ? formatNumber(historicalCustomerData.reduce((sum, item) => sum + item.bulkOrdersCount, 0)) : 'No data'}
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
                  <h3 className="font-semibold text-gray-900">
                    {historicalPeriod === 'current' ? 'Current Month\'s Orders Amount' : 
                     historicalPeriod === '1' ? 'Last Month\'s Orders Amount' : 
                     'Total Bulk Orders Amount'}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {isLoadingHistorical ? 'Loading...' : historicalCustomerData.length > 0 ? formatCurrency(historicalCustomerData.reduce((sum, item) => sum + item.bulkOrdersAmount, 0)) : 'No data'}
                </p>
                <div className="text-sm font-extralight text-gray-900">
                  {historicalPeriod === 'current' ? 'Current month' : 
                   historicalPeriod === '1' ? 'Last month' : 
                   `Total across the last ${historicalPeriod} months`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Modal */}
        <Modal
          isOpen={!!(showModal && predictions)}
          onClose={() => setShowModal(false)}
          title={predictions ? `AI Customer Purchase Forecast - ${predictions.period}` : ''}
          icon={Brain}
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportPredictionData}
                  className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileChartColumn className="w-4 h-4" />
                  Export Forecast
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
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
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Predicted Bulk Amount</h3>
                  <p className="text-2xl font-bold">{
                    (() => {
                      const totalAmount = predictions.monthlyBreakdown.reduce((s, m) => s + (m.bulkOrdersAmount || 0), 0);
                      return formatCurrency(totalAmount);
                    })()
                  }</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Monthly Avg Amount</h3>
                  <p className="text-2xl font-bold">{
                    (() => {
                      const totalAmount = predictions.monthlyBreakdown.reduce((s, m) => s + (m.bulkOrdersAmount || 0), 0);
                      const avg = predictions.monthlyBreakdown.length ? Math.round(totalAmount / predictions.monthlyBreakdown.length) : 0;
                      return formatCurrency(avg);
                    })()
                  }</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Total Growth</h3>
                  <p className="text-sm text-gray-200">vs last {selectedPeriod} months (includes current month)</p>
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
                  <ComposedChart data={predictions.monthlyBreakdown}>
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
                      yAxisId="left" 
                      tick={{ fontSize: 12 }} 
                      stroke="#64748b"
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 12 }} 
                      stroke="#64748b"
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `₱${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `₱${(value / 1000).toFixed(0)}K`;
                        } else {
                          return `₱${value}`;
                        }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="bulkOrdersCount"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Bulk Orders Count"
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bulkOrdersAmount"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      name="Bulk Orders Amount"
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Predictions Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Predictions</h3>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Month-over-Month (MoM) calculations are based on <strong>Bulk Orders Amount</strong> to show volume growth trends.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Bulk Orders Count</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Avg Bulk Order Size</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Bulk Orders Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Month over Month (MoM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.monthlyBreakdown.map((item, index) => {
                        const momChange = item.momChange || 0;
                        const avgSize = item.bulkOrdersCount ? Math.round(item.bulkOrdersAmount / item.bulkOrdersCount) : 0;
                        
                        return (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatNumber(item.bulkOrdersCount)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(avgSize)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.bulkOrdersAmount)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                momChange > 0 ? 'bg-green-100 text-green-800' : 
                                momChange < 0 ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {momChange > 0 ? '+' : ''}{momChange}%
                                {momChange > 0 ? <TrendingUp className="w-3 h-3" /> : momChange < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Customers by Month */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expected Customers by Month</h3>
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>AI-Predicted:</strong> These customers are expected to be the top bulk buyers for each forecasted month based on historical patterns.
                  </p>
                </div>

                {/* Month Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {predictions.monthlyBreakdown.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMonthTab(index)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                        selectedMonthTab === index
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item.month}
                      {item.topCustomers && item.topCustomers.length > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          selectedMonthTab === index
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {item.topCustomers.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected Month Content */}
                {predictions.monthlyBreakdown[selectedMonthTab] && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">

                    {predictions.monthlyBreakdown[selectedMonthTab].topCustomers && 
                     predictions.monthlyBreakdown[selectedMonthTab].topCustomers.length > 0 ? (
                      <div className="space-y-3">
                        {predictions.monthlyBreakdown[selectedMonthTab].topCustomers.map((customer, custIndex) => (
                          <div 
                            key={custIndex} 
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {custIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600">Customer: <span className="font-semibold text-gray-900">{customer.name}</span></p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-600">Model: <span className="font-semibold text-gray-900">{customer.modelNo}</span></span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="text-lg font-bold text-purple-600">{formatCurrency(customer.expectedAmount)}</p>
                              <p className="text-xs text-gray-500">expected sales</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">No specific customer predictions</p>
                        <p className="text-sm mt-1">AI could not identify specific top customers for this month</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Insights and Recommendations */}
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
                </>
              )}
            </>
          )}
        </Modal>
      </div>
    </div>
    </>
  );
};

export default CustomerPurchaseForecast;