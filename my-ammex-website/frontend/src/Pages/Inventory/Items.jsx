import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';

import ItemsComponent from '../../Components-Inventory/ItemsTable';

const Items = () => {
  return (
    <>
      <RoleBasedLayout />
      <ItemsComponent />
    </>
  );
};

export default Items;