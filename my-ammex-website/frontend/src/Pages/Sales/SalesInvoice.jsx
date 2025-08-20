import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import SalesInvoiceComponent from '../../Components-CustomerOrders/SalesInvoiceTable';

const SalesInvoice = () => {
  return (
    <>
      <RoleBasedLayout />
      <SalesInvoiceComponent />
    </>
  );
};

export default SalesInvoice;