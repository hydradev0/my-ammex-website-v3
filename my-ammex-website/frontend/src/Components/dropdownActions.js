import { Eye, Edit, Trash2, Printer, FileText, FileSpreadsheet, Truck, Package} from 'lucide-react';

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

// Sales Quotes specific actions (additive)
export const salesQuotesDropdownActions = [
  ...baseDropdownActions,
  {
    id: 'print',
    label: 'Print',
    icon: Printer,
    onClick: (quote) => console.log('Print quote:', quote),
    className: 'text-gray-700'
  },
  {
    id: 'convertSalesOrder',
    label: 'Create Sales Order',
    icon: FileSpreadsheet,
    onClick: (quote) => console.log('Create Sales Order:', quote),
    className: 'text-gray-700'
  },
  {
    id: 'convertSalesInvoice',
    label: 'Create Sales Invoice',
    icon: FileText,
    onClick: (quote) => console.log('Create Sales Invoice:', quote),
    className: 'text-gray-700'
  }
]; 

export const salesOrdersDropdownActions = [
  ...baseDropdownActions,
  {
    id: 'print',
    label: 'Print',
    icon: Printer,
    onClick: (quote) => console.log('Print quote:', quote),
    className: 'text-gray-700'
  },
  {
    id: 'convertSalesOrder',
    label: 'Create Sales Order',
    icon: FileSpreadsheet,
    onClick: (quote) => console.log('Create Sales Order:', quote),
    className: 'text-gray-700'
  },
  {
    id: 'convertSalesInvoice',
    label: 'Create Sales Invoice',
    icon: FileText,
    onClick: (quote) => console.log('Create Sales Invoice:', quote),
    className: 'text-gray-700'
  }
]; 

export const salesInvoicesDropdownActions = [
  ...baseDropdownActions,
  {
    id: 'print',
    label: 'Print',
    icon: Printer,
    onClick: (quote) => console.log('Print quote:', quote),
    className: 'text-gray-700'
  },
  {
    id: 'convertDeliveryReceipt',
    label: 'Create Delivery',
    icon: Truck,
    onClick: (quote) => console.log('Create Delivery Receipt:', quote),
    className: 'text-gray-700'
  }
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
  }
]; 

export const unitDropdownActions = [
  {
    id: 'view',
    label: 'View all Products',
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

export const categoryDropdownActions = [
  {
    id: 'view',
    label: 'View all Products',
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

