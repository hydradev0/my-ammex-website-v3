 Error processing row 37: Error
[0]     at Query.run (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\sequelize\lib\dialects\postgres\query.js:50:25)
[0]     at C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\sequelize\lib\sequelize.js:315:28
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)        
[0]     at async CsvParser.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\controllers\importController.js:186:17) {
[0]   name: 'SequelizeUniqueConstraintError',
[0]   errors: [
[0]     ValidationErrorItem {
[0]       message: 'month_start must be unique',
[0]       type: 'unique violation',
[0]       path: 'month_start',
[0]       value: '2024-01-12',
[0]       origin: 'DB',
[0]       instance: null,
[0]       validatorKey: 'not_unique',
[0]       validatorName: null,
[0]       validatorArgs: []
[0]     },
[0]     ValidationErrorItem {
[0]       message: 'customer_name must be unique',
[0]       type: 'unique violation',
[0]       path: 'customer_name',
[0]       value: 'RUREX',
[0]       origin: 'DB',
[0]       instance: null,
[0]       validatorKey: 'not_unique',
[0]       validatorName: null,
[0]       validatorArgs: []
[0]     }
[0]   ],
[0]   parent: error: duplicate key value violates unique constraint "customer_bulk_monthly_by_name_month_customer_key"
[0]       at Parser.parseErrorMessage (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:285:98)
[0]       at Parser.handlePacket (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:122:29)
[0]       at Parser.parse (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:35:38)
[0]       at TLSSocket.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\index.js:11:42)
[0]       at TLSSocket.emit (node:events:518:28)
[0]       at addChunk (node:internal/streams/readable:561:12)
[0]       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[0]       at Readable.push (node:internal/streams/readable:392:5)
[0]       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
[0]     length: 320,
[0]     severity: 'ERROR',
[0]     code: '23505',
[0]     detail: 'Key (month_start, customer_name)=(2024-01-12, RUREX) already exists.',       
[0]     hint: undefined,
[0]     position: undefined,
[0]     internalPosition: undefined,
[0]     internalQuery: undefined,
[0]     where: undefined,
[0]     schema: 'public',
[0]     table: 'customer_bulk_monthly_by_name',
[0]     column: undefined,
[0]     dataType: undefined,
[0]     constraint: 'customer_bulk_monthly_by_name_month_customer_key',
[0]     file: 'nbtinsert.c',
[0]     line: '667',
[0]     routine: '_bt_check_unique',
[0]     sql: 'INSERT INTO customer_bulk_monthly_by_name \n' +
[0]       '                   (customer_name, bulk_orders_amount, model_no, month_start, created_at, updated_at)\n' +
[0]       '                   VALUES ($1, $2, $3, $4, NOW(), NOW())',
[0]     parameters: [ 'RUREX', 285000, 'G25', '2024-01-12' ]
[0]   },
[0]   original: error: duplicate key value violates unique constraint "customer_bulk_monthly_by_name_month_customer_key"
[0]       at Parser.parseErrorMessage (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:285:98)
[0]       at Parser.handlePacket (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:122:29)
[0]       at Parser.parse (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:35:38)
[0]       at TLSSocket.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\index.js:11:42)
[0]       at TLSSocket.emit (node:events:518:28)
[0]       at addChunk (node:internal/streams/readable:561:12)
[0]       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[0]       at Readable.push (node:internal/streams/readable:392:5)
[0]       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
[0]     length: 320,
[0]     severity: 'ERROR',
[0]     code: '23505',
[0]     detail: 'Key (month_start, customer_name)=(2024-01-12, RUREX) already exists.',       
[0]     hint: undefined,
[0]     position: undefined,
[0]     internalPosition: undefined,
[0]     internalQuery: undefined,
[0]     where: undefined,
[0]     schema: 'public',
[0]     table: 'customer_bulk_monthly_by_name',
[0]     column: undefined,
[0]     dataType: undefined,
[0]     constraint: 'customer_bulk_monthly_by_name_month_customer_key',
[0]     file: 'nbtinsert.c',
[0]     line: '667',
[0]     routine: '_bt_check_unique',
[0]     sql: 'INSERT INTO customer_bulk_monthly_by_name \n' +
[0]       '                   (customer_name, bulk_orders_amount, model_no, month_start, created_at, updated_at)\n' +
[0]       '                   VALUES ($1, $2, $3, $4, NOW(), NOW())',
[0]     parameters: [ 'RUREX', 285000, 'G25', '2024-01-12' ]
[0]   },
[0]   fields: { month_start: '2024-01-12', customer_name: 'RUREX' },
[0]   sql: 'INSERT INTO customer_bulk_monthly_by_name \n' +
[0]     '                   (customer_name, bulk_orders_amount, model_no, month_start, created_at, updated_at)\n' +
[0]     '                   VALUES ($1, $2, $3, $4, NOW(), NOW())'
[0] }
[0] Updating customer_bulk_monthly summary table...
[0] Error updating summary table: Error
[0]     at Query.run (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\sequelize\lib\dialects\postgres\query.js:50:25)
[0]     at C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\sequelize\lib\sequelize.js:315:28
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)        
[0]     at async CsvParser.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\controllers\importController.js:216:17) {
[0]   name: 'SequelizeDatabaseError',
[0]   parent: error: column "created_at" of relation "customer_bulk_monthly" does not exist   
[0]       at Parser.parseErrorMessage (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:285:98)
[0]       at Parser.handlePacket (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:122:29)
[0]       at Parser.parse (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:35:38)
[0]       at TLSSocket.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\index.js:11:42)
[0]       at TLSSocket.emit (node:events:518:28)
[0]       at addChunk (node:internal/streams/readable:561:12)
[0]       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[0]       at Readable.push (node:internal/streams/readable:392:5)
[0]       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
[0]     length: 145,
[0]     severity: 'ERROR',
[0]     code: '42703',
[0]     detail: undefined,
[0]     hint: undefined,
[0]     position: '142',
[0]     internalPosition: undefined,
[0]     internalQuery: undefined,
[0]     where: undefined,
[0]     schema: undefined,
[0]     table: undefined,
[0]     column: undefined,
[0]     dataType: undefined,
[0]     constraint: undefined,
[0]     file: 'parse_target.c',
[0]     line: '1065',
[0]     routine: 'checkInsertTargets',
[0]     sql: 'DELETE FROM customer_bulk_monthly;\n' +
[0]       '                   INSERT INTO customer_bulk_monthly (month_start, bulk_orders_count, bulk_orders_amount, created_at, updated_at)\n' +
[0]       '                   SELECT month_start, COUNT(*) as bulk_orders_count, SUM(bulk_orders_amount) as bulk_orders_amount, NOW(), NOW()\n' +
[0]       '                   FROM customer_bulk_monthly_by_name\n' +
[0]       '                   GROUP BY month_start',
[0]     parameters: undefined
[0]   },
[0]   original: error: column "created_at" of relation "customer_bulk_monthly" does not exist 
[0]       at Parser.parseErrorMessage (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:285:98)
[0]       at Parser.handlePacket (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:122:29)
[0]       at Parser.parse (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\parser.js:35:38)
[0]       at TLSSocket.<anonymous> (C:\Users\Mike\VScode-workspace\AmmexWebsite\my-ammex-website\backend\node_modules\pg-protocol\dist\index.js:11:42)
[0]       at TLSSocket.emit (node:events:518:28)
[0]       at addChunk (node:internal/streams/readable:561:12)
[0]       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[0]       at Readable.push (node:internal/streams/readable:392:5)
[0]       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
[0]     length: 145,
[0]     severity: 'ERROR',
[0]     code: '42703',
[0]     detail: undefined,
[0]     hint: undefined,
[0]     position: '142',
[0]     internalPosition: undefined,
[0]     internalQuery: undefined,
[0]     where: undefined,
[0]     schema: undefined,
[0]     table: undefined,
[0]     column: undefined,
[0]     dataType: undefined,
[0]     constraint: undefined,
[0]     file: 'parse_target.c',
[0]     line: '1065',
[0]     routine: 'checkInsertTargets',
[0]     sql: 'DELETE FROM customer_bulk_monthly;\n' +
[0]       '                   INSERT INTO customer_bulk_monthly (month_start, bulk_orders_count, bulk_orders_amount, created_at, updated_at)\n' +
[0]       '                   SELECT month_start, COUNT(*) as bulk_orders_count, SUM(bulk_orders_amount) as bulk_orders_amount, NOW(), NOW()\n' +
[0]       '                   FROM customer_bulk_monthly_by_name\n' +
[0]       '                   GROUP BY month_start',
[0]     parameters: undefined
[0]   },
[0]   sql: 'DELETE FROM customer_bulk_monthly;\n' +
[0]     '                   INSERT INTO customer_bulk_monthly (month_start, bulk_orders_count, bulk_orders_amount, created_at, updated_at)\n' +
[0]     '                   SELECT month_start, COUNT(*) as bulk_orders_count, SUM(bulk_orders_amount) as bulk_orders_amount, NOW(), NOW()\n' +
[0]     '                   FROM customer_bulk_monthly_by_name\n' +
[0]     '                   GROUP BY month_start',
[0]   parameters: {}
[0] }
[0] ✓ Import complete: 30 imported, 7 failed
[0] === CSV IMPORT FINISHED ===