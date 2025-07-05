import React from 'react';
import TopBar from '../../Components/TopBar';
import Navigation from '../../Components/Navigation';

import UnitComponent from '../../Components-Inventory/UnitTable';

const Unit = () => {
  return (
    <>
      <TopBar />
      <Navigation />
      <UnitComponent />
    </>
  );
};

export default Unit;