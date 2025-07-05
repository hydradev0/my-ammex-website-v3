import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import ItemsComponent from '../../Components-Inventory/ItemsTable';

const Items = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <ItemsComponent />
    </>
  );
};

export default Items;