const { getModels } = require('../config/db');

/**
 * Updates invoice payment amounts and status
 * @param {number} invoiceId - The invoice ID
 * @param {number} paymentAmount - The payment amount to add
 * @returns {Object} Updated invoice with new balances
 */
const updateInvoicePayment = async (invoiceId, paymentAmount) => {
  try {
    const { Invoice } = getModels();
    
    // Get current invoice
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Calculate new amounts
    const currentPaidAmount = Number(invoice.paidAmount || 0);
    const newPaidAmount = currentPaidAmount + Number(paymentAmount);
    const newRemainingBalance = Number(invoice.totalAmount) - newPaidAmount;
    
    // Determine new status
    let newStatus;
    if (newRemainingBalance <= 0) {
      newStatus = 'completed';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially paid';
    } else {
      newStatus = 'awaiting payment';
    }
    
    // Check for overdue status
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    if (dueDate < today && newRemainingBalance > 0) {
      newStatus = 'overdue';
    }
    
    // Update invoice
    await invoice.update({
      paidAmount: newPaidAmount,
      remainingBalance: Math.max(0, newRemainingBalance), // Ensure non-negative
      status: newStatus
    });
    
    return {
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: newPaidAmount,
        remainingBalance: Math.max(0, newRemainingBalance),
        status: newStatus
      }
    };
    
  } catch (error) {
    console.error('Error updating invoice payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Recalculates and updates invoice status based on current balances
 * @param {number} invoiceId - The invoice ID
 * @returns {Object} Updated invoice with corrected status
 */
const recalculateInvoiceStatus = async (invoiceId) => {
  try {
    const { Invoice } = getModels();
    
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const paidAmount = Number(invoice.paidAmount || 0);
    const totalAmount = Number(invoice.totalAmount);
    const remainingBalance = invoice.remainingBalance !== null && invoice.remainingBalance !== undefined 
      ? Number(invoice.remainingBalance) 
      : totalAmount;
    
    // Ensure remaining balance is correct
    const correctRemainingBalance = totalAmount - paidAmount;
    
    // Determine correct status
    let correctStatus;
    if (correctRemainingBalance <= 0) {
      correctStatus = 'completed';
    } else {
      // Check for overdue status
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      if (dueDate < today) {
        correctStatus = 'overdue';
      } else if (paidAmount > 0) {
        correctStatus = 'partially paid';
      } else {
        correctStatus = 'awaiting payment';
      }
    }
    
    // Update if needed
    const needsUpdate = 
      remainingBalance !== correctRemainingBalance || 
      invoice.status !== correctStatus;
    
    if (needsUpdate) {
      await invoice.update({
        remainingBalance: correctRemainingBalance,
        status: correctStatus
      });
    }
    
    return {
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingBalance: correctRemainingBalance,
        status: correctStatus,
        wasUpdated: needsUpdate
      }
    };
    
  } catch (error) {
    console.error('Error recalculating invoice status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  updateInvoicePayment,
  recalculateInvoiceStatus
};
