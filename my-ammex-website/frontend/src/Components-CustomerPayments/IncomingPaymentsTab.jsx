import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Clock, Mail, CheckCircle } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import PaginationTable from '../Components/PaginationTable';
import PaymentActionsModal from './PaymentActionsModal';
import AdvanceActionsDropdown from '../Components/AdvanceActionsDropdown';

const IncomingPaymentsTab = ({
  invoices = [],
  isLoading = false,
  formatCurrency,
  formatDateTime,
  onSendReminder,
  onMarkAsPaid,
  searchPlaceholder = 'Search customer, invoice, or status...',
  itemLabel = 'incoming payments'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | awaiting payment | partially paid | overdue
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalState, setModalState] = useState({ isOpen: false, actionType: null, selectedItem: null });

  const defaultFormatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const currency = formatCurrency || defaultFormatCurrency;
  const dateTime = formatDateTime || ((d) => new Date(d).toLocaleDateString());

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange, invoices]);

  const dropdownFilters = [
    {
      id: 'status',
      value: statusFilter,
      setValue: setStatusFilter,
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'awaiting payment', label: 'Awaiting payment' },
        { value: 'partially paid', label: 'Partially paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
  ];

  const quickActions = [
    // {
    //   key: "send_reminder",
    //   icon: Mail,
    //   label: "Send Reminder",
    //   title: "Send Reminder",
    //   className: "text-blue-600 cursor-pointer hover:text-blue-900 p-1 rounded transition-colors",
    // },
    {
      key: "mark_as_paid",
      icon: CheckCircle,
      label: "Mark as Paid",
      title: "Mark as Paid",
      className: "text-green-600 cursor-pointer hover:text-green-900 p-1 rounded transition-colors",
    },
  ];

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = (invoices || []).filter((inv) => {
      if (statusFilter !== 'all' && (inv.status || '').toLowerCase() !== statusFilter) return false;
      if (!term) return true;
      const hay = [
        inv.customerName,
        inv.invoiceNumber,
        inv.status,
      ]
        .filter(Boolean)
        .join(' ') 
        .toLowerCase();
      return hay.includes(term);
    });
    // Date range filter on createdAt (fallback to dueDate)
    const withDate = base.filter((inv) => {
      if (!(dateRange.start && dateRange.end)) return true;
      const d = new Date(inv.createdAt || inv.dueDate);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return d >= start && d <= end;
    });

    // Sort newest first: prefer createdAt, fallback to dueDate
    return withDate.sort((a, b) => {
      const da = new Date(a.createdAt || a.dueDate || 0).getTime();
      const db = new Date(b.createdAt || b.dueDate || 0).getTime();
      return db - da;
    });
  }, [invoices, searchTerm, statusFilter, dateRange]);

  const totalItems = filtered.length;
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(pageStart, pageStart + itemsPerPage);

  const handleAction = (actionType, item) => {
    setModalState({ isOpen: true, actionType, selectedItem: item });
  };

  const closeModal = () => setModalState({ isOpen: false, actionType: null, selectedItem: null });

  return (
    <div className="space-y-4">
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        dropdownFilters={dropdownFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={totalItems}
        totalCount={(invoices || []).length}
        itemLabel={itemLabel}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Totals</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                    Loading incoming payments...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Clock className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming payments</h3>
                      <p className="text-gray-500">All customer invoices appear to be fully paid.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.customerName}</span>
                        <span className="text-xs text-gray-500">Invoice #{row.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{row.dueDate ? dateTime(row.dueDate) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-700">Total: {currency(row.totalAmount)}</span>
                        <span className="text-gray-500 text-xs">Paid: {currency(row.paidAmount)} • Remaining: {currency(row.remainingAmount)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="capitalize">{row.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        <AdvanceActionsDropdown
                          item={row}
                          quickActions={quickActions}
                          onAction={handleAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 30, 50]}
          className="mt-4"
        />
      )}

      {modalState.isOpen && (
        <PaymentActionsModal
          isOpen={modalState.isOpen}
          actionType={modalState.actionType}
          item={modalState.selectedItem}
          onClose={closeModal}
          onConfirm={(item) => {
            if (modalState.actionType === 'send_reminder') onSendReminder && onSendReminder(item);
            if (modalState.actionType === 'mark_as_paid') onMarkAsPaid && onMarkAsPaid(item);
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default IncomingPaymentsTab;


