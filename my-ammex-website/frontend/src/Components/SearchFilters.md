# SearchFilters Component

A reusable, modern search and filter component with a consistent UI/UX design across the application.

## Features

- **Modern Design**: Clean, professional UI with smooth transitions
- **Flexible Configuration**: Support for multiple dropdown filters and date ranges
- **Active Filters Display**: Visual indicators for active filters with individual clear buttons
- **Responsive Layout**: Works well on desktop and mobile devices
- **Accessibility**: Proper focus states and keyboard navigation
- **Consistent Styling**: Matches the design system used in PaymentFilters and InvoiceFilters

## Usage

### Basic Example (Orders)

```jsx
import SearchFilters from '../Components/SearchFilters';

function HandleOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const dropdownFilters = [
    {
      id: 'status',
      value: selectedStatus,
      setValue: setSelectedStatus,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  ];

  return (
    <SearchFilters
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchPlaceholder="Search orders, customers, order IDs..."
      dropdownFilters={dropdownFilters}
      filteredCount={filteredOrders.length}
      totalCount={orders.length}
      itemLabel="orders"
    />
  );
}
```

### Advanced Example (With Date Range and Multiple Filters)

```jsx
import SearchFilters from '../Components/SearchFilters';

function InvoicesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const dropdownFilters = [
    {
      id: 'status',
      value: selectedStatus,
      setValue: setSelectedStatus,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'paid', label: 'Paid' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'overdue', label: 'Overdue' }
      ]
    },
    {
      id: 'paymentMethod',
      value: selectedPaymentMethod,
      setValue: setSelectedPaymentMethod,
      options: [
        { value: 'all', label: 'All Payment Methods' },
        { value: 'cash', label: 'Cash' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' }
      ]
    }
  ];

  return (
    <SearchFilters
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchPlaceholder="Search invoices, customers, references..."
      dropdownFilters={dropdownFilters}
      dateRange={dateRange}
      setDateRange={setDateRange}
      showDateRange={true}
      filteredCount={filteredInvoices.length}
      totalCount={invoices.length}
      itemLabel="invoices"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `searchTerm` | string | `''` | Current search term value |
| `setSearchTerm` | function | - | Function to update search term |
| `searchPlaceholder` | string | `'Search...'` | Placeholder text for search input |
| `dropdownFilters` | array | `[]` | Array of dropdown filter configurations |
| `dateRange` | object | `{ start: '', end: '' }` | Date range object with start and end properties |
| `setDateRange` | function | - | Function to update date range |
| `showDateRange` | boolean | `false` | Whether to show date range filters |
| `filteredCount` | number | `0` | Number of filtered results |
| `totalCount` | number | `0` | Total number of items |
| `itemLabel` | string | `'items'` | Label for items (e.g., 'invoices', 'orders', 'payments') |

## Dropdown Filter Configuration

Each dropdown filter should be an object with the following structure:

```jsx
{
  id: 'unique_filter_id',           // Unique identifier for the filter
  value: currentValue,              // Current selected value
  setValue: setValueFunction,       // Function to update the value
  options: [                        // Array of options
    { value: 'option_value', label: 'Option Label' },
    // ... more options
  ]
}
```

## Styling

The component uses Tailwind CSS classes and follows the design system established in the application. Key design elements include:

- **Blue focus states** (`focus:ring-blue-500`)
- **Smooth transitions** (`transition-colors duration-200`)
- **Consistent spacing** (`gap-4`, `py-2.5`)
- **Modern shadows** (`shadow-lg`)
- **Color-coded active filters** (blue, green, purple, orange, etc.)

## Migration from Existing Components

~~The old InvoiceFilters.jsx and PaymentFilters.jsx components have been removed and replaced with this ModernSearchFilter component.~~

**Migration completed for:**
- ✅ **HandleOrders.jsx** - Now uses ModernSearchFilter
- ✅ **ProcessedInvoices.jsx** - Migrated from InvoiceFilters to ModernSearchFilter  
- ✅ **PaymentReceiving.jsx** - Migrated from PaymentFilters to ModernSearchFilter

All components now use the unified ModernSearchFilter for consistent UI/UX.

## Benefits

- **Consistency**: All filter components across the app will have the same look and feel
- **Maintainability**: Single component to maintain instead of multiple similar components
- **Feature Rich**: Built-in active filters, clear buttons, responsive design
- **Accessibility**: Proper focus management and keyboard navigation
- **Performance**: Optimized with proper state management and event handling

## Browser Support

Compatible with all modern browsers that support:
- CSS Grid and Flexbox
- ES6+ JavaScript features
- React 16.8+ (Hooks)
