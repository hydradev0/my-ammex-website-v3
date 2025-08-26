// GenericTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import ActionDropdown from './ActionDropdown';
import { baseDropdownActions } from './dropdownActions';
import PaginationTable from './PaginationTable';

// Dropdown Menu Component
const DropdownMenu = ({ isOpen, onClose, item, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
      <div className="py-1">
        {actions.map(({ id, label, icon: Icon, onClick, className }) => (
          <button
            key={id}
            className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${className}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick(item);
              onClose();
            }}
          >
            {Icon && <Icon className="h-6 w-6 mr-2" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const GenericTable = ({
  data,
  columns,
  title,
  onRowClick,
  pagination = true,
  itemsPerPage = 7,
  actions,
  customRowAction,
  className = '',
  emptyMessage = 'No data available',
  alternateRowColors = true,
  dropdownActions = baseDropdownActions,
  width = 'max-w-full'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const buttonRefs = useRef({});

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
  const totalPages = Math.ceil(sortedData.length / currentItemsPerPage);
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const paginatedData = pagination 
    ? sortedData.slice(startIndex, startIndex + currentItemsPerPage)
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

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Format currency helper function (from your original code)
  const formatCurrency = (amount) => {
    return amount === 0
      ? '₱0.00'
      : `₱${amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
  };

  const handleActionClick = (e, itemId, ref) => {
    e.stopPropagation();
    if (activeDropdown === itemId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(itemId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  return (
    <div className={`generic-table-container ${className}`}>
      {title && <h2 className="text-2xl font-bold my-4 text-gray-800 leading-snug">{title}</h2>}
      
      <div className={`overflow-x-auto bg-white rounded-md shadow-md ${width}`}>
        <table className="w-full table-fixed divide-y divide-gray-200 leading-relaxed">
          <thead className="bg-blue-900">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={column.key} 
                  scope="col" 
                  className={`px-6 py-3 text-left text-[15px] font-semibold text-white uppercase tracking-wide ${
                    index > 0 ? 'border-l border-white' : ''
                  } ${sortConfig.key === column.key ? 'bg-blue-800' : ''} ${column.headerClassName || column.width || ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortConfig.key === column.key && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-[15px] font-semibold text-white uppercase tracking-wide w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => {
                const rowKey = item.id || item.accountNumber || rowIndex;
                return (
                  <tr 
                    key={rowKey}
                    className={`${alternateRowColors ? (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100') : 'bg-white'} 
                    ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {columns.map((column) => {
                      let cellContent;
                      
                      if (column.render) {
                        cellContent = column.render(item[column.key], item);
                      } else if (column.key === 'balance' && typeof item[column.key] === 'number') {
                        cellContent = formatCurrency(item[column.key]);
                      } else {
                        cellContent = item[column.key];
                      }
                      
                      return (
                        <td key={column.key} className={`px-6 py-4 whitespace-nowrap text-[16px] text-gray-700 ${column.cellClassName || column.width || ''} ${column.truncate ? 'truncate' : ''}`}>
                          {cellContent}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-[16px] text-gray-700 w-20">
                      <div className="flex justify-center relative action-dropdown">
                        {customRowAction ? (
                          customRowAction(item)
                        ) : actions ? (
                          <div className="flex space-x-2">
                            {actions(item)}
                          </div>
                        ) : (
                          <>
                            <button
                              ref={el => { if (el) buttonRefs.current[rowKey] = el; }}
                              className="text-blue-900 hover:text-blue-600 cursor-pointer"
                              onClick={e => handleActionClick(e, rowKey, buttonRefs.current[rowKey])}
                            >
                              <MoreHorizontal className="h-6 w-6" />
                            </button>
                            <ActionDropdown
                              anchorRef={{ current: buttonRefs.current[rowKey] }}
                              open={activeDropdown === rowKey}
                              onClose={() => setActiveDropdown(null)}
                            >
                              <DropdownMenu
                                isOpen={activeDropdown === rowKey}
                                onClose={() => setActiveDropdown(null)}
                                item={item}
                                actions={dropdownActions}
                              />
                            </ActionDropdown>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + 1} 
                  className="px-6 py-4 text-center text-[16px] text-gray-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && sortedData.length > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          itemsPerPage={currentItemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default GenericTable;