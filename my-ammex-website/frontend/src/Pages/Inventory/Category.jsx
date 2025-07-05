import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import CategoriesComponent from '../../Components-Inventory/CategoryTable';

const Category = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <CategoriesComponent />
    </>
  );
};

export default Category;