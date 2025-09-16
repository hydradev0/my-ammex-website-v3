import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const DataRefreshContext = createContext();

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

export const DataRefreshProvider = ({ children }) => {
  const [refreshTriggers, setRefreshTriggers] = useState({});

  // Trigger a refresh for specific data types
  const triggerRefresh = useCallback((dataType, data = null) => {
    const timestamp = Date.now();
    setRefreshTriggers(prev => ({
      ...prev,
      [dataType]: { timestamp, data }
    }));
  }, []);

  // Get the latest refresh trigger for a data type
  const getRefreshTrigger = useCallback((dataType) => {
    return refreshTriggers[dataType];
  }, [refreshTriggers]);

  // Subscribe to refresh events for a specific data type
  const subscribeToRefresh = useCallback((dataType, callback) => {
    const trigger = refreshTriggers[dataType];
    if (trigger) {
      callback(trigger.data, trigger.timestamp);
    }
  }, [refreshTriggers]);

  const value = {
    triggerRefresh,
    getRefreshTrigger,
    subscribeToRefresh,
    refreshTriggers
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
};

DataRefreshProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default DataRefreshContext;
