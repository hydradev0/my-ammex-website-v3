import { Eye, Edit, Trash2, Printer, FileText, FileSpreadsheet, Truck, Package, DollarSign} from 'lucide-react';

// Generic base actions
export const baseDropdownActions = [
  {
    id: 'view',
    label: 'View Details',
    icon: Eye,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: null,
    className: 'text-red-600'
  }
];

export const customerDropdownActions = [
  {
    id: 'view',
    label: 'View Details',
    icon: Eye,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick: null,
    className: 'text-gray-700'
  },
];


// Items specific actions - will be customized in ItemsTable
export const itemsDropdownActions = [
  ...baseDropdownActions,
  {
    id: 'adjustStock',
    label: 'Adjust Stock',
    icon: Package,
    onClick: null,
    className: 'text-blue-600'
  },
  {
    id: 'adjustPrice',
    label: 'Adjust Price',
    icon: DollarSign,
    onClick: null,
    className: 'text-green-600'
  }
]; 

export const unitDropdownActions = [
  {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: null,
    className: 'text-red-600'
  }
]; 

export const categoryDropdownActions = [
  {
    id: 'view',
    label: 'View Subcategories',
    icon: Eye,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick: null,
    className: 'text-gray-700'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: null,
    className: 'text-red-600'
  }
]; 

