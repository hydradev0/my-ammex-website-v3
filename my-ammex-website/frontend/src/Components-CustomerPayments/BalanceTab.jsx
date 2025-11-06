import React, { useState, useEffect } from "react";
import { Send, Calendar, DollarSign, CheckCircle } from "lucide-react";
import ModernSearchFilter from "../Components/ModernSearchFilter";
import PaginationTable from "../Components/PaginationTable";
import AdvanceActionsDropdown from "../Components/AdvanceActionsDropdown";
import PaymentActionsModal from "./PaymentActionsModal";

const BalanceTab = ({
  historyData = [],
  searchPlaceholder = "Search balance history...",
  itemLabel = "balance records",
  formatCurrency,
  formatDateTime,
  onSendReminder,
  onMarkAsPaid,
  onCustomAction,
  isLoading = false,
}) => {
  // State management
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    actionType: null,
    selectedItem: null,
  });

  // Loading states for actions
  const [loadingActions, setLoadingActions] = useState([]);

  // Helper functions for loading states
  const addLoadingAction = (actionKey) => {
    setLoadingActions((prev) => [...prev, actionKey]);
  };

  const removeLoadingAction = (actionKey) => {
    setLoadingActions((prev) => prev.filter((key) => key !== actionKey));
  };

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

  // Balance-specific action color function
  const getBalanceActionColor = (action) => {
    switch (action) {
      case "Partially Paid":
        return "text-yellow-600 bg-yellow-100";
      case "Overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Derive a normalized display action from item amounts and due date
  const getDisplayAction = (item) => {
    const paidAmount = Number(
      item?.paidAmount ?? item?.details?.paidAmount ?? 0
    );
    const remainingAmount = Number(
      item?.remainingAmount ??
        item?.details?.remainingAmount ??
        item?.details?.newBalance ??
        0
    );

    if (paidAmount > 0 && remainingAmount > 0) {
      return "Partially Paid";
    }

    const isPastDue = item?.dueDate
      ? new Date(item.dueDate) < new Date()
      : false;
    if (isPastDue && remainingAmount > 0) {
      return "Overdue";
    }

    return item?.action || "Unpaid";
  };

  // Extract unique actions for filtering (use derived display action)
  const uniqueActions = [
    ...new Set(historyData.map((item) => getDisplayAction(item))),
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
          getDisplayAction(item),
        ].filter(Boolean);

        return searchFields.some((field) =>
          field.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Action filter (use derived display action)
    if (selectedAction !== "all") {
      filtered = filtered.filter(
        (item) => getDisplayAction(item) === selectedAction
      );
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

  // Modal handlers
  const openModal = (actionType, item) => {
    setModalState({
      isOpen: true,
      actionType,
      selectedItem: item,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      actionType: null,
      selectedItem: null,
    });
  };

  // Action handler
  const handleAction = (item, action) => {
    switch (action) {
      case "send_reminder":
        openModal("send_reminder", item);
        break;
      case "mark_as_paid":
        openModal("mark_as_paid", item);
        break;
      case "download_pdf":
        openModal("download_pdf", item);
        break;
      default:
        // Handle custom actions
        if (onCustomAction) {
          onCustomAction(item, action);
        } else {
          console.log("Unknown action:", action, "for item:", item);
        }
    }
  };

  // Handle modal confirmations
  const handleModalConfirm = async (actionType, data) => {
    try {
      switch (actionType) {
        case "send_reminder":
          addLoadingAction("send_reminder");
          if (onSendReminder) {
            await onSendReminder(data);
          }
          removeLoadingAction("send_reminder");
          break;
        case "mark_as_paid":
          addLoadingAction("mark_as_paid");
          if (onMarkAsPaid) {
            await onMarkAsPaid(data);
          }
          removeLoadingAction("mark_as_paid");
          break;
        default:
          console.log("Unknown action type:", actionType);
      }
    } catch (error) {
      // Remove loading state on error
      removeLoadingAction(
        actionType === "send_reminder" ? "send_reminder" : "mark_as_paid"
      );
      console.error("Action failed:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Configure quick actions (buttons that appear outside dropdown)
  const getQuickActions = () => [
    {
      key: "send_reminder",
      icon: Send,
      label: "Send Reminder",
      title: "Send Reminder",
      className:
        "text-blue-600 cursor-pointer hover:text-blue-900 p-1 rounded transition-colors",
      condition: (item) => {
        const status = getDisplayAction(item);
        return status === "Unpaid" || status === "Overdue";
      },
    },
    {
      key: "mark_as_paid",
      icon: CheckCircle,
      label: "Mark as Paid",
      title: "Mark as Paid",
      className:
        "text-green-600 cursor-pointer hover:text-green-900 p-1 rounded transition-colors ",
      condition: (item) => {
        const status = getDisplayAction(item);
        return (
          status === "Unpaid" ||
          status === "Overdue" ||
          status === "Partially Paid"
        );
      },
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Loading Balance History...
        </h3>
        <p className="text-gray-500">
          Please wait while we fetch the balance data.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={filteredHistory.length}
        totalCount={historyData.length}
        itemLabel={itemLabel}
      />

      {/* Balance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Customer & Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300">
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
                paginatedHistory.map((item) => {
                  const paidAmount = Number(
                    item?.paidAmount ?? item?.details?.paidAmount ?? 0
                  );
                  const totalAmount = Number(
                    item?.totalAmount ??
                      item?.details?.totalAmount ??
                      paidAmount +
                        Number(
                          item?.remainingAmount ??
                            item?.details?.remainingAmount ??
                            item?.details?.newBalance ??
                            0
                        )
                  );
                  const remainingAmount = Math.max(
                    0,
                    Number(
                      item?.remainingAmount ??
                        item?.details?.remainingAmount ??
                        item?.details?.newBalance ??
                        totalAmount - paidAmount
                    )
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40 transition-colors"
                    >
                      {/* Customer & Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full inline-flex w-fit mb-1 ring-1 ring-inset ${getBalanceActionColor(
                              getDisplayAction(item)
                            )}`}
                          >
                            {getDisplayAction(item)}
                          </span>
                          <div className="text-sm font-semibold text-gray-900">
                            <span className="text-blue-600">
                              {item.invoiceNumber}
                            </span>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {item.customerName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Balance Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {item.details.paymentMethod && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">
                                Method
                              </span>
                              <span className="text-gray-900 text-base">
                                {item.details.paymentMethod}
                              </span>
                            </div>
                          )}
                          {item?.details?.reference && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">Ref</span>
                              <span className="text-gray-900 font-mono text-base">
                                {item.details.reference}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Total</span>
                            <span className="text-gray-900  text-base">{`₱${Number(
                              totalAmount || 0
                            ).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Paid</span>
                            <span className="text-green-600 text-base">
                              {currencyFn(paidAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">
                              Remaining
                            </span>
                            <span className="font-semibold text-red-600 text-base">{`₱${Number(
                              remainingAmount || 0
                            ).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}</span>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          {/* Recent Payment Info */}
                          {paidAmount > 0 && item.details?.amount && (
                            <div className="bg-blue-50 rounded-md px-2 py-1.5 border border-blue-200 mb-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-blue-700 text-xs font-medium">
                                  Recent Payment
                                </span>
                                <span className="text-blue-900 text-xs font-semibold">
                                  {currencyFn(Number(item.details.amount || 0))}
                                </span>
                              </div>
                              {item.timestamp && (
                                <div className="text-xs text-blue-600">
                                  {new Date(item.timestamp).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Invoice Date */}
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              Invoice:{" "}
                              {new Date(item.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          {/* Due Date */}
                          {item.dueDate ? (
                            <div className="flex items-center text-xs text-gray-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                Due:{" "}
                                {new Date(item.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>Due: Not set</span>
                            </div>
                          )}

                          {/* Overdue indicator */}
                          {item.dueDate &&
                            new Date(item.dueDate) < new Date() && (
                              <div className="text-xs text-red-600 font-medium">
                                {Math.ceil(
                                  (new Date() - new Date(item.dueDate)) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days overdue
                              </div>
                            )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Temporarily disabled actions */}
                        {/* <AdvanceActionsDropdown
                          item={item}
                          quickActions={getQuickActions()}
                          onAction={handleAction}
                          loadingActions={loadingActions}
                        /> */}
                      </td>
                    </tr>
                  );
                })
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

      {/* Payment Actions Modal */}
      {/* Temporarily disabled payment actions modal */}
      {/* <PaymentActionsModal
        item={modalState.selectedItem}
        isOpen={modalState.isOpen}
        onClose={closeModal}
        actionType={modalState.actionType}
        onConfirm={handleModalConfirm}
        formatCurrency={currencyFn}
      /> */}
    </div>
  );
};

export default BalanceTab;
