import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';
import SalesInvoiceComponent from '../../Components-CustomerOrders/SalesInvoiceTable';

const SalesInvoice = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <SalesInvoiceComponent />
    </>
  );
};

export default SalesInvoice;