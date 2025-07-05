import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import SalesQuotesComponent from '../../Components-CustomerOrders/SalesQuotesTable';

const SalesQuotes = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <SalesQuotesComponent />
    </>
  );
};

export default SalesQuotes;