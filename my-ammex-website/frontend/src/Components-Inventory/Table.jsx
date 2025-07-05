import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

const Table = ({
  data,
  title,
  onRowClick,
  pagination = true,
  itemsPerPage = 10,
  actions,
  customRowAction,
  className = '',
  emptyMessage = 'No data available',
  alternateRowColors = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle sorting
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = pagination 
    ? sortedData.slice(startIndex, startIndex + itemsPerPage)
    : sortedData;

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={`table-container w-full ${className}`}>
      {title && <h2 className="text-xl font-bold my-4">{title}</h2>}
      
      <div className="overflow-x-auto bg-white rounded-md shadow-md">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-md font-medium text-white uppercase tracking-wider w-[90%]"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortConfig.key === 'name' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-center text-md font-medium text-white uppercase tracking-wider w-[10%]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <tr 
                  key={item.id || rowIndex} 
                  className={`${alternateRowColors ? (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100') : 'bg-white'} 
                  ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-lg text-gray-500">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-lg text-gray-500 w-[15%]">
                    <div className="flex items-center justify-center w-full">
                      {customRowAction ? (
                        customRowAction(item)
                      ) : actions ? (
                        <div className="flex justify-center space-x-2">
                          {actions(item)}
                        </div>
                      ) : (
                        <button className="text-blue-700 hover:text-blue-800 flex items-center justify-center">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={2} 
                  className="px-4 py-3 text-center text-lg text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex justify-end items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-blue-900 text-white text-sm disabled:opacity-50 disabled:bg-gray-400"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-blue-900 text-white text-sm disabled:opacity-50 disabled:bg-gray-400"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
