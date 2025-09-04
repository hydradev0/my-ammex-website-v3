import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ViewOrderModal from './ViewOrderModal';
import ProcessOrderModal from './ProcessOrderModal';
import PaginationTable from '../Components/PaginationTable';
import ModernSearchFilter from '../Components/ModernSearchFilter';
//test
function HandleOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Mock data - replace with actual API calls
  const orders = [
    {
      id: 'ORD001',
      clientName: 'ABC Corporation',
      date: '2024-03-20',
      status: 'pending',
      total: 1500.00,
      items: [
        {
          name: 'Product A',
          quantity: 2,
          unitPrice: 500.00,
          total: 1000.00
        },
        {
          name: 'Product B',
          quantity: 1,
          unitPrice: 500.00,
          total: 500.00
        }
      ]
    },
    {
      id: 'ORD002',
      clientName: 'XYZ Ltd',
      date: '2024-03-21',
      status: 'pending',
      total: 2300.00,
      items: [
        {
          name: 'Product C',
          quantity: 3,
          unitPrice: 500.00,
          total: 1500.00
        },
        {
          name: 'Product D',
          quantity: 2,
          unitPrice: 400.00,
          total: 800.00
        }
      ]
    },
    // Add more mock data as needed
  ];



  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleProcessOrder = (order) => {
    setSelectedOrder(order);
    setDiscountPercent(""); // Reset discount when opening process modal
    setIsProcessModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseProcessModal = () => {
    setIsProcessModalOpen(false);
    setSelectedOrder(null);
    setDiscountPercent(""); // Reset discount when closing process modal
  };

  const handleProcess = (orderId, discount) => {
    // Here you would typically make an API call to process the order with the discount
    console.log(`Processing order ${orderId} with discount ${discount}`);
    // Update the order status in your state/backend
    handleCloseProcessModal();
  };

  // Configure dropdown filters for SearchFilters component
  const dropdownFilters = [
   
  ];

  // Filter orders based on search term, selected status, and date range
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const orderDate = new Date(order.date);
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        matchesDateRange = matchesDateRange && orderDate >= startDate;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        matchesDateRange = matchesDateRange && orderDate <= endDate;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDateRange;
  });

  // Sort filtered orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    if (sortField === 'total') {
      return sortDirection === 'asc' 
        ? a.total - b.total
        : b.total - a.total;
    }
    if (sortField === 'clientName') {
      return sortDirection === 'asc'
        ? a.clientName.localeCompare(b.clientName)
        : b.clientName.localeCompare(a.clientName);
    }
    if (sortField === 'id') {
      return sortDirection === 'asc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id);
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);
  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-[calc(100vh-140px)]">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Orders</h1>

      {/* Filters and Search Section */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search orders, customers, order IDs..."
        dropdownFilters={dropdownFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        itemLabel="orders"
      />

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  Order ID
                  {sortField === 'id' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clientName')}
                >
                  Customer Name
                  {sortField === 'clientName' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  Date
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  Total
                  {sortField === 'total' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-blue-600">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                    {order.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                    ₱{order.total.toFixed(2)}
                  </td>
                  <td className="px-10 py-4 whitespace-nowrap text-md text-gray-500">
                    {order.items.reduce((total, item) => total + item.quantity, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                    <button 
                      onClick={() => handleViewOrder(order)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleProcessOrder(order)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 20, 30, 40, 50]}
          className="mt-2"
        />

      {/* Modals */}
      {isViewModalOpen && (
        <ViewOrderModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          order={selectedOrder}
        />
      )}
      {isProcessModalOpen && (
        <ProcessOrderModal
          isOpen={isProcessModalOpen}
          onClose={handleCloseProcessModal}
          order={selectedOrder}
          onProcess={handleProcess}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
        />
      )}
    </div>
  );
}

export default HandleOrders; 