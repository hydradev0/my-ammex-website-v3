import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout'; 
import PurchaseQuotesComponent from '../../Components-SupplierOrders/PurchaseQuotesTable';   

const PurchaseQuotes = () => {
  return (
    <>
      <RoleBasedLayout />
      <PurchaseQuotesComponent />
    </>
  );
};

export default PurchaseQuotes;