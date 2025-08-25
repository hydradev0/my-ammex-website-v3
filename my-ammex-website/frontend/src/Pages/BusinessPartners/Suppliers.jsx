import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import SupplierTableComponent from '../../Components-Records/SupplierTable';

const Suppliers = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <SupplierTableComponent/>
    </>
  );
};

export default Suppliers;

