import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import EmployeeManagementComponent from '../../Components-ManageEmployee/ManageEmployeeTable';

const EmployeeManagement = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <EmployeeManagementComponent/>
    </>
  );
};

export default EmployeeManagement;