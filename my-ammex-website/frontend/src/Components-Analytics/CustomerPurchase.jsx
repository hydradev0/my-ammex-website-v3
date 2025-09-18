import React, { useState } from 'react';
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
  Calendar,
  Brain,
  Sparkles,
  ArrowUp,
  ArrowDown,
  UserPlus,
  FilePlus2,
  FileChartColumn
} from 'lucide-react';
import Modal from './Modal';
import LoadingModal from './LoadingModal';

const CustomerPurchaseForecast = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('3');
  const [historicalPeriod, setHistoricalPeriod] = useState('6');
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  // Historical customer data (last 12 months)
  const allHistoricalData = [
    { month: 'Oct 2023', newCustomers: 1250, totalPurchases: 3840, avgOrderValue: 185 },
    { month: 'Nov 2023', newCustomers: 1420, totalPurchases: 4320, avgOrderValue: 195 },
    { month: 'Dec 2023', newCustomers: 1850, totalPurchases: 5680, avgOrderValue: 220 },
    { month: 'Jan 2024', newCustomers: 980, totalPurchases: 2950, avgOrderValue: 165 },
    { month: 'Feb 2024', newCustomers: 1150, totalPurchases: 3480, avgOrderValue: 175 },
    { month: 'Mar 2024', newCustomers: 1380, totalPurchases: 4120, avgOrderValue: 190 },
    { month: 'Apr 2024', newCustomers: 1290, totalPurchases: 3890, avgOrderValue: 182 },
    { month: 'May 2024', newCustomers: 1520, totalPurchases: 4650, avgOrderValue: 198 },
    { month: 'Jun 2024', newCustomers: 1680, totalPurchases: 5120, avgOrderValue: 205 },
    { month: 'Jul 2024', newCustomers: 1750, totalPurchases: 5480, avgOrderValue: 210 },
    { month: 'Aug 2024', newCustomers: 1820, totalPurchases: 5680, avgOrderValue: 215 },
    { month: 'Sep 2024', newCustomers: 1950, totalPurchases: 6200, avgOrderValue: 225 }
  ];

  // Filter historical data based on selected period
  const getHistoricalData = () => {
    const periods = parseInt(historicalPeriod);
    return allHistoricalData.slice(-periods);
  };

  const historicalCustomerData = getHistoricalData();

  // Mock prediction generator
  const generatePredictions = async () => {
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const periodInt = parseInt(selectedPeriod);
    const lastMonth = historicalCustomerData[historicalCustomerData.length - 1];
    const months3 = ['Oct 2024', 'Nov 2024', 'Dec 2024'];
    const months6 = ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];
    
    const selectedMonths = periodInt === 3 ? months3 : months6;
    
    const mockPredictions = {
      period: `${periodInt} months`,
      totalNewCustomers: periodInt === 3 ? 5850 : 9200,
      totalPurchases: periodInt === 3 ? 18500 : 28400,
      avgCustomersPerMonth: periodInt === 3 ? 1950 : 1533,
      confidence: periodInt === 3 ? 91 : 84,
      customerGrowthRate: periodInt === 3 ? 12.8 : 9.5,
      monthlyBreakdown: selectedMonths.map((month, index) => {
        const seasonalMultiplier = month.includes('Dec') ? 1.3 : 
                                 month.includes('Jan') ? 0.6 : 
                                 month.includes('Feb') ? 0.8 : 1.05;
        const trendGrowth = 1 + (index * 0.04);
        const predictedCustomers = Math.round(lastMonth.newCustomers * seasonalMultiplier * trendGrowth);
        const predictedPurchases = Math.round(predictedCustomers * 3.2); // avg 3.2 purchases per new customer
        const predictedAOV = Math.round(lastMonth.avgOrderValue * (1 + index * 0.02));
        
        return {
          month,
          newCustomers: predictedCustomers,
          totalPurchases: predictedPurchases,
          avgOrderValue: predictedAOV,
          confidence: Math.max(88 - index * 2, 78),
          trend: predictedCustomers > (index === 0 ? lastMonth.newCustomers : 0) ? 'up' : 'down'
        };
      }),
      insights: [
        periodInt === 3 
          ?         "Holiday season expected to drive 30% increase in customer acquisitions"
          : "Steady customer growth with seasonal fluctuations anticipated",
        `Average customer lifetime value projected to increase by ${periodInt === 3 ? '8%' : '12%'}`,
        "Mobile channel driving majority of new customer acquisitions",
        "Average order value showing consistent upward trend"
      ],
      recommendations: [
        "Implement referral program during peak acquisition months",
        "Increase marketing budget allocation for customer acquisition",
        "Develop personalized email campaigns for new customers",
        "Optimize mobile checkout experience for better conversion",
        "Focus on upselling strategies to increase average order value"
      ],
      segments: [
        { segment: 'High Value', expectedGrowth: 15, avgSpend: 450 },
        { segment: 'Regular', expectedGrowth: 12, avgSpend: 220 },
        { segment: 'Occasional', expectedGrowth: 8, avgSpend: 120 },
        { segment: 'First-time', expectedGrowth: 25, avgSpend: 95 }
      ]
    };
    
    setPredictions(mockPredictions);
    setIsAnalyzing(false);
    setShowModal(true);
  };

  const exportHistoricalData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,New Customers,Total Purchases,Avg Order Value\n"
      + historicalCustomerData.map(row => 
          `${row.month},${row.newCustomers},${row.totalPurchases},${row.avgOrderValue}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_data_${historicalPeriod}months.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPredictionData = () => {
    if (!predictions) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Predicted New Customers,Predicted Purchases,Avg Order Value,Confidence %\n"
      + predictions.monthlyBreakdown.map(row => 
          `${row.month},${row.newCustomers},${row.totalPurchases},${row.avgOrderValue},${row.confidence}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_forecast_${predictions.period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
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
              {entry.name}: {entry.name.includes('Value') ? formatCurrency(entry.value) : formatNumber(entry.value)}
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
      {formatNumber(value)}
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            Customer Purchase Forecast
          </h1>
          <p className="text-gray-600">Analyze customer acquisition trends and predict future purchase behavior</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Historical Data:
              </label>
              <select
                value={historicalPeriod}
                onChange={(e) => setHistoricalPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
              </select>
            </div>
            
            <button
              onClick={generatePredictions}
              disabled={isAnalyzing}
              className="px-5 py-2 cursor-pointer text-lg bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center
               gap-2 font-medium transition-all duration-200"
            >
              <Brain className="w-5 h-5" />
              Analyze
            </button>
          </div>
        </div>

        {/* Full Screen Loading Modal */}
        <LoadingModal isOpen={isAnalyzing}>
          <div className="text-center">
                {/* Enhanced Loading Animation */}
                <div className="mb-8 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-30 animate-ping animation-delay-200"></div>
                  <div className="relative bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full p-4">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg font-semibold animate-pulse">Analyzing Sales Data</span>
                </div>

                <p className="text-gray-600 mb-6 text-base leading-relaxed">
                  Our AI is processing your customer acquisition patterns to generate accurate forecasts and insights.
                </p>

                {/* Enhanced Progress Steps */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20">
                    <div className="relative">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <span className="font-medium text-gray-700">Processing customer acquisition trends</span>
                    <div className="ml-auto">
                      <div className="w-6 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/10 animation-delay-300">
                    <div className="relative">
                      <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-pink-600 rounded-full animate-pulse animation-delay-500"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-30 animation-delay-500"></div>
                    </div>
                    <span className="font-medium text-gray-700">Analyzing purchase behavior patterns</span>
                    <div className="ml-auto">
                      <div className="w-6 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-600 rounded-full animate-pulse animation-delay-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/5 animation-delay-700">
                    <div className="relative">
                      <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse animation-delay-1000"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-30 animation-delay-1000"></div>
                    </div>
                    <span className="font-medium text-gray-700">Generating customer insights</span>
                    <div className="ml-auto">
                      <div className="w-6 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse animation-delay-1000"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200/50 rounded-full h-2 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 h-2 rounded-full animate-pulse shadow-lg shadow-purple-500/25" style={{width: '60%'}}></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce animation-delay-500"></div>
                  <span className="ml-2">This usually takes 2-3 seconds</span>
                </div>
          </div>
        </LoadingModal>

        {/* Customer Trends Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Historical Customer Performance</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Last {historicalPeriod} months</div>
              <button
                onClick={exportHistoricalData}
                className="px-4 py-2 cursor-pointer bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FilePlus2 className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
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
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="newCustomers" 
                fill="#8b5cf6" 
                name="New Customers"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalPurchases"
                stroke="#10b981"
                strokeWidth={3}
                name="Total Purchases"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgOrderValue"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Avg Order Value $"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">New Customers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(historicalCustomerData[historicalCustomerData.length - 1].newCustomers)}
            </p>
            <div className="text-xs text-gray-600">Current month</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Total Purchases</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatNumber(historicalCustomerData[historicalCustomerData.length - 1].totalPurchases)}
            </p>
            <div className="text-xs text-gray-600">Current month</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Avg Order Value</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(historicalCustomerData[historicalCustomerData.length - 1].avgOrderValue)}
            </p>
            <div className="text-xs text-gray-600">Current month</div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Total New Customers</h3>
                  <p className="text-2xl font-bold">{formatNumber(predictions.totalNewCustomers)}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Monthly Average</h3>
                  <p className="text-2xl font-bold">{formatNumber(predictions.avgCustomersPerMonth)}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <h3 className="text-sm font-medium opacity-90">Confidence</h3>
                  <p className="text-2xl font-bold">{predictions.confidence}%</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={predictions.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="#64748b"
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip 
                      formatter={(value) => [formatNumber(value), 'New Customers']}
                    />
                    <Line
                      type="monotone"
                      dataKey="newCustomers"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#8b5cf6' }}
                      activeDot={{ r: 7, fill: '#7c3aed' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Predictions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">New Customers</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Purchases</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Avg Order Value</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Confidence</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.monthlyBreakdown.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatNumber(item.newCustomers)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatNumber(item.totalPurchases)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatCurrency(item.avgOrderValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {item.confidence}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <TrendIndicator trend={item.trend} value={item.newCustomers} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
        </Modal>
      </div>
    </div>
  );
};

export default CustomerPurchaseForecast;