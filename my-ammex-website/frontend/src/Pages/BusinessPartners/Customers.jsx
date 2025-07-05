import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import CustomerTableComponent from '../../Components-Records/CustomerTable';

const Customers = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <CustomerTableComponent/>
    </>
  );
};

export default Customers;