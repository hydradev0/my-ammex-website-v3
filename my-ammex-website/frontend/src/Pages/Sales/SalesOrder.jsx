import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import SalesOrderComponent from '../../Components-CustomerOrders/SalesOrderTable';

const SalesOrder = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <SalesOrderComponent />
    </>
  );
};

export default SalesOrder;