const { Sequelize } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');

// Import CSV data into the database
exports.importCSV = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Please specify import type (sales, sales_by_product, or bulk)'
      });
    }

    // Read and parse CSV file
    const results = [];
    const errors = [];
    let rowNumber = 0;

    const stream = fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          let skipped = 0;
          let failed = 0;

          console.log(`Starting import of ${results.length} rows for type: ${type}...`);

          if (type === 'sales') {
            // Import monthly sales data into sales_fact_monthly
            for (const row of results) {
              rowNumber++;
              try {
                // Validate required fields
                if (!row.month_start) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing required field: month_start'
                  });
                  failed++;
                  continue;
                }

                if (!row.total_revenue) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing required field: total_revenue'
                  });
                  failed++;
                  continue;
                }

                // Insert into sales_fact_monthly table
                await sequelize.query(
                  `INSERT INTO sales_fact_monthly 
                   (month_start, total_revenue, total_orders, total_units, avg_order_value, new_customers, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                   ON CONFLICT (month_start) DO UPDATE SET
                   total_revenue = EXCLUDED.total_revenue,
                   total_orders = EXCLUDED.total_orders,
                   total_units = EXCLUDED.total_units,
                   avg_order_value = EXCLUDED.avg_order_value,
                   new_customers = EXCLUDED.new_customers,
                   updated_at = NOW()`,
                  {
                    bind: [
                      row.month_start,
                      parseFloat(row.total_revenue) || 0,
                      parseInt(row.total_orders) || 0,
                      parseInt(row.total_units) || 0,
                      parseFloat(row.avg_order_value) || 0,
                      parseInt(row.new_customers) || 0
                    ],
                    type: Sequelize.QueryTypes.INSERT
                  }
                );
                
                imported++;
              } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                errors.push({
                  row: rowNumber,
                  message: error.message || 'Unknown error'
                });
                failed++;
              }
            }
          } else if (type === 'sales_by_product') {
            // Import sales by product into sales_fact_monthly_by_product
            for (const row of results) {
              rowNumber++;
              try {
                // Validate required fields
                if (!row.month_start || !row.model_no) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing required fields: month_start or model_no'
                  });
                  failed++;
                  continue;
                }

                // Insert into sales_fact_monthly_by_product table
                await sequelize.query(
                  `INSERT INTO sales_fact_monthly_by_product 
                   (month_start, model_no, category_name, created_at, updated_at)
                   VALUES ($1, $2, $3, NOW(), NOW())
                   ON CONFLICT (month_start, model_no) DO UPDATE SET
                   category_name = EXCLUDED.category_name,
                   updated_at = NOW()`,
                  {
                    bind: [
                      row.month_start,
                      row.model_no,
                      row.category_name || null
                    ],
                    type: Sequelize.QueryTypes.INSERT
                  }
                );
                
                imported++;
              } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                errors.push({
                  row: rowNumber,
                  message: error.message || 'Unknown error'
                });
                failed++;
              }
            }
          } else if (type === 'bulk') {
            // Import customer bulk orders into customer_bulk_monthly_by_name
            for (const row of results) {
              rowNumber++;
              try {
                // Validate required fields
                if (!row.customer_name || !row.month_start || !row.model_no) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing required fields: customer_name, month_start, or model_no'
                  });
                  failed++;
                  continue;
                }

                // Insert into customer_bulk_monthly_by_name table
                await sequelize.query(
                  `INSERT INTO customer_bulk_monthly_by_name 
                   (customer_name, bulk_orders_amount, model_no, month_start, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, NOW(), NOW())
                   ON CONFLICT (customer_name, model_no, month_start) DO UPDATE SET
                   bulk_orders_amount = EXCLUDED.bulk_orders_amount,
                   updated_at = NOW()`,
                  {
                    bind: [
                      row.customer_name,
                      parseFloat(row.bulk_orders_amount) || 0,
                      row.model_no,
                      row.month_start
                    ],
                    type: Sequelize.QueryTypes.INSERT
                  }
                );
                
                imported++;
              } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                errors.push({
                  row: rowNumber,
                  message: error.message || 'Unknown error'
                });
                failed++;
              }
            }

            // After importing to customer_bulk_monthly_by_name, update the summary table
            if (imported > 0) {
              try {
                console.log('Updating customer_bulk_monthly summary table...');
                await sequelize.query(
                  `INSERT INTO customer_bulk_monthly (month_start, bulk_orders_count, bulk_orders_amount, created_at, updated_at)
                   SELECT month_start, COUNT(*) as bulk_orders_count, SUM(bulk_orders_amount) as bulk_orders_amount, NOW(), NOW()
                   FROM customer_bulk_monthly_by_name
                   GROUP BY month_start
                   ON CONFLICT (month_start) DO UPDATE SET
                   bulk_orders_count = EXCLUDED.bulk_orders_count,
                   bulk_orders_amount = EXCLUDED.bulk_orders_amount,
                   updated_at = NOW()`,
                  { type: Sequelize.QueryTypes.INSERT }
                );
                console.log('Summary table updated successfully');
              } catch (error) {
                console.error('Error updating summary table:', error);
                // Don't fail the entire import if summary fails
              }
            }
          } else {
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            return res.status(400).json({
              success: false,
              message: 'Invalid import type. Must be sales, sales_by_product, or bulk'
            });
          }

          // Clean up uploaded file
          fs.unlinkSync(file.path);

          const message = imported > 0 
            ? `Import completed successfully. ${imported} rows imported${failed > 0 ? `, ${failed} rows failed` : ''}.`
            : 'Import completed but no rows were imported.';

          return res.status(200).json({
            success: true,
            message,
            stats: {
              total: results.length,
              imported,
              skipped,
              failed
            },
            errors: errors.slice(0, 50) // Return first 50 errors
          });

        } catch (error) {
          console.error('Import error:', error);
          
          // Clean up uploaded file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          return res.status(500).json({
            success: false,
            message: 'Error importing data',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(500).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('Import controller error:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Error processing import request',
      error: error.message
    });
  }
};

// Get import history (optional, for tracking past imports)
exports.getImportHistory = async (req, res) => {
  try {
    // TODO: Implement import history tracking if needed
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching import history',
      error: error.message
    });
  }
};
