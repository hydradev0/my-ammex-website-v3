import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import SalesQuotesComponent from '../../Components-CustomerOrders/SalesQuotesTable';

const SalesQuotes = () => {
  return (
    <>
      <RoleBasedLayout />
      <SalesQuotesComponent />
    </>
  );
};

export default SalesQuotes;