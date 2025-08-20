import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import PurchaseOrderComponent from '../../Components-SupplierOrders/PurchaseOrderTable';   

const PurchaseOrder = () => {
  return (
    <>
      <RoleBasedLayout />
      <PurchaseOrderComponent />
    </>
  );
};

export default PurchaseOrder;