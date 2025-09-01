import React, { useState, useEffect } from 'react';
import ModernSearchFilter from './ModernSearchFilter';
import PaginationTable from './PaginationTable';

const HistoryTab = ({ 
  historyData = [], 
  searchPlaceholder = "Search history...",
  itemLabel = "records",
  formatCurrency,
  formatDateTime,
  actions = [], // Array of action objects with {icon, label, onClick, className}
  getActionColor, // Function to get color for action badges
  title = "History"
}) => {
  // State management
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Default formatters if not provided
  const defaultFormatCurrency = (amount) => `₱${amount.toFixed(2)}`;
  const defaultFormatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Use provided functions or defaults
  const currencyFn = formatCurrency || defaultFormatCurrency;
  const dateTimeFn = formatDateTime || defaultFormatDateTime;

  // Default action color function
  const defaultGetActionColor = (action) => {
    const colorMap = {
      'completed': 'text-green-600 bg-green-100',
      'approved': 'text-blue-600 bg-blue-100',
      'processed': 'text-orange-600 bg-orange-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'rejected': 'text-red-600 bg-red-100',
      'cancelled': 'text-red-600 bg-red-100',
    };
    
    const actionKey = action.toLowerCase().split(' ')[0];
    return colorMap[actionKey] || 'text-gray-600 bg-gray-100';
  };

  // Use provided function or default
  const actionColorFn = getActionColor || defaultGetActionColor;

  // Extract unique actions for filtering
  const uniqueActions = [...new Set(historyData.map(item => item.action))].filter(Boolean);

  // Filter history data
  useEffect(() => {
    let filtered = historyData || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = [
          item.customerName,
          item.invoiceNumber,
          item.action,
          item.description,
          item.details?.paymentMethod,
          item.details?.reference
        ].filter(Boolean);

        return searchFields.some(field => 
          field.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(item => item.action === selectedAction);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [historyData, searchTerm, selectedAction, dateRange]);

  // Configure dropdown filters
  const dropdownFilters = [
    ...(uniqueActions.length > 0 ? [{
      id: 'action',
      value: selectedAction,
      setValue: setSelectedAction,
      options: [
        { value: 'all', label: 'All Actions' },
        ...uniqueActions.map(action => ({ value: action, label: action }))
      ]
    }] : [])
  ];

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Search and Filters */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        dropdownFilters={dropdownFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={filteredHistory.length}
        totalCount={historyData.length}
        itemLabel={itemLabel}
      />

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Customer & Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 text-gray-300 mb-4">📋</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {itemLabel} found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Customer & Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex w-fit mb-2 ${actionColorFn(item.action)}`}>
                          {item.action}
                        </span>
                        <div className="text-sm font-medium text-blue-600">
                          {item.invoiceNumber}
                          <div className="text-xs text-gray-600 mt-1">{item.customerName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.description && (
                          <div className="text-sm text-gray-900 mb-2 max-w-xs">
                            {item.description}
                          </div>
                        )}
                        {item.details && (
                          <>
                            {item.details.amount && (
                              <div className="flex items-center">
                                <span className="font-medium text-green-600">
                                  Amount: {currencyFn(item.details.amount)}
                                </span>
                              </div>
                            )}
                            {item.details.paymentMethod && (
                              <div className="text-xs">Method: {item.details.paymentMethod}</div>
                            )}
                            {item.details.reference && (
                              <div className="text-xs">Ref: {item.details.reference}</div>
                            )}
                            {item.details.previousBalance && item.details.newBalance !== undefined && (
                              <div className="text-xs">
                                Balance: {currencyFn(item.details.previousBalance)} → {currencyFn(item.details.newBalance)}
                              </div>
                            )}
                            {item.details.previousStatus && item.details.newStatus && (
                              <div className="text-xs">
                                Status: {item.details.previousStatus} → {item.details.newStatus}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {dateTimeFn(item.timestamp)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex gap-2 justify-center">
                        {actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => action.onClick && action.onClick(item)}
                            className={`${action.className || 'text-blue-600 hover:text-blue-900'} p-1 rounded transition-colors flex items-center gap-1`}
                            title={action.label}
                          >
                            {action.icon && <action.icon className="w-4 h-4" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredHistory.length > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredHistory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 20, 30, 50]}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default HistoryTab;
