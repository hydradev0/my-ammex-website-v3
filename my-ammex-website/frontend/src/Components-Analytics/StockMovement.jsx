import React, { useState, useMemo } from 'react';
import { Truck, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import AnalyticsModal from './AnalyticsModal';
import ReorderModal from '../Components/ReorderModal';
import AdjustPricingModal from '../Components/AdjustPricingModal';
import { itemsData, generateLargeItemsData } from '../data/itemsData';

const StockMovement = () => {
  const [isWellPerformingModalOpen, setIsWellPerformingModalOpen] = useState(false);
  const [isSlowMovingModalOpen, setIsSlowMovingModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isAdjustPricingModalOpen, setIsAdjustPricingModalOpen] = useState(false);
  const [selectedPricingItem, setSelectedPricingItem] = useState(null);
  const [useLargeDataset, setUseLargeDataset] = useState(false);

  // Use large dataset for testing pagination (toggle this for testing)
  const dataSource = useLargeDataset ? generateLargeItemsData(150) : itemsData;

  // Helper: Add demo stock movement fields to itemsData for StockMovement
  const stockMovementItems = dataSource.map((item, idx) => {
    const unitsSold = item.unitsSold !== undefined ? item.unitsSold : Math.floor(item.quantity * 0.8); // estimate if not present
    return {
      id: idx + 1,
      name: item.itemName,
      category: item.category,
      currentStock: item.quantity,
      unitsSold,
      growth: item.growth || '+10%', // demo
      trend: item.trend || (unitsSold >= 20 ? 'up' : 'down'), // trend based on unitsSold
      price: item.price
    };
  });

  const wellPerforming = stockMovementItems.filter(item => item.unitsSold >= 20);
  const slowMoving = stockMovementItems.filter(item => item.unitsSold < 20);

  // Sort the data (default sorting by units sold - lowest to highest)
  const sortedWellPerforming = useMemo(() => {
    return [...wellPerforming].sort((a, b) => a.unitsSold - b.unitsSold); // Lowest to highest units sold
  }, [wellPerforming]);
  
  const sortedSlowMoving = useMemo(() => {
    return [...slowMoving].sort((a, b) => a.unitsSold - b.unitsSold); // Lowest to highest units sold
  }, [slowMoving]);

  const handleReorder = (itemId, quantity) => {
    // TODO: Implement reorder logic
    console.log(`Reordering ${quantity} units of item ${itemId}`);
    setIsReorderModalOpen(false);
    setSelectedItem(null);
  };

  const openReorderModal = (item) => {
    setSelectedItem({
      id: item.id,
      itemName: item.name,
      sku: item.id.toString(), // Using ID as SKU for demo
      currentStock: item.currentStock,
      minimumStockLevel: Math.ceil(item.unitsSold * 1.5), // Setting minimum stock level based on sales
      reorderQuantity: Math.ceil(item.unitsSold * 2), // Setting reorder quantity based on sales
      monthlySales: item.unitsSold, // Adding monthly sales data
      setReorderQuantity: (quantity) => {
        setSelectedItem(prev => ({ ...prev, reorderQuantity: quantity }));
      }
    });
    setIsReorderModalOpen(true);
  };

  const handleAdjustPricing = (itemId, pricingData) => {
    // TODO: Implement pricing adjustment logic
    console.log(`Adjusting pricing for item ${itemId}:`, pricingData);
    setIsAdjustPricingModalOpen(false);
    setSelectedPricingItem(null);
  };

  const openAdjustPricingModal = (item) => {
    setSelectedPricingItem({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unitsSold: item.unitsSold,
      growth: item.growth,
      currentPrice: item.price
    });
    setIsAdjustPricingModalOpen(true);
  };

  const StockItem = ({ item, isSlowMoving }) => {
    const stockLevel = (item.currentStock / item.unitsSold) * 100;
    const stockStatus = stockLevel > 150 ? 'high' : stockLevel < 50 ? 'low' : 'normal';
    const daysOfStock = Math.round((item.currentStock / item.unitsSold) * 30);
    
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-4 hover:shadow-md transition-shadow relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <p className="text-sm text-gray-500">{item.category}</p>
          </div>
          <div className="flex flex-col items-end">
            {!isSlowMoving && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {item.growth}
              </span>
            )}
            <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${
              stockStatus === 'high' ? 'bg-blue-100 text-blue-700' :
              stockStatus === 'low' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {stockStatus === 'high' ? 'High Stock' :
               stockStatus === 'low' ? 'Low Stock' :
               'Normal Stock'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div>
            <p className="text-sm text-gray-500">Current Stock</p>
            <p className="text-lg font-semibold text-gray-900">{item.currentStock}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Units Sold</p>
            <p className="text-lg font-semibold text-gray-900">{item.unitsSold}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Duration</p>
            <p className="text-lg font-semibold text-gray-900">{daysOfStock} days</p>
          </div>
        </div>
        {isSlowMoving && (
          <button 
            onClick={() => openAdjustPricingModal(item)}
            className="absolute bottom-4 right-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Adjust Pricing
          </button>
        )}
        {stockStatus === 'low' && !isSlowMoving && (
          <button 
            onClick={() => openReorderModal(item)}
            className="absolute bottom-4 right-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Reorder
          </button>
        )}
      </div>
    );
  };

  // Render function for well-performing items
  const renderWellPerformingItem = (item, globalIndex, context) => (
    <div key={`${item.id}-${globalIndex}`} className="space-y-4">
      <StockItem 
        item={item} 
        isSlowMoving={false} 
      />
    </div>
  );

  // Render function for slow-moving items
  const renderSlowMovingItem = (item, globalIndex, context) => (
    <div key={`${item.id}-${globalIndex}`} className="space-y-4">
      <StockItem 
        item={item} 
        isSlowMoving={true} 
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-5 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-400"/>
          <h3 className="text-xl font-semibold text-gray-800">Stock Movement</h3>
        </div>
        
        <div className="flex items-center gap-3">
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
      </div>

      {/* Well Performing Items */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500"/>
          <h4 className="font-medium text-gray-700">Well Performing Items</h4>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {sortedWellPerforming.slice(0, 2).map(item => (
            <StockItem key={item.id} item={item} isSlowMoving={false} />
          ))}
        </div>
        <button 
          onClick={() => setIsWellPerformingModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full bg-green-100 text-green-700 py-3 px-4 rounded-md hover:bg-green-200 transition-colors text-sm font-bold"
        >
          View All Well Performing
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Slow Moving Items */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-500"/>
          <h4 className="font-medium text-gray-700">Slow Moving Items</h4>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {sortedSlowMoving.slice(0, 2).map(item => (
            <StockItem key={item.id} item={item} isSlowMoving={true} />
          ))}
        </div>
        <button 
          onClick={() => setIsSlowMovingModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full bg-red-100 text-red-700 py-3 px-4 rounded-md hover:bg-red-200 transition-colors text-sm font-bold"
        >
          View All Slow Moving
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Well Performing Modal */}
      <AnalyticsModal 
        isOpen={isWellPerformingModalOpen} 
        onClose={() => setIsWellPerformingModalOpen(false)}
        title="Well Performing Items"
        items={sortedWellPerforming}
        itemsPerPage={7}
        renderItem={renderWellPerformingItem}
        showPagination={true}
        showSortFilter={true}
      >
        <div className="space-y-4">
          {sortedWellPerforming.map(item => (
            <StockItem key={item.id} item={item} isSlowMoving={false} />
          ))}
        </div>
      </AnalyticsModal>

      {/* Slow Moving Modal */}
      <AnalyticsModal 
        isOpen={isSlowMovingModalOpen} 
        onClose={() => setIsSlowMovingModalOpen(false)}
        title="Slow Moving Items"
        items={sortedSlowMoving}
        itemsPerPage={7}
        renderItem={renderSlowMovingItem}
        showPagination={true}
        showSortFilter={true}
      >
        <div className="space-y-4">
          {sortedSlowMoving.map(item => (
            <StockItem key={item.id} item={item} isSlowMoving={true} />
          ))}
        </div>
      </AnalyticsModal>

      {/* Reorder Modal */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => {
          setIsReorderModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onReorder={handleReorder}
      />

      {/* Adjust Pricing Modal */}
      <AdjustPricingModal
        isOpen={isAdjustPricingModalOpen}
        onClose={() => {
          setIsAdjustPricingModalOpen(false);
          setSelectedPricingItem(null);
        }}
        item={selectedPricingItem}
        onAdjustPricing={handleAdjustPricing}
      />
    </div>
  );
};

export default StockMovement; 