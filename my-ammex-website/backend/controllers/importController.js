const { Sequelize } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { getSequelize } = require('../config/db');
const sequelize = getSequelize();

// Helper function to convert date formats (DD/MM/YYYY to YYYY-MM-DD)
const convertDateToISO = (dateString) => {
  if (!dateString) return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle DD/MM/YYYY format (day first, then month)
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  
  return null;
};

// Import CSV data into the database
exports.importCSV = async (req, res) => {
  console.log('\n=== CSV IMPORT STARTED ===');
  console.log('Type:', req.body.type);
  console.log('File:', req.file?.filename);
  
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file || !type) {
      return res.status(400).json({
        success: false,
        message: !file ? 'Please upload a CSV file' : 'Please specify import type'
      });
    }

    // Read and parse CSV file
    const results = [];
    const errors = [];
    let rowNumber = 0;

    const stream = fs.createReadStream(file.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\uFEFF/, ''),
        mapValues: ({ value }) => value ? value.trim() : value
      }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          let skipped = 0;
          let failed = 0;

          console.log(`Processing ${results.length} rows...`);

          if (type === 'sales') {
            // Import monthly sales data into sales_fact_monthly
            
            for (const row of results) {
              rowNumber++;
              try {
                // Convert date format
                const convertedDate = convertDateToISO(row.month_start);
                
                // Validate required fields
                if (!convertedDate) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing or invalid month_start field. Expected format: YYYY-MM-DD or MM/DD/YYYY'
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
                   ON CONFLICT (month_start) 
                   DO UPDATE SET 
                     total_revenue = EXCLUDED.total_revenue,
                     total_orders = EXCLUDED.total_orders,
                     total_units = EXCLUDED.total_units,
                     avg_order_value = EXCLUDED.avg_order_value,
                     new_customers = EXCLUDED.new_customers,
                     updated_at = NOW()`,
                  {
                    bind: [
                      convertedDate,
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
                // Convert date format
                const convertedDate = convertDateToISO(row.month_start);
                
                // Validate required fields
                if (!convertedDate || !row.model_no) {
                  errors.push({
                    row: rowNumber,
                    message: 'Missing required fields or invalid date format. Expected: month_start (YYYY-MM-DD or MM/DD/YYYY), model_no'
                  });
                  failed++;
                  continue;
                }

                // Insert into sales_fact_monthly_by_product table
                await sequelize.query(
                  `INSERT INTO sales_fact_monthly_by_product 
                   (month_start, model_no, category_name, created_at)
                   VALUES ($1, $2, $3, NOW())
                   ON CONFLICT (month_start, model_no) 
                   DO UPDATE SET 
                     category_name = EXCLUDED.category_name`,
                  {
                    bind: [
                      convertedDate,
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
                // Convert date format
                const convertedDate = convertDateToISO(row.month_start);
                
                // Validate required fields
                if (!row.customer_name || !convertedDate || !row.model_no) {
                  errors.push({
                    row: rowNumber,
                    message: `Missing/invalid fields. Got: month_start="${row.month_start}", customer_name="${row.customer_name}", model_no="${row.model_no}"`
                  });
                  failed++;
                  continue;
                }

                // Insert into customer_bulk_monthly_by_name table
                // Calculate bulk_orders_count and average_bulk_order_value
                const bulkAmount = parseFloat(row.bulk_orders_amount) || 0;
                const bulkCount = 1; // Each CSV row represents 1 order
                const avgValue = bulkCount > 0 ? bulkAmount / bulkCount : 0;
                
                await sequelize.query(
                  `INSERT INTO customer_bulk_monthly_by_name 
                   (customer_name, bulk_orders_amount, bulk_orders_count, average_bulk_order_value, model_no, month_start, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                   ON CONFLICT (month_start, customer_name) 
                   DO UPDATE SET 
                     bulk_orders_amount = EXCLUDED.bulk_orders_amount,
                     bulk_orders_count = EXCLUDED.bulk_orders_count,
                     average_bulk_order_value = EXCLUDED.average_bulk_order_value,
                     model_no = EXCLUDED.model_no,
                     updated_at = NOW()`,
                  {
                    bind: [
                      row.customer_name,
                      bulkAmount,
                      bulkCount,
                      avgValue,
                      row.model_no,
                      convertedDate
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
                  `DELETE FROM customer_bulk_monthly;
                   INSERT INTO customer_bulk_monthly (month_start, bulk_orders_count, bulk_orders_amount)
                   SELECT month_start, COUNT(*) as bulk_orders_count, SUM(bulk_orders_amount) as bulk_orders_amount
                   FROM customer_bulk_monthly_by_name
                   GROUP BY month_start`,
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

          console.log(`✓ Import complete: ${imported} imported, ${failed} failed`);
          console.log('=== CSV IMPORT FINISHED ===\n');

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
