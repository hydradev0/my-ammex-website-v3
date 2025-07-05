import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import OrdersModal from '../Components/OrdersModal';
import { Plus, MoreHorizontal } from 'lucide-react';
import SalesInvoiceForm from './SalesInvoiceForm';
import { salesInvoicesDropdownActions } from '../Components/dropdownActions';

// Constants for status styling
const STATUS_STYLES = {
  Unpaid: 'bg-red-100 text-red-800',
  PartiallyPaid: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-green-100 text-green-800'
};

function SalesInvoiceTable() {
  // State for sales invoices data
  const [salesInvoices, setSalesInvoices] = useState([
    {
      docNo: 'INV1001',
      name: 'John Smith',
      amount: 1250.00,
      status: 'Unpaid',
      date: '2024-03-15',
    },
    {
      docNo: 'INV1002',
      name: 'Sarah Johnson',
      amount: 3450.50,
      status: 'PartiallyPaid',
      date: '2024-03-14',
    },
    {
      docNo: 'INV1003',
      name: 'Michael Brown',
      amount: 875.25,
      status: 'Paid',
      date: '2024-03-13',
    },
    {
      docNo: 'INV1004',
      name: 'Emily Davis',
      amount: 2150.75,
      status: 'Unpaid',
      date: '2024-03-12',
    },
    {
      docNo: 'INV1005',
      name: 'Robert Wilson',
      amount: 1875.50,
      status: 'Paid',
      date: '2024-03-11',
    }
  ]);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Calculate the highest document number from existing invoices
  const highestDocNo = useMemo(() => {
    return Math.max(...salesInvoices.map(invoice => 
      parseInt(invoice.docNo.replace('INV', ''), 10)
    ), 1000);
  }, [salesInvoices]);
  
  // Handle adding a new sales invoice
  const handleAddSalesInvoice = (invoiceData) => {
    try {
      // Validate required fields
      if (!invoiceData.customerName?.trim()) {
        throw new Error('Customer name is required');
      }

      const amount = parseFloat(invoiceData.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount');
      }

      const newDocNo = highestDocNo + 1;
      const newInvoice = {
        docNo: invoiceData.docNo || `INV${newDocNo}`,
        name: invoiceData.customerName.trim(),
        amount,
        status: 'Unpaid',
        date: new Date().toISOString().split('T')[0],
        items: invoiceData.items
      };
      
      setSalesInvoices(prevInvoices => [...prevInvoices, newInvoice]);
      setIsModalOpen(false);
      setSuccess('Sales invoice added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding sales invoice:', error);
      setError(error.message);
      setSuccess(null);
    }
  };
  
  // Define columns for the sales invoices table
  const salesInvoiceColumns = [
    { 
      key: 'docNo', 
      header: 'Doc. No.'
    },
    { 
      key: 'name', 
      header: 'Name'
    },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (value) => `₱${value.toFixed(2)}`
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-sm ${STATUS_STYLES[value] || STATUS_STYLES.Unpaid}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'date', 
      header: 'Date'
    }
  ];
  
  
  // Row click handler
  const handleRowClick = (invoice) => {
    console.log('Sales Invoice selected:', invoice);
    // Add navigation or details view here if needed
  };
  
  // Filter sales invoices based on search term and filter value
  const filteredInvoices = useMemo(() => {
    return salesInvoices.filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        invoice.name.toLowerCase().includes(searchLower) ||
        invoice.docNo.toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || invoice.status === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [salesInvoices, searchTerm, filterValue]);

  return (
    <div className="bg-gray-100">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Invoice</h1>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredInvoices.length}
            filterOptions={['Filter by...', 'Unpaid', 'PartiallyPaid', 'Paid']}
            placeholder="Search invoices..."
          />
          
          {/* New Sales Invoice Button */}
          <button 
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
            <span>New Sales Invoice</span>
          </button>
        </div>
        
        {/* Generic Table for Sales Invoices */}
        <GenericTable 
          data={filteredInvoices}
          columns={salesInvoiceColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No sales invoices found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={salesInvoicesDropdownActions}
        />
        
        {/* New Sales Invoice Modal */}
        {isModalOpen && (
          <OrdersModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setError(null);
            }}
            title="New Sales Invoice"
          >
            <SalesInvoiceForm
              onSubmit={handleAddSalesInvoice}
              onClose={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              nextDocNo={`INV${highestDocNo + 1}`}
            />
          </OrdersModal>
        )}
      </div>
    </div>
  );
}

SalesInvoiceTable.propTypes = {
  // This component doesn't receive any props currently
  // Add prop types here if props are added in the future
};

export default SalesInvoiceTable;
