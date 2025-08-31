import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import ProcessedInvoices from '../../Components-Invoices/ProcessedInvoices';

const Invoices = () => {
  return (
    <>
      <RoleBasedLayout />
      <ProcessedInvoices />
    </>
  );
};

export default Invoices;