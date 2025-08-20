import React from 'react';
import RoleBasedLayout from '../../Components/RoleBasedLayout';

import UnitComponent from '../../Components-Inventory/UnitTable';

const Unit = () => {
  return (
    <>
      <RoleBasedLayout />
      <UnitComponent />
    </>
  );
};

export default Unit;