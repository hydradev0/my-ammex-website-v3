import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import SalesOrderComponent from '../../Components-CustomerOrders/SalesOrderTable';

const SalesOrder = () => {
  return (
    <>
      <RoleBasedLayout />
      <SalesOrderComponent />
    </>
  );
};

export default SalesOrder;