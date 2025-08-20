import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import Categories from '../../Components-Inventory/CategoryTable';
import Items from '../../Components-Inventory/ItemsTable';
import Units from '../../Components-Inventory/UnitTable';
import { getCategories, getUnits } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';

function Inventory() {
  const { user } = useAuth();
  const role = user?.role;
  const isSalesReadOnly = role === 'Sales Marketing';
  // Shared state for categories and units
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories and units in parallel
        const [categoriesResponse, unitsResponse] = await Promise.all([
          getCategories(),
          getUnits()
        ]);

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }
        
        if (unitsResponse.success) {
          setUnits(unitsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load inventory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle category updates
  const handleCategoryUpdate = (updatedCategories) => {
    setCategories(updatedCategories);
  };

  // Handle unit updates
  const handleUnitUpdate = (updatedUnits) => {
    setUnits(updatedUnits);
  };

  if (loading) {
    return (
      <>
        <RoleBasedLayout />
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <RoleBasedLayout />
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded"
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
      <RoleBasedLayout />
      <Routes>
        {isSalesReadOnly ? (
          <>
            <Route 
              path="/Items" 
              element={
                <Items 
                  categories={categories} 
                  setCategories={handleCategoryUpdate}
                  units={units}
                />
              } 
            />
            {/* Redirect any other inventory paths to Items */}
            <Route path="*" element={<Navigate to="/Inventory/Items" replace />} />
          </>
        ) : (
          <>
            <Route 
              path="/Category" 
              element={
                <Categories 
                  categories={categories} 
                  setCategories={handleCategoryUpdate} 
                />
              } 
            />
            <Route 
              path="/Items" 
              element={
                <Items 
                  categories={categories} 
                  setCategories={handleCategoryUpdate}
                  units={units}
                />
              } 
            />
            <Route 
              path="/Unit" 
              element={
                <Units 
                  units={units}
                  setUnits={handleUnitUpdate}
                />
              } 
            />
          </>
        )}
      </Routes>
    </>
  );
}

export default Inventory; 