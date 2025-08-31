import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import ViewOrderModal from './ViewOrderModal';
import ProcessOrderModal from './ProcessOrderModal';
import PaginationTable from '../Components/PaginationTable';
//test
function HandleOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownOpen]);

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

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
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

  // Filter orders based on search term and selected status
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-5 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              className="px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center w-full"
              onClick={() => setStatusDropdownOpen((open) => !open)}
            >
              <span>{statusOptions.find(option => option.value === selectedStatus)?.label || 'All Status'}</span>
              <ChevronDown className={`w-6 h-6 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusDropdownOpen && (
              <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg">
                {statusOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${option.value === selectedStatus ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' : ''}`}
                    onClick={() => {
                      setSelectedStatus(option.value);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

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