import React, { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import AnalyticsModal from './AnalyticsModal';
import { itemsData, generateLargeItemsData } from '../data/itemsData';

const SmartReorder = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useLargeDataset, setUseLargeDataset] = useState(false);

  // Use large dataset for testing pagination (toggle this for testing)
  const dataSource = useLargeDataset ? generateLargeItemsData(150) : itemsData;

  // Dynamically generate product data from itemsData
  const products = dataSource.map((item, idx) => {
    const monthlySales = item.unitsSold !== undefined ? item.unitsSold : Math.floor(item.quantity * 0.8); // Use unitsSold if present
    const minReorderPoint = item.minLevel;
    const suggestedReorderPoint = Math.ceil(monthlySales * 0.5); // AI recommendation: 50% of monthly sales
    let status = 'GOOD';
    let statusColor = 'green';
    let message = 'Stock level is healthy, no immediate action needed';
    if (item.quantity <= minReorderPoint) {
      status = 'CRITICAL';
      statusColor = 'red';
      message = 'Critical stock level! Immediate reorder required to prevent stockout';
    } else if (item.quantity <= minReorderPoint * 1.5) {
      status = 'WARNING';
      statusColor = 'yellow';
      message = 'Stock level is getting low, consider reordering soon';
    }
    return {
      id: idx + 1,
      name: item.itemName,
      currentStock: item.quantity,
      monthlySales,
      minReorderPoint,
      suggestedReorderPoint,
      status,
      statusColor,
      message
    };
  });

  // Sort products by priority (critical > warning > good)
  const sortedProducts = [...products].sort((a, b) => {
    const priority = { 'red': 0, 'yellow': 1, 'green': 2 };
    return priority[a.statusColor] - priority[b.statusColor];
  });

  const RecommendationItem = ({ product }) => (
    <div className={`
      ${product.statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-500' : ''}
      ${product.statusColor === 'green' ? 'bg-green-50 border-green-500' : ''}
      ${product.statusColor === 'red' ? 'bg-red-50 border-red-500' : ''}
      border-l-4 rounded-lg p-4
    `}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-lg">{product.name}</h4>
        </div>
        <span className={`
          text-xs px-2 py-1 rounded-full font-medium
          ${product.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
          ${product.statusColor === 'green' ? 'bg-green-100 text-green-700' : ''}
          ${product.statusColor === 'red' ? 'bg-red-100 text-red-700' : ''}
        `}>
          {product.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
        <div>Current Stock: <span className="font-medium text-gray-900 text-lg">{product.currentStock}</span></div>
        <div>Monthly Sales: <span className="font-medium text-gray-900 text-lg">{product.monthlySales}</span></div>
      </div>

      <div className="bg-white p-3 rounded border border-gray-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-600">Reorder Point</span>
          <div className="flex items-center gap-2">
            <span className="text-md text-gray-500 line-through">Min: {product.minReorderPoint}</span>
            <span className="text-md font-medium text-blue-600">→ Suggested: {product.suggestedReorderPoint}</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {product.message}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button className="flex-1 bg-blue-600 text-white text-md py-2 px-3 rounded hover:bg-blue-700 transition-colors">
          Apply Suggestion
        </button>
        <button className="px-3 py-2 text-md text-gray-600 hover:text-gray-800 transition-colors">
          Skip
        </button>
      </div>
    </div>
  );

  // Render function for paginated items
  const renderRecommendationItem = (product, index) => (
    <RecommendationItem key={`${product.id}-${index}`} product={product} />
  );

  const RecommendationsContent = () => (
    <div className="space-y-4">
      {sortedProducts.map((product) => (
        <RecommendationItem key={product.id} product={product} />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-5 flex flex-col gap-6 min-h-[500px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-400"/>Smart Reorder Recommendations
        </h3>
        
        {/* Toggle for testing large datasets */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Test with 150 items:</span>
          <button
            onClick={() => setUseLargeDataset(!useLargeDataset)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              useLargeDataset 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {useLargeDataset ? 'Large Dataset' : 'Small Dataset'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2">
        {sortedProducts.slice(0, 3).map((product) => (
          <RecommendationItem key={product.id} product={product} />
        ))}
      </div>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-bold mt-2"
      >
        View All Recommendations
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Modal */}
      <AnalyticsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="All Reorder Recommendations"
        items={sortedProducts}
        itemsPerPage={6}
        renderItem={renderRecommendationItem}
        showPagination={true}
      >
        <RecommendationsContent />
      </AnalyticsModal>
    </div>
  );
};

export default SmartReorder; 