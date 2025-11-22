const { QueryTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

class SummaryReportController {
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
      // Note: We calculate sales with discounts applied by proportionally distributing
      // the invoice's final total_amount (after discount) across invoice items
      const topProducts = await getSequelize().query(`
        SELECT 
          sfp.month_start,
          sfp.model_no,
          sfp.category_name,
          sfp.order_count,
          COALESCE(product_sales.total_sales, 0) as total_sales
        FROM u_sales_fact_monthly_by_product sfp
        LEFT JOIN (
          WITH invoice_subtotals AS (
            SELECT 
              i.id as invoice_id,
              SUM(ii.total_price) as invoice_subtotal
            FROM "Invoice" i
            JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
            WHERE DATE_TRUNC('month', i.invoice_date)::date = :monthStart
            GROUP BY i.id
          )
          SELECT 
            item.model_no,
            DATE_TRUNC('month', i.invoice_date)::date as month_start,
            SUM(
              CASE 
                WHEN ist.invoice_subtotal > 0 
                THEN (ii.total_price / ist.invoice_subtotal) * i.total_amount
                ELSE 0
              END
            ) as total_sales
          FROM "Invoice" i
          JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
          JOIN "Item" item ON ii.item_id = item.id
          JOIN invoice_subtotals ist ON i.id = ist.invoice_id
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

  // Get weekly report data for a specific year, month, and week
  getWeeklyReport = async (req, res) => {
    try {
      const { year, month, week } = req.params;
      
      // Validate inputs
      if (!year || !month || !week) {
        return res.status(400).json({
          success: false,
          error: 'Year, month, and week are required'
        });
      }

      // Convert month name to number
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNumber = monthNames.indexOf(month) + 1;
      
      if (monthNumber === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid month: ${month}`
        });
      }

      // Calculate week start date (first day of the week within the month)
      // Week 1 starts on the 1st, Week 2 starts on the 8th, etc.
      const weekNumber = parseInt(week);
      if (weekNumber < 1 || weekNumber > 5) {
        return res.status(400).json({
          success: false,
          error: 'Week must be between 1 and 5'
        });
      }

      // Calculate the start date of the week (1st, 8th, 15th, 22nd, or 29th)
      const weekStartDay = (weekNumber - 1) * 7 + 1;
      const weekStart = `${year}-${String(monthNumber).padStart(2, '0')}-${String(weekStartDay).padStart(2, '0')}`;
      
      // Calculate week end date (last day of the week, but not beyond month end)
      const lastDayOfMonth = new Date(year, monthNumber, 0).getDate();
      const weekEndDay = Math.min(weekStartDay + 6, lastDayOfMonth);
      const weekEnd = `${year}-${String(monthNumber).padStart(2, '0')}-${String(weekEndDay).padStart(2, '0')}`;

      // Get sales data for the week
      const salesData = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(i.total_amount), 0) as total_revenue,
          COUNT(i.id) as total_orders,
          COALESCE(SUM(ii.quantity), 0) as total_units,
          COALESCE(AVG(i.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT CASE 
            WHEN DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', i.invoice_date) 
            THEN c.id 
          END) as new_customers
        FROM "Invoice" i
        LEFT JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
        LEFT JOIN "Customer" c ON i.customer_id = c.id
        WHERE i.invoice_date >= :weekStart::date
          AND i.invoice_date <= :weekEnd::date
      `, {
        replacements: { weekStart, weekEnd },
        type: QueryTypes.SELECT
      });

      // Get bulk order data for the week
      const bulkData = await getSequelize().query(`
        SELECT 
          COUNT(DISTINCT i.id) as bulk_orders_count,
          COALESCE(SUM(i.total_amount), 0) as bulk_orders_amount
        FROM "Invoice" i
        WHERE i.invoice_date >= :weekStart::date
          AND i.invoice_date <= :weekEnd::date
          AND i.total_amount >= 10000
      `, {
        replacements: { weekStart, weekEnd },
        type: QueryTypes.SELECT
      });

      // Get top products for the week
      const topProducts = await getSequelize().query(`
        WITH invoice_subtotals AS (
          SELECT 
            i.id as invoice_id,
            SUM(ii.total_price) as invoice_subtotal
          FROM "Invoice" i
          JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
          WHERE i.invoice_date >= :weekStart::date
            AND i.invoice_date <= :weekEnd::date
          GROUP BY i.id
        )
        SELECT 
          item.model_no,
          COALESCE(cat.name, 'Uncategorized') as category_name,
          COUNT(DISTINCT i.id) as order_count,
          SUM(
            CASE 
              WHEN ist.invoice_subtotal > 0 
              THEN (ii.total_price / ist.invoice_subtotal) * i.total_amount
              ELSE 0
            END
          ) as total_sales
        FROM "Invoice" i
        JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
        JOIN "Item" item ON ii.item_id = item.id
        LEFT JOIN "Category" cat ON item.category_id = cat.id
        JOIN invoice_subtotals ist ON i.id = ist.invoice_id
        WHERE i.invoice_date >= :weekStart::date
          AND i.invoice_date <= :weekEnd::date
        GROUP BY item.model_no, cat.name
        ORDER BY order_count DESC
        LIMIT 10
      `, {
        replacements: { weekStart, weekEnd },
        type: QueryTypes.SELECT
      });

      // Get top customers for the week
      const topCustomers = await getSequelize().query(`
        SELECT 
          c.customer_name,
          COUNT(DISTINCT i.id) as bulk_orders_count,
          COALESCE(SUM(i.total_amount), 0) as bulk_orders_amount,
          COALESCE(AVG(i.total_amount), 0) as average_bulk_order_value,
          STRING_AGG(DISTINCT item.model_no, ', ') as model_no
        FROM "Invoice" i
        JOIN "Customer" c ON i.customer_id = c.id
        LEFT JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
        LEFT JOIN "Item" item ON ii.item_id = item.id
        WHERE i.invoice_date >= :weekStart::date
          AND i.invoice_date <= :weekEnd::date
          AND i.total_amount >= 10000
        GROUP BY c.customer_name
        ORDER BY bulk_orders_amount DESC
        LIMIT 10
      `, {
        replacements: { weekStart, weekEnd },
        type: QueryTypes.SELECT
      });

      // Format response
      const sales = salesData[0] || {};
      const bulk = bulkData[0] || {};

      let avgBulkAmount = 0;
      const totalBulkOrders = parseInt(bulk.bulk_orders_count || 0);
      const totalBulkAmount = parseFloat(bulk.bulk_orders_amount || 0);
      
      if (totalBulkOrders > 0) {
        avgBulkAmount = parseFloat((totalBulkAmount / totalBulkOrders).toFixed(2));
      }

      const response = {
        totalRevenue: parseFloat(sales.total_revenue || 0),
        numberOfOrders: parseInt(sales.total_orders || 0),
        avgOrderValue: parseFloat(sales.avg_order_value || 0),
        totalBulkOrders: totalBulkOrders,
        totalBulkAmount: totalBulkAmount,
        avgBulkAmount: avgBulkAmount,
        
        topProducts: topProducts.map(p => ({
          modelNo: p.model_no,
          category: p.category_name,
          orderCount: parseInt(p.order_count || 0),
          sales: parseFloat(p.total_sales || 0)
        })),
        
        topCustomers: topCustomers.map(c => ({
          customer: c.customer_name,
          bulkCount: parseInt(c.bulk_orders_count || 0),
          bulkAmount: parseFloat(c.bulk_orders_amount || 0),
          avgBulkAmount: parseFloat(c.average_bulk_order_value || 0),
          modelNo: c.model_no || 'N/A'
        }))
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error fetching weekly report data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weekly report data',
        details: error.message
      });
    }
  }

  // Get available weeks for a specific year and month
  // Returns all possible weeks (1-5) for the month, regardless of whether they have data
  getAvailableWeeks = async (req, res) => {
    try {
      const { year, month } = req.params;
      
      // Convert month name to number
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const monthNumber = monthNames.indexOf(month) + 1;
      
      if (monthNumber === 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid month: ${month}`
        });
      }

      // Get the number of days in the month
      const lastDayOfMonth = new Date(year, monthNumber, 0).getDate();
      
      // Calculate all possible weeks for this month
      // Week 1 = days 1-7, Week 2 = days 8-14, Week 3 = days 15-21, Week 4 = days 22-28, Week 5 = days 29-end
      const weeks = [];
      
      // Always include week 1 (days 1-7)
      weeks.push(1);
      
      // Week 2 exists if month has at least 8 days
      if (lastDayOfMonth >= 8) {
        weeks.push(2);
      }
      
      // Week 3 exists if month has at least 15 days
      if (lastDayOfMonth >= 15) {
        weeks.push(3);
      }
      
      // Week 4 exists if month has at least 22 days
      if (lastDayOfMonth >= 22) {
        weeks.push(4);
      }
      
      // Week 5 exists if month has at least 29 days
      if (lastDayOfMonth >= 29) {
        weeks.push(5);
      }

      res.json({
        success: true,
        data: weeks.map(w => w.toString())
      });
    } catch (error) {
      console.error('Error fetching available weeks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available weeks',
        details: error.message
      });
    }
  }

  // Get annual report data for a specific year
  getAnnualReport = async (req, res) => {
    try {
      const { year } = req.params;
      
      if (!year) {
        return res.status(400).json({
          success: false,
          error: 'Year is required'
        });
      }

      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      // Get sales data for the year (aggregate from monthly data)
      const salesData = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(total_revenue), 0) as total_revenue,
          COALESCE(SUM(total_orders), 0) as total_orders,
          COALESCE(SUM(total_units), 0) as total_units,
          COALESCE(AVG(avg_order_value), 0) as avg_order_value,
          COALESCE(SUM(new_customers), 0) as new_customers
        FROM u_sales_fact_monthly
        WHERE EXTRACT(YEAR FROM month_start) = :year
      `, {
        replacements: { year },
        type: QueryTypes.SELECT
      });

      // Get bulk order data for the year
      const bulkData = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(bulk_orders_count), 0) as bulk_orders_count,
          COALESCE(SUM(bulk_orders_amount), 0) as bulk_orders_amount
        FROM u_customer_bulk_monthly
        WHERE EXTRACT(YEAR FROM month_start) = :year
      `, {
        replacements: { year },
        type: QueryTypes.SELECT
      });

      // Get top products for the year (aggregate from monthly data)
      const topProducts = await getSequelize().query(`
        SELECT 
          sfp.model_no,
          sfp.category_name,
          SUM(sfp.order_count) as order_count,
          SUM(COALESCE(product_sales.total_sales, 0)) as total_sales
        FROM u_sales_fact_monthly_by_product sfp
        LEFT JOIN (
          WITH invoice_subtotals AS (
            SELECT 
              i.id as invoice_id,
              SUM(ii.total_price) as invoice_subtotal
            FROM "Invoice" i
            JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
            WHERE EXTRACT(YEAR FROM i.invoice_date) = :year
            GROUP BY i.id
          )
          SELECT 
            item.model_no,
            EXTRACT(YEAR FROM i.invoice_date) as year,
            SUM(
              CASE 
                WHEN ist.invoice_subtotal > 0 
                THEN (ii.total_price / ist.invoice_subtotal) * i.total_amount
                ELSE 0
              END
            ) as total_sales
          FROM "Invoice" i
          JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
          JOIN "Item" item ON ii.item_id = item.id
          JOIN invoice_subtotals ist ON i.id = ist.invoice_id
          WHERE EXTRACT(YEAR FROM i.invoice_date) = :year
          GROUP BY item.model_no, EXTRACT(YEAR FROM i.invoice_date)
        ) product_sales ON sfp.model_no = product_sales.model_no 
                       AND EXTRACT(YEAR FROM sfp.month_start) = product_sales.year
        WHERE EXTRACT(YEAR FROM sfp.month_start) = :year
        GROUP BY sfp.model_no, sfp.category_name
        ORDER BY order_count DESC
        LIMIT 10
      `, {
        replacements: { year },
        type: QueryTypes.SELECT
      });

      // Get top customers for the year
      const topCustomers = await getSequelize().query(`
        SELECT 
          customer_name,
          SUM(bulk_orders_count) as bulk_orders_count,
          SUM(bulk_orders_amount) as bulk_orders_amount,
          AVG(average_bulk_order_value) as average_bulk_order_value,
          STRING_AGG(DISTINCT model_no, ', ') as model_no
        FROM u_customer_bulk_monthly_by_name
        WHERE EXTRACT(YEAR FROM month_start) = :year
        GROUP BY customer_name
        ORDER BY bulk_orders_amount DESC
        LIMIT 10
      `, {
        replacements: { year },
        type: QueryTypes.SELECT
      });

      // Format response
      const sales = salesData[0] || {};
      const bulk = bulkData[0] || {};

      let avgBulkAmount = 0;
      const totalBulkOrders = parseInt(bulk.bulk_orders_count || 0);
      const totalBulkAmount = parseFloat(bulk.bulk_orders_amount || 0);
      
      if (totalBulkOrders > 0) {
        avgBulkAmount = parseFloat((totalBulkAmount / totalBulkOrders).toFixed(2));
      }

      const response = {
        totalRevenue: parseFloat(sales.total_revenue || 0),
        numberOfOrders: parseInt(sales.total_orders || 0),
        avgOrderValue: parseFloat(sales.avg_order_value || 0),
        totalBulkOrders: totalBulkOrders,
        totalBulkAmount: totalBulkAmount,
        avgBulkAmount: avgBulkAmount,
        
        topProducts: topProducts.map(p => ({
          modelNo: p.model_no,
          category: p.category_name,
          orderCount: parseInt(p.order_count || 0),
          sales: parseFloat(p.total_sales || 0)
        })),
        
        topCustomers: topCustomers.map(c => ({
          customer: c.customer_name,
          bulkCount: parseInt(c.bulk_orders_count || 0),
          bulkAmount: parseFloat(c.bulk_orders_amount || 0),
          avgBulkAmount: parseFloat(c.average_bulk_order_value || 0),
          modelNo: c.model_no || 'N/A'
        }))
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Error fetching annual report data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch annual report data',
        details: error.message
      });
    }
  }
}

module.exports = new SummaryReportController();
