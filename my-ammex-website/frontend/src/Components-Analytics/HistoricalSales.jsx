import React, { useState } from 'react';
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
  X,
  Brain,
  Loader,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const HistoricalSales = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('3');
  const [historicalPeriod, setHistoricalPeriod] = useState('6');
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  // Historical sales data (last 12 months)
  const allHistoricalData = [
    { month: 'Oct 2023', sales: 420000, trend: 'stable' },
    { month: 'Nov 2023', sales: 480000, trend: 'up' },
    { month: 'Dec 2023', sales: 620000, trend: 'up' },
    { month: 'Jan 2024', sales: 380000, trend: 'down' },
    { month: 'Feb 2024', sales: 450000, trend: 'up' },
    { month: 'Mar 2024', sales: 520000, trend: 'up' },
    { month: 'Apr 2024', sales: 490000, trend: 'down' },
    { month: 'May 2024', sales: 580000, trend: 'up' },
    { month: 'Jun 2024', sales: 640000, trend: 'up' },
    { month: 'Jul 2024', sales: 695000, trend: 'up' },
    { month: 'Aug 2024', sales: 720000, trend: 'up' },
    { month: 'Sep 2024', sales: 750000, trend: 'up' }
  ];

  // Filter historical data based on selected period
  const getHistoricalData = () => {
    const periods = parseInt(historicalPeriod);
    return allHistoricalData.slice(-periods);
  };

  const historicalSalesData = getHistoricalData();

  // Mock prediction generator (replace with actual API call)
  const generatePredictions = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const periodInt = parseInt(selectedPeriod);
    const baseValue = historicalSalesData[historicalSalesData.length - 1].sales; // Last month's sales
    const months1 = ['Oct 2024'];
    const months3 = ['Oct 2024', 'Nov 2024', 'Dec 2024'];
    const months6 = ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];
    
    const selectedMonths = periodInt === 1 ? months1 : periodInt === 3 ? months3 : months6;
    
    const mockPredictions = {
      period: `${periodInt} months`,
      totalPredicted: periodInt === 1 ? 2850000 : periodInt === 3 ? 2850000 : 5200000,
      avgMonthly: periodInt === 1 ? 950000 : periodInt === 3 ? 950000 : 867000,
      confidence: periodInt === 1 ? 92 : periodInt === 3 ? 92 : 85,
      growthRate: periodInt === 1 ? 15.2 : periodInt === 3 ? 15.2 : 12.8,
      monthlyBreakdown: selectedMonths.map((month, index) => {
        const seasonalMultiplier = month.includes('Dec') ? 1.4 : 
                                 month.includes('Jan') ? 0.7 : 
                                 month.includes('Feb') ? 0.85 : 1.1;
        const trendGrowth = 1 + (index * 0.05);
        const predictedValue = Math.round(baseValue * seasonalMultiplier * trendGrowth);
        
        return {
          month,
          predicted: predictedValue,
          confidence: Math.max(85 - index * 2, 75),
          trend: predictedValue > (index === 0 ? baseValue : 0) ? 'up' : 'down'
        };
      }),
      insights: [
        periodInt === 3 
          ? "Strong holiday season expected with 40% December boost"
          : periodInt === 2
          ? "Strong holiday season expected with 40% December boost"
          : periodInt === 3
          ? "Strong holiday season expected with 40% December boost"
          : "Steady growth anticipated with seasonal variations",
        `Average monthly growth rate of ${periodInt === 1 ? '5.2%' : periodInt === 3 ? '5.2%' : '4.1%'} projected`,
        "Q4 performance likely to exceed historical averages",
        
      ],
      recommendations: [
        periodInt === 1
          ? "Increase inventory levels for holiday season"
          : periodInt === 2
          ? "Strong holiday season expected with 40% December boost"
          : "Increase inventory levels for holiday season",
        "Focus marketing spend on high-converting channels",
        "Prepare for post-holiday dip in January if 6-month period selected",
        "Increase inventory levels for holiday season",
        "Prepare for post-holiday dip in January if 6-month period selected"
      ]
    };
    
    setPredictions(mockPredictions);
    setIsAnalyzing(false);
    setShowModal(true);
  };

  const exportHistoricalData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Sales,Trend\n"
      + historicalSalesData.map(row => `${row.month},${row.sales},${row.trend}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historical_sales_${historicalPeriod}months.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPredictionData = () => {
    if (!predictions) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Predicted Sales,Confidence %,Trend\n"
      + predictions.monthlyBreakdown.map(row => 
          `${row.month},${row.predicted},${row.confidence},${row.trend}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_forecast_${predictions.period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
              Sales: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const TrendIndicator = ({ trend, value }) => (
    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
      trend === 'up' 
        ? 'bg-green-100 text-green-700' 
        : trend === 'down' 
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700'
    }`}>
      {trend === 'up' && <ArrowUp className="w-3 h-3" />}
      {trend === 'down' && <ArrowDown className="w-3 h-3" />}
      {formatCurrency(value)}
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Sales Forecast & Trends
          </h1>
          <p className="text-gray-600">Analyze historical sales data and generate AI-powered forecasts</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Historical Data:
              </label>
              <select
                value={historicalPeriod}
                onChange={(e) => setHistoricalPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Forecast Period:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
              </select>
            </div>
            
            <button
              onClick={generatePredictions}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-200"
            >
              <Brain className="w-4 h-4" />
              Analyze
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Analyzing Sales Data...</p>
                <p className="text-sm text-yellow-700">This may take a moment. Please wait while we generate your forecast.</p>
              </div>
            </div>
          </div>
        )}

        {/* Sales Trends Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Historical Sales Performance</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Last {historicalPeriod} months</div>
              <button
                onClick={exportHistoricalData}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
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
        </div>

        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Current Month</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(historicalSalesData[historicalSalesData.length - 1].sales)}
            </p>
            <TrendIndicator 
              trend="up" 
              value={historicalSalesData[historicalSalesData.length - 1].sales - historicalSalesData[historicalSalesData.length - 2]?.sales || 0}
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Average Monthly</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(historicalSalesData.reduce((sum, item) => sum + item.sales, 0) / historicalSalesData.length)}
            </p>
            <div className="text-xs text-gray-600">Last {historicalPeriod} months</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">YTD Growth</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-2">+18.5%</p>
            <div className="text-xs text-gray-600">Compared to last year</div>
          </div>
        </div>

        {/* Prediction Modal */}
        {showModal && predictions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-blue-600" />
                  AI Sales Forecast - {predictions.period}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Total Predicted</h3>
                    <p className="text-2xl font-bold">{formatCurrency(predictions.totalPredicted)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Monthly Average</h3>
                    <p className="text-2xl font-bold">{formatCurrency(predictions.avgMonthly)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-medium opacity-90">Confidence</h3>
                    <p className="text-2xl font-bold">{predictions.confidence}%</p>
                  </div>
                </div>

                {/* Monthly Breakdown Chart */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={predictions.monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        stroke="#64748b"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
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

                {/* Monthly Details Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Predictions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Predicted Sales</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Confidence</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.monthlyBreakdown.map((item, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.predicted)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {item.confidence}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <TrendIndicator trend={item.trend} value={item.predicted} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Insights & Recommendations */}
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
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-between items-center bg-gray-50 rounded-b-xl">
                <div className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportPredictionData}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Export Forecast
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalSales;