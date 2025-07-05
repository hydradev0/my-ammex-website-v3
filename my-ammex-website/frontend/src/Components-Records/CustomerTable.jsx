import { useState, useMemo } from 'react';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import RecordsModal from './RecordsModal';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import { customerViewConfig } from '../Components/viewConfigs';
import { baseDropdownActions } from '../Components/dropdownActions';
import { Plus} from 'lucide-react';

function CustomerTable() {
  // State for customers data
  const [customers, setCustomers] = useState([
    {
      accountCode: 'AC1001',
      name: 'John Smith',
      balance: 1250.00,
      email: 'john.smith@example.com',
      telephone: '(555) 123-4567',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      contactPerson: 'John Smith',
      notes: 'Preferred contact method: Email'
    },
    {
      accountCode: 'AC1002',
      name: 'Sarah Johnson',
      balance: 3450.50,
      email: 'sarah.j@example.com',
      telephone: '(555) 234-5678',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90210',
      country: 'USA',
      contactPerson: 'Sarah Johnson',
      notes: 'VIP customer - priority support'
    },
    {
      accountCode: 'AC1003',
      name: 'Michael Brown',
      balance: 0.00,
      email: 'm.brown@example.com',
      telephone: '(555) 345-6789',
      address: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'USA',
      contactPerson: 'Michael Brown',
      notes: 'New customer - follow up in 30 days'
    },
    {
      accountCode: 'AC1004',
      name: 'Emily Davis',
      balance: 875.25,
      email: 'emily.d@example.com',
      telephone: '(555) 456-7890',
      address: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      postalCode: '77001',
      country: 'USA',
      contactPerson: 'Emily Davis',
      notes: 'Prefers phone calls over email'
    },
    {
      accountCode: 'AC1005',
      name: 'Robert Wilson',
      balance: 2150.75,
      email: 'robert.w@example.com',
      telephone: '(555) 567-8901',
      address: '654 Maple Dr',
      city: 'Phoenix',
      state: 'AZ',
      postalCode: '85001',
      country: 'USA',
      contactPerson: 'Robert Wilson',
      notes: 'Regular customer - 5+ years'
    }
  ]);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // Calculate the highest account number
  const [highestAccountCode, setHighestAccountCode] = useState(1005);
  
  // Handle adding a new customer
  const handleAddCustomer = (customerData) => {
    // Create new customer object
    const newAccountCode = highestAccountCode + 1;
    const newCustomer = {
      accountCode: customerData.customerId || `AC${newAccountCode}`,
      name: customerData.customerName,
      balance: parseFloat(customerData.initialBalance) || 0,
      email: customerData.email1,
      telephone: customerData.telephone1
    };
    
    // Add to customers array
    setCustomers([...customers, newCustomer]);
    
    // Update highest account number
    setHighestAccountCode(newAccountCode);
    
    // Close modal
    setIsModalOpen(false);
  };

  // Handle view customer details
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCustomer(null);
  };
  
  // Define columns for the customer table
  const customerColumns = [
    { 
      key: 'accountCode', 
      header: 'ID'
    },
    { 
      key: 'name', 
      header: 'Name'
    },
    { 
      key: 'balance', 
      header: 'Balance'
      // The formatCurrency function is now built into the GenericTable
    },
    { 
      key: 'email', 
      header: 'Email'
    },
    { 
      key: 'telephone', 
      header: 'Telephone'
    }
  ];
  
  // Custom dropdown actions for customers with view functionality
  const customCustomerDropdownActions = useMemo(() => {
    return baseDropdownActions.map(action => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: handleViewCustomer
        };
      }
      return action;
    });
  }, []);
  
  // Row click handler (optional)
  const handleRowClick = (customer) => {
    console.log('Customer selected:', customer);
    // Add navigation or details view here if needed
  };
  
  // Filter customers based on search term and filter value
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.telephone.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    let matchesFilter = true;
    if (filterValue === 'Zero Balance') {
      matchesFilter = customer.balance === 0;
    } else if (filterValue === 'Active Accounts') {
      matchesFilter = customer.balance > 0;
    } else if (filterValue === 'Overdue Accounts') {
      // You can implement overdue logic here if needed
      matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-gray-100 ">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Customers</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredCustomers.length}
            filterOptions={['Filter by...', 'Zero Balance', 'Active Accounts', 'Overdue Accounts']}
            placeholder="Search customers..."
          />
          
          {/* New Customer Button */}
          <button 
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
            <span>New Customer</span>
          </button>
        </div>
        
        {/* Generic Table for Customers */}
        <GenericTable 
          data={filteredCustomers}
          columns={customerColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No customers found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={customCustomerDropdownActions}
        />
        
        {/* New Customer Modal */}
        {isModalOpen && (
          <RecordsModal 
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddCustomer}
            nextAccountCode={`AC${highestAccountCode + 1}`}
          />
        )}

        {/* View Customer Modal */}
        <ViewDetailsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          data={selectedCustomer}
          title={customerViewConfig.title}
          sections={customerViewConfig.sections}
        />
      </div>
    </div>
  );
}

export default CustomerTable;