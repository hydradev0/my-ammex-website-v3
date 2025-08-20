import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import CategoriesComponent from '../../Components-Inventory/CategoryTable';

const Category = () => {
  return (
    <>
      <RoleBasedLayout />
      <CategoriesComponent />
    </>
  );
};

export default Category;