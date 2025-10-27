const { QueryTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

class MonthlyReportController {
  // Get monthly report data for a specific year and month
  getMonthlyReport = async (req, res) => {
    try {
      const { year, month } = req.params;
      
      // Validate inputs
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          error: 'Year and month are required'
        });
      }

      // Convert month name to number (e.g., "October" -> 10)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNumber = monthNames.indexOf(month) + 1;
      
      if (monthNumber === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid month: ${month}`
        });
      }

      // Format date as YYYY-MM-01
      const monthStart = `${year}-${String(monthNumber).padStart(2, '0')}-01`;

      // Get sales data from u_sales_fact_monthly
      const salesData = await getSequelize().query(`
        SELECT 
          month_start,
          total_revenue,
          total_orders,
          total_units,
          avg_order_value,
          new_customers
        FROM u_sales_fact_monthly
        WHERE month_start = :monthStart
      `, {
        replacements: { monthStart },
        type: QueryTypes.SELECT
      });

      // Get bulk order data from u_customer_bulk_monthly
      const bulkData = await getSequelize().query(`
        SELECT 
          month_start,
          bulk_orders_count,
          bulk_orders_amount
        FROM u_customer_bulk_monthly
        WHERE month_start = :monthStart
      `, {
        replacements: { monthStart },
        type: QueryTypes.SELECT
      });

      // Get top products from u_sales_fact_monthly_by_product
      // Note: We join with InvoiceItem to get actual sales revenue for each product
      const topProducts = await getSequelize().query(`
        SELECT 
          sfp.month_start,
          sfp.model_no,
          sfp.category_name,
          sfp.order_count,
          COALESCE(product_sales.total_sales, 0) as total_sales
        FROM u_sales_fact_monthly_by_product sfp
        LEFT JOIN (
          SELECT 
            item.model_no,
            DATE_TRUNC('month', i.invoice_date)::date as month_start,
            SUM(ii.total_price) as total_sales
          FROM "Invoice" i
          JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
          JOIN "Item" item ON ii.item_id = item.id
          WHERE DATE_TRUNC('month', i.invoice_date)::date = :monthStart
          GROUP BY item.model_no, DATE_TRUNC('month', i.invoice_date)::date
        ) product_sales ON sfp.model_no = product_sales.model_no 
                       AND sfp.month_start = product_sales.month_start
        WHERE sfp.month_start = :monthStart
        ORDER BY sfp.order_count DESC
        LIMIT 10
      `, {
        replacements: { monthStart },
        type: QueryTypes.SELECT
      });

      // Get top customers from u_customer_bulk_monthly_by_name
      const topCustomers = await getSequelize().query(`
        SELECT 
          month_start,
          customer_name,
          bulk_orders_count,
          bulk_orders_amount,
          average_bulk_order_value,
          model_no
        FROM u_customer_bulk_monthly_by_name
        WHERE month_start = :monthStart
        ORDER BY bulk_orders_amount DESC
        LIMIT 10
      `, {
        replacements: { monthStart },
        type: QueryTypes.SELECT
      });

      // Format response matching the UI labels in MonthlyReport.jsx
      const sales = salesData[0] || {};
      const bulk = bulkData[0] || {};

      // Calculate average bulk amount
      // Note: For historical data, bulk_orders_count might represent individual invoice lines,
      // not actual invoice count. We use the total_orders from sales data as a fallback.
      let avgBulkAmount = 0;
      const totalBulkOrders = parseInt(bulk.bulk_orders_count || 0);
      const totalBulkAmount = parseFloat(bulk.bulk_orders_amount || 0);
      
      if (totalBulkOrders > 0) {
        const calculatedAvg = totalBulkAmount / totalBulkOrders;
        // Safety check: If calculated average is suspiciously high (higher than total),
        // it means bulk_orders_count is not actually counting invoices but invoice lines.
        // In this case, use the total_orders from sales_fact_monthly instead.
        if (calculatedAvg > totalBulkAmount) {
          // Use total_orders from sales data as it represents actual invoices
          const actualOrderCount = parseInt(sales.total_orders || 0);
          avgBulkAmount = actualOrderCount > 0 
            ? parseFloat((totalBulkAmount / actualOrderCount).toFixed(2))
            : 0;
        } else {
          avgBulkAmount = parseFloat(calculatedAvg.toFixed(2));
        }
      }

      const response = {
        // Overall Performance metrics
        totalRevenue: parseFloat(sales.total_revenue || 0),
        numberOfOrders: parseInt(sales.total_orders || 0),
        avgOrderValue: parseFloat(sales.avg_order_value || 0),
        totalBulkOrders: totalBulkOrders,
        totalBulkAmount: totalBulkAmount,
        avgBulkAmount: avgBulkAmount,
        
        // Top Products
        topProducts: topProducts.map(p => ({
          modelNo: p.model_no,
          category: p.category_name,
          orderCount: parseInt(p.order_count || 0),
          sales: parseFloat(p.total_sales || 0)
        })),
        
        // Top Customers
        topCustomers: topCustomers.map(c => ({
          customer: c.customer_name,
          bulkCount: parseInt(c.bulk_orders_count || 0),
          bulkAmount: parseFloat(c.bulk_orders_amount || 0),
          avgBulkAmount: parseFloat(c.average_bulk_order_value || 0),
          modelNo: c.model_no
        }))
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error fetching monthly report data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch monthly report data',
        details: error.message
      });
    }
  }

  // Get available years for dropdown
  getAvailableYears = async (req, res) => {
    try {
      const years = await getSequelize().query(`
        SELECT DISTINCT EXTRACT(YEAR FROM month_start) as year
        FROM u_sales_fact_monthly
        ORDER BY year DESC
      `, { type: QueryTypes.SELECT });

      res.json({
        success: true,
        data: years.map(y => y.year.toString())
      });
    } catch (error) {
      console.error('Error fetching available years:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available years',
        details: error.message
      });
    }
  }

  // Get available months for a specific year
  getAvailableMonths = async (req, res) => {
    try {
      const { year } = req.params;
      
      const months = await getSequelize().query(`
        SELECT DISTINCT EXTRACT(MONTH FROM month_start) as month
        FROM u_sales_fact_monthly
        WHERE EXTRACT(YEAR FROM month_start) = :year
        ORDER BY month DESC
      `, {
        replacements: { year },
        type: QueryTypes.SELECT
      });

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

      res.json({
        success: true,
        data: months.map(m => monthNames[m.month - 1])
      });
    } catch (error) {
      console.error('Error fetching available months:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available months',
        details: error.message
      });
    }
  }
}

module.exports = new MonthlyReportController();
