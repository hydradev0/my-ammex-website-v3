import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { Plus, MoreHorizontal } from 'lucide-react';
import PurchaseQuoteForm from './PurchaseQuoteForm';
import OrdersModal from '../Components/OrdersModal';

// Constants for status styling
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
};

function PurchaseQuotesTable() {
  // State for purchase quotes data
  const [purchaseQuotes, setPurchaseQuotes] = useState([
    {
      docNo: 'PQ1001',
      name: 'Supplier A',
      amount: 2250.00,
      status: 'Pending',
      date: '2024-03-15',
    },
    {
      docNo: 'PQ1002',
      name: 'Supplier B',
      amount: 4450.50,
      status: 'Pending',
      date: '2024-03-14',
    },
    {
      docNo: 'PQ1003',
      name: 'Supplier C',
      amount: 1875.25,
      status: 'Pending',
      date: '2024-03-13',
    },
    {
      docNo: 'PQ1004',
      name: 'Supplier D',
      amount: 3150.75,
      status: 'Pending',
      date: '2024-03-12',
    },
    {
      docNo: 'PQ1005',
      name: 'Supplier E',
      amount: 2875.50,
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
    return Math.max(...purchaseQuotes.map(quote => 
      parseInt(quote.docNo.replace('PQ', ''), 10)
    ), 1000);
  }, [purchaseQuotes]);
  
  // Handle adding a new purchase quote
  const handleAddPurchaseQuote = (quoteData) => {
    try {
      // Validate required fields
      if (!quoteData.supplierName?.trim()) {
        throw new Error('Supplier name is required');
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
        docNo: quoteData.docNo || `PQ${newDocNo}`,
        name: quoteData.supplierName.trim(),
        amount,
        status: 'Pending',
        date: quoteData.date,
        validUntil: quoteData.validUntil,
        items: quoteData.items
      };
      
      setPurchaseQuotes(prevQuotes => [...prevQuotes, newQuote]);
      setIsModalOpen(false);
      setSuccess('Purchase quote added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding purchase quote:', error);
      setError(error.message);
      setSuccess(null);
    }
  };
  
  // Define columns for the purchase quotes table
  const purchaseQuoteColumns = [
    { 
      key: 'docNo', 
      header: 'Doc. No.',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'name', 
      header: 'Supplier Name',
      width: 'w-80',
      cellClassName: 'w-80',
      truncate: true
    },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (value) => `₱${value.toFixed(2)}`,
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-sm ${STATUS_STYLES[value] || STATUS_STYLES.Pending}`}>
          {value}
        </span>
      ),
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'date', 
      header: 'Date',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
  ];
  
  // Custom row action for purchase quotes table
  const customRowAction = (quote) => (
    <button 
      className="cursor-pointer text-blue-900 hover:text-blue-600"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Purchase Quote actions:', quote);
      }}
    >
      <MoreHorizontal className="h-6 w-6" />
    </button>
  );
  
  // Row click handler
  const handleRowClick = (quote) => {
    console.log('Purchase Quote selected:', quote);
    // Add navigation or details view here if needed
  };
  
  // Filter purchase quotes based on search term and filter value
  const filteredQuotes = useMemo(() => {
    return purchaseQuotes.filter(quote => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        quote.name.toLowerCase().includes(searchLower) ||
        quote.docNo.toLowerCase().includes(searchLower) ||
        quote.status.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || quote.status === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [purchaseQuotes, searchTerm, filterValue]);

  return (
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Purchase Quote</h1>
        
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
          
          {/* New Purchase Quote Button */}
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
            <span>New Purchase Quote</span>
          </button>
        </div>
        
        {/* Generic Table for Purchase Quotes */}
        <GenericTable 
          data={filteredQuotes}
          columns={purchaseQuoteColumns}
          onRowClick={handleRowClick}
          customRowAction={customRowAction}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No purchase quotes found"
          className="mb-8"
          alternateRowColors={true}
        />
        
        {/* New Purchase Quote Modal */}
        {isModalOpen && (
          <OrdersModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setError(null);
            }}
            title="New Purchase Quote"
          >
            <PurchaseQuoteForm
              onSubmit={handleAddPurchaseQuote}
              onClose={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              nextDocNo={`PQ${highestDocNo + 1}`}
            />
          </OrdersModal>
        )}
      </div>
  );
}

PurchaseQuotesTable.propTypes = {
  // This component doesn't receive any props currently
  // Add prop types here if props are added in the future
};

export default PurchaseQuotesTable;
