import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import PurchaseOrderComponent from '../../Components-SupplierOrders/PurchaseOrderTable';   

const PurchaseOrder = () => {
  return (
    <>
      <TopBar /> 
      <Navigation />
      <PurchaseOrderComponent />
    </>
  );
};

export default PurchaseOrder;