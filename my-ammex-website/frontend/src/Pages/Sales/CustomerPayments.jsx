import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';
import PaymentReceivingComponent from '../../Components-CustomerPayments/PaymentReceiving';

const CustomerPayments = () => {
  return (
    <>
      <RoleBasedLayout />
      <PaymentReceivingComponent />
    </>
  );
};

export default CustomerPayments;

