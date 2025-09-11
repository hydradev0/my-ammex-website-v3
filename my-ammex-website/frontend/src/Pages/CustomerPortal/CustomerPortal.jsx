import React, { useState, useEffect } from 'react';
import TopBarPortal from '../../Components-CustomerPortal/TopBarPortal';
import IndustrialPOS from '../../Components-CustomerPortal/IndustrialPOS';
import { getItems, getCategories } from '../../services/inventoryService';

const CustomerPortal = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch items and categories from inventory
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch items and categories in parallel
        const [itemsResponse, categoriesResponse] = await Promise.all([
          getItems({ limit: 100 }), // Get up to 100 items
          getCategories()
        ]);

        if (itemsResponse.success) {
          setItems(itemsResponse.data);
        }
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  if (loading) {
    return (
      <>
        <TopBarPortal />
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3182ce] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBarPortal />
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#3182ce] cursor-pointer hover:bg-[#4992d6] text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBarPortal />
      <IndustrialPOS 
        items={items} 
        categories={categories}
      />
    </>
  );
};

export default CustomerPortal; 