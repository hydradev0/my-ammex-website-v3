import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { Plus } from 'lucide-react';
import SalesQuoteForm from './SalesQuoteForm';
import OrdersModal from '../Components/OrdersModal';
import { salesQuotesDropdownActions } from '../Components/dropdownActions';


// Constants for status styling
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ready: 'bg-green-100 text-green-800'
};

function SalesQuotesTable() {
  // State for sales quotes data
  const [salesQuotes, setSalesQuotes] = useState([
    {
      docNo: 'SQ1001',
      name: 'John Smith',
      amount: 1250.00,
      status: 'Pending',
      date: '2024-03-15',
    },
    {
      docNo: 'SQ1002',
      name: 'Sarah Johnson',
      amount: 3450.50,
      status: 'Ready',
      date: '2024-03-14',
    },
    {
      docNo: 'SQ1003',
      name: 'Michael Brown',
      amount: 875.25,
      status: 'Pending',
      date: '2024-03-13',
    },
    {
      docNo: 'SQ1004',
      name: 'Emily Davis',
      amount: 2150.75,
      status: 'Ready',
      date: '2024-03-12',
    },
    {
      docNo: 'SQ1005',
      name: 'Robert Wilson',
      amount: 1875.50,
      status: 'Pending',
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
  
  // Calculate the highest document number from existing quotes
  const highestDocNo = useMemo(() => {
    return Math.max(...salesQuotes.map(quote => 
      parseInt(quote.docNo.replace('SQ', ''), 10)
    ), 1000);
  }, [salesQuotes]);
  
  // Handle adding a new sales quote
  const handleAddSalesQuote = (quoteData) => {
    try {
      // Validate required fields
      if (!quoteData.customerName?.trim()) {
        throw new Error('Customer name is required');
      }

      const amount = parseFloat(quoteData.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount');
      }

      // Validate date
      const quoteDate = new Date(quoteData.date);
      const validUntil = new Date(quoteData.validUntil);
      if (validUntil < quoteDate) {
        throw new Error('Valid until date must be after quote date');
      }

      const newDocNo = highestDocNo + 1;
      const newQuote = {
        docNo: quoteData.docNo || `SQ${newDocNo}`,
        name: quoteData.customerName.trim(),
        amount,
        status: 'Pending',
        date: quoteData.date,
        validUntil: quoteData.validUntil,
        items: quoteData.items
      };
      
      setSalesQuotes(prevQuotes => [...prevQuotes, newQuote]);
      setIsModalOpen(false);
      setSuccess('Sales quote added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding sales quote:', error);
      setError(error.message);
      setSuccess(null);
    }
  };
  
  // Define columns for the sales quotes table
  const salesQuoteColumns = [
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
        <span className={`px-2 py-1 rounded-full text-sm ${STATUS_STYLES[value] || STATUS_STYLES.Pending}`}>
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
  const handleRowClick = (quote) => {
    console.log('Sales Quote selected:', quote);
    // Add navigation or details view here if needed
  };
  
  // Filter sales quotes based on search term and filter value
  const filteredQuotes = useMemo(() => {
    return salesQuotes.filter(quote => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        quote.name.toLowerCase().includes(searchLower) ||
        quote.docNo.toLowerCase().includes(searchLower) ||
        quote.status.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || quote.status === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [salesQuotes, searchTerm, filterValue]);

  return (
    <div className="bg-gray-100">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Quote</h1>
        
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
            customerCount={filteredQuotes.length}
            filterOptions={['Filter by...', 'Pending', 'Ready', 'Rejected']}
            placeholder="Search quotes..."
          />
          
          {/* New Sales Quote Button */}
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
            <span>New Sales Quote</span>
          </button>
        </div>
        
        {/* Generic Table for Sales Quotes */}
        <GenericTable 
          data={filteredQuotes}
          columns={salesQuoteColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No sales quotes found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={salesQuotesDropdownActions}
        />
        
        {/* New Sales Quote Modal */}
        {isModalOpen && (
          <OrdersModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setError(null);
            }}
            title="New Sales Quote"
          >
            <SalesQuoteForm
              onSubmit={handleAddSalesQuote}
              onClose={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              nextDocNo={`SQ${highestDocNo + 1}`}
            />
          </OrdersModal>
        )}
      </div>
    </div>
  );
}

SalesQuotesTable.propTypes = {
  // This component doesn't receive any props currently
  // Add prop types here if props are added in the future
};

export default SalesQuotesTable;
