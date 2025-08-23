import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import ManageAccountTable from '../../Components-ManageAccount/ManageAccountTable';

const AccountManagement = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <ManageAccountTable/>
    </>
  );
};

export default AccountManagement;