import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import CustomerOrdersComponent from '../../Components-CustomerOrders/HandleOrders';

const CustomerOrders = () => {
  return (
    <>
      <RoleBasedLayout />
      <CustomerOrdersComponent />
    </>
  );
};

export default CustomerOrders;