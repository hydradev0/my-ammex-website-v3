import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import Categories from '../../Components-Inventory/CategoryTable';
import Items from '../../Components-Inventory/ItemsTable';
import Units from '../../Components-Inventory/UnitTable';

function Inventory() {
  // Shared state for categories
  const [categories, setCategories] = useState([
    { id: 1, name: 'Machine' },
    { id: 2, name: 'Marker' },
    { id: 3, name: 'Drill' },
    { id: 4, name: 'Raw Materials' },
    { id: 5, name: 'Tools' }
  ]);

  return (
    <>
      <TopBar />
      <Navigation />
      <Routes>
        <Route path="/Category" element={<Categories categories={categories} setCategories={setCategories} />} />
        <Route path="/Items" element={<Items categories={categories} setCategories={setCategories} />} />
        <Route path="/Unit" element={<Units />} />
      </Routes>
    </>
  );
}

export default Inventory; 