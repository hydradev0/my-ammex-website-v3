import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import CustomerOrdersComponent from '../../Components-CustomerOrders/HandleOrders';

const CustomerOrders = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <CustomerOrdersComponent />
    </>
  );
};

export default CustomerOrders;