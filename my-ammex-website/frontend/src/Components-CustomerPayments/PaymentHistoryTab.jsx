import React, { useState, useEffect } from "react";
import { DollarSign, Send, CheckCircle, FileText, Download } from "lucide-react";
import { downloadPaymentHistoryPdf } from "../services/paymentService";
import ModernSearchFilter from "../Components/ModernSearchFilter";
import PaginationTable from "../Components/PaginationTable";
import AdvanceActionsDropdown from "../Components/AdvanceActionsDropdown";

const PaymentHistoryTab = ({
  historyData = [],
  searchPlaceholder = "Search payment history...",
  itemLabel = "payment records",
  formatCurrency,
  formatDateTime,
  onCustomAction,
}) => {
  // State management
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Per-row loading state for downloads
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  // Default formatters if not provided
  const defaultFormatCurrency = (amount) => `₱${amount.toFixed(2)}`;
  const defaultFormatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Use provided functions or defaults
  const currencyFn = formatCurrency || defaultFormatCurrency;
  const dateTimeFn = formatDateTime || defaultFormatDateTime;

  // Action color function for payment history
  const getPaymentHistoryActionColor = (action) => {
    switch (action) {
      case "Payment Completed":
        return "text-green-600 bg-green-100";
      case "Marked as Paid":
        return "text-white bg-green-600";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const actionColorFn = getPaymentHistoryActionColor;

  // Extract unique actions for filtering
  const uniqueActions = [
    ...new Set(historyData.map((item) => item.action)),
  ].filter(Boolean);

  // Filter history data
  useEffect(() => {
    let filtered = historyData || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchFields = [
          item.customerName,
          item.invoiceNumber,
          item.action,
          item.description,
          item.details?.paymentMethod,
          item.details?.reference,
        ].filter(Boolean);

        return searchFields.some((field) =>
          field.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Action filter
    if (selectedAction !== "all") {
      filtered = filtered.filter((item) => item.action === selectedAction);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [historyData, searchTerm, selectedAction, dateRange]);

  // Configure dropdown filters
  const dropdownFilters = [
    ...(uniqueActions.length > 0
      ? [
          {
            id: "action",
            value: selectedAction,
            setValue: setSelectedAction,
            options: [
              { value: "all", label: "All Actions" },
              ...uniqueActions.map((action) => ({
                value: action,
                label: action,
              })),
            ],
          },
        ]
      : []),
  ];

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Action handler
  const handleAction = async (item, action) => {
    if (action === "download_pdf") {
      try {
        const targetInvoiceId = item.invoiceId || item.invoice?.id || item.id;
        setDownloadingInvoiceId(targetInvoiceId);
        const blob = await downloadPaymentHistoryPdf(targetInvoiceId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileName = `Completed-${item.invoiceNumber || targetInvoiceId}.pdf`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to download PDF:", err);
        alert("Failed to download PDF. Please try again later.");
      } finally {
        setDownloadingInvoiceId(null);
      }
      return;
    }
    // Fallback/custom actions
    if (onCustomAction) {
      onCustomAction(item, action);
    } else {
      console.log("Unknown action:", action, "for item:", item);
    }
  };

  const quickActions = [
    {
      key: "download_pdf",
      label: "Download PDF",
      icon: Download,
      title: "Download PDF",
      className: "text-blue-600 cursor-pointer hover:text-blue-900 p-1 rounded transition-colors",
    },
  ];

  // Table headers for payment history
  const renderTableHeaders = () => (
    <>
      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
        Customer & Status
      </th>
      <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
        Details
      </th>
      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
        Date & Time
      </th>
      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
        Actions
      </th>
    </>
  );

  // Table row for payment history
  const renderTableRow = (item) => (
    <>
      {/* Customer & Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full inline-flex w-fit mb-1 ring-1 ring-inset ${actionColorFn(
              item.action
            )}`}
          >
            {item.action}
          </span>
          <div className="text-sm font-semibold text-gray-900">
            <span className="text-blue-600">{item.invoiceNumber}</span>
            <div className="text-xs text-gray-600 mt-0.5">
              {item.customerName}
            </div>
          </div>
        </div>
      </td>

      {/* Details */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          {/* Existing supplementary info */}
          <div className="text-sm text-gray-600 space-y-1">
            {item.details && (
              <>
                {item.details.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Method</span>
                    <span className="text-gray-900 text-base">
                      {item.details.paymentMethod}
                    </span>
                  </div>
                )}
                {item.details.reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Ref</span>
                    <span className="text-gray-900 text-base">
                      {item.details.reference}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Total Amount */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Total</span>
            <span className="text-gray-900 text-base">{`₱${Number(
              (item.details?.amount || 0) + (item.remainingAmount || 0) || 0
            ).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}</span>
          </div>
          {/* Remaining Amount */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Remaining</span>
            <span className="font-semibold text-green-600 text-base">{`₱${Number(
              item.remainingAmount || 0
            ).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}</span>
          </div>
        </div>
      </td>

      {/* Date & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {dateTimeFn(item.timestamp)}
        </div>
      </td>
    </>
  );

  return (
    <div>
      {/* Search and Filters */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        dropdownFilters={dropdownFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={filteredHistory.length}
        totalCount={historyData.length}
        itemLabel={itemLabel}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
              <tr>{renderTableHeaders()}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {itemLabel} found
                      </h3>
                      <p className="text-gray-500">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {renderTableRow(item)}

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <AdvanceActionsDropdown
                        item={item}
                        quickActions={quickActions}
                        onAction={handleAction}
                        loadingActions={(downloadingInvoiceId === (item.invoiceId || item.invoice?.id || item.id)) ? ['download_pdf'] : []}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredHistory.length > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredHistory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 20, 30, 50]}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default PaymentHistoryTab;
