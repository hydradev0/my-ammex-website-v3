import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import PurchaseQuotesComponent from '../../Components-SupplierOrders/PurchaseQuotesTable';   

const PurchaseQuotes = () => {
  return (
    <>
      <TopBar /> 
      <Navigation />
      <PurchaseQuotesComponent />
    </>
  );
};

export default PurchaseQuotes;