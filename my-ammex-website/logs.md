2025-11-06T08:56:17.496702706Z 🔔 WEBHOOK RECEIVED: POST /api/payments/webhook at 2025-11-06T08:56:17.493Z
2025-11-06T08:56:17.508273479Z 127.0.0.1 - - [06/Nov/2025:08:56:17 +0000] "POST /api/payments/webhook HTTP/1.1" 200 71 "-" "Ruby"
2025-11-06T08:56:17.50828321Z 🔄 Processing webhook in background...
2025-11-06T08:56:17.50828758Z Headers: {
2025-11-06T08:56:17.50829219Z   "host": "ammex.onrender.com",
2025-11-06T08:56:17.50829653Z   "user-agent": "Ruby",
2025-11-06T08:56:17.50830089Z   "content-length": "829",
2025-11-06T08:56:17.50830504Z   "accept": "*/*",
2025-11-06T08:56:17.50830904Z   "accept-encoding": "gzip, br",
2025-11-06T08:56:17.50831294Z   "cdn-loop": "cloudflare; loops=1",
2025-11-06T08:56:17.50831712Z   "cf-connecting-ip": "13.215.113.49",
2025-11-06T08:56:17.50832164Z   "cf-ipcountry": "SG",
2025-11-06T08:56:17.508325621Z   "cf-ray": "99a3607519d8fd29-SIN",
2025-11-06T08:56:17.508329661Z   "cf-visitor": "{\"scheme\":\"https\"}",
2025-11-06T08:56:17.508333661Z   "content-type": "application/json",
2025-11-06T08:56:17.508337531Z   "paymongo-signature": "t=1762419377,te=19cf3deef5413185c33d81ba62727d00f7504ebb4684419421c13ec660858fcf,li=",
2025-11-06T08:56:17.508341411Z   "render-proxy-ttl": "4",
2025-11-06T08:56:17.508345381Z   "rndr-id": "aa755e45-b10c-47ed",
2025-11-06T08:56:17.508349621Z   "traceparent": "00-690c62b1000000002fa6ba63d8ffca11-36c6f850b2092288-01",
2025-11-06T08:56:17.508354371Z   "tracestate": "dd=p:36c6f850b2092288;s:2;t.dm:-3",
2025-11-06T08:56:17.508358331Z   "true-client-ip": "13.215.113.49",
2025-11-06T08:56:17.508362332Z   "x-datadog-parent-id": "3947115148904833672",
2025-11-06T08:56:17.508366652Z   "x-datadog-sampling-priority": "2",
2025-11-06T08:56:17.508370452Z   "x-datadog-tags": "_dd.p.dm=-3,_dd.p.tid=690c62b100000000",
2025-11-06T08:56:17.508374412Z   "x-datadog-trace-id": "3433636703921752593",
2025-11-06T08:56:17.508378732Z   "x-forwarded-for": "13.215.113.49, 162.158.108.35, 10.16.108.140",
2025-11-06T08:56:17.508394752Z   "x-forwarded-proto": "https",
2025-11-06T08:56:17.508398182Z   "x-request-start": "1762419377491039"
2025-11-06T08:56:17.508401002Z }
2025-11-06T08:56:17.508403972Z Body: {
2025-11-06T08:56:17.508406322Z   "data": {
2025-11-06T08:56:17.508408062Z     "id": "evt_DKssHXrNJx4bkfykYZzC93ao",
2025-11-06T08:56:17.508409722Z     "type": "event",
2025-11-06T08:56:17.508411393Z     "attributes": {
2025-11-06T08:56:17.508413042Z       "type": "source.chargeable",
2025-11-06T08:56:17.508414793Z       "livemode": false,
2025-11-06T08:56:17.508416473Z       "data": {
2025-11-06T08:56:17.508418313Z         "id": "src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508420083Z         "type": "source",
2025-11-06T08:56:17.508421763Z         "attributes": {
2025-11-06T08:56:17.508423423Z           "amount": 5000,
2025-11-06T08:56:17.508425183Z           "billing": null,
2025-11-06T08:56:17.508427103Z           "currency": "PHP",
2025-11-06T08:56:17.508428773Z           "description": null,
2025-11-06T08:56:17.508430573Z           "livemode": false,
2025-11-06T08:56:17.508432313Z           "redirect": {
2025-11-06T08:56:17.508434853Z             "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508437133Z             "failed": "http://localhost:5173/Products/Payment?invoiceId=71&payment=failed&reason=Payment was declined or cancelled",
2025-11-06T08:56:17.508439243Z             "success": "http://localhost:5173/Products/Invoices?payment=success"
2025-11-06T08:56:17.508441963Z           },
2025-11-06T08:56:17.508445153Z           "statement_descriptor": null,
2025-11-06T08:56:17.508447743Z           "status": "chargeable",
2025-11-06T08:56:17.508450193Z           "type": "gcash",
2025-11-06T08:56:17.508452694Z           "metadata": {
2025-11-06T08:56:17.508455323Z             "payment_id": "174",
2025-11-06T08:56:17.508457754Z             "invoice_id": "71"
2025-11-06T08:56:17.508460343Z           },
2025-11-06T08:56:17.508462934Z           "created_at": 1762419370,
2025-11-06T08:56:17.508465414Z           "updated_at": 1762419377
2025-11-06T08:56:17.508467944Z         }
2025-11-06T08:56:17.508470904Z       },
2025-11-06T08:56:17.508473394Z       "previous_data": {},
2025-11-06T08:56:17.508475124Z       "pending_webhooks": 1,
2025-11-06T08:56:17.508476794Z       "created_at": 1762419377,
2025-11-06T08:56:17.508492904Z       "updated_at": 1762419377
2025-11-06T08:56:17.508496074Z     }
2025-11-06T08:56:17.508498555Z   }
2025-11-06T08:56:17.508500855Z }
2025-11-06T08:56:17.508504444Z Signature: t=1762419377,te=19cf3deef5413185c33d81ba62727d00f7504ebb4684419421c13ec660858fcf,li=
2025-11-06T08:56:17.508507445Z Has Signature: true
2025-11-06T08:56:17.508510175Z ✅ Signature verification skipped (for debugging)
2025-11-06T08:56:17.508512725Z 📦 Event Type: source.chargeable
2025-11-06T08:56:17.508515395Z 📦 Event ID: evt_DKssHXrNJx4bkfykYZzC93ao
2025-11-06T08:56:17.508517825Z 📦 Event Data: {
2025-11-06T08:56:17.508520535Z   "id": "src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508522985Z   "type": "source",
2025-11-06T08:56:17.508525505Z   "attributes": {
2025-11-06T08:56:17.508528245Z     "amount": 5000,
2025-11-06T08:56:17.508530685Z     "billing": null,
2025-11-06T08:56:17.508532465Z     "currency": "PHP",
2025-11-06T08:56:17.508534115Z     "description": null,
2025-11-06T08:56:17.508535785Z     "livemode": false,
2025-11-06T08:56:17.508537515Z     "redirect": {
2025-11-06T08:56:17.508543825Z       "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508545865Z       "failed": "http://localhost:5173/Products/Payment?invoiceId=71&payment=failed&reason=Payment was declined or cancelled",
2025-11-06T08:56:17.508547765Z       "success": "http://localhost:5173/Products/Invoices?payment=success"
2025-11-06T08:56:17.508549516Z     },
2025-11-06T08:56:17.508551276Z     "statement_descriptor": null,
2025-11-06T08:56:17.508553326Z     "status": "chargeable",
2025-11-06T08:56:17.508556186Z     "type": "gcash",
2025-11-06T08:56:17.508559086Z     "metadata": {
2025-11-06T08:56:17.508561366Z       "payment_id": "174",
2025-11-06T08:56:17.508563766Z       "invoice_id": "71"
2025-11-06T08:56:17.508566186Z     },
2025-11-06T08:56:17.508568616Z     "created_at": 1762419370,
2025-11-06T08:56:17.508571086Z     "updated_at": 1762419377
2025-11-06T08:56:17.508573686Z   }
2025-11-06T08:56:17.508576516Z }
2025-11-06T08:56:17.508579296Z ▶️ Processing source.chargeable event...
2025-11-06T08:56:17.508581746Z Source chargeable event received: src_2HQZ9SJQRvS8bQ9aapNByUUV
2025-11-06T08:56:17.606531089Z Error creating payment receipt: Error
2025-11-06T08:56:17.60656132Z     at Query.run (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
2025-11-06T08:56:17.60656763Z     at /opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/sequelize.js:315:28
2025-11-06T08:56:17.60657153Z     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
2025-11-06T08:56:17.60657691Z     at async PostgresQueryInterface.insert (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)
2025-11-06T08:56:17.6065804Z     at async model.save (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:2490:35)
2025-11-06T08:56:17.60658528Z     at async PaymentReceipt.create (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:1362:12)
2025-11-06T08:56:17.60658858Z     at async createPaymentReceipt (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:330:21)
2025-11-06T08:56:17.60659173Z     at async handleSourceChargeable (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1899:5)
2025-11-06T08:56:17.606595261Z     at async processWebhookInBackground (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1518:9)
2025-11-06T08:56:17.606598661Z     at async Immediate.<anonymous> (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1448:9) {
2025-11-06T08:56:17.60660183Z   name: 'SequelizeUniqueConstraintError',
2025-11-06T08:56:17.606604801Z   errors: [
2025-11-06T08:56:17.606609601Z     ValidationErrorItem {
2025-11-06T08:56:17.606612881Z       message: 'receipt_number must be unique',
2025-11-06T08:56:17.606615991Z       type: 'unique violation',
2025-11-06T08:56:17.606619221Z       path: 'receipt_number',
2025-11-06T08:56:17.606622431Z       value: 'RCP-2025-0027',
2025-11-06T08:56:17.606626161Z       origin: 'DB',
2025-11-06T08:56:17.606629311Z       instance: [PaymentReceipt],
2025-11-06T08:56:17.606632531Z       validatorKey: 'not_unique',
2025-11-06T08:56:17.606635711Z       validatorName: null,
2025-11-06T08:56:17.606638911Z       validatorArgs: []
2025-11-06T08:56:17.606642071Z     }
2025-11-06T08:56:17.606645371Z   ],
2025-11-06T08:56:17.606648631Z   parent: error: duplicate key value violates unique constraint "PaymentReceipt_receipt_number_key"
2025-11-06T08:56:17.606666292Z       at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
2025-11-06T08:56:17.606670442Z       at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
2025-11-06T08:56:17.606674142Z       at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
2025-11-06T08:56:17.606677652Z       at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
2025-11-06T08:56:17.606681212Z       at TLSSocket.emit (node:events:518:28)
2025-11-06T08:56:17.606685022Z       at addChunk (node:internal/streams/readable:561:12)
2025-11-06T08:56:17.606690532Z       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
2025-11-06T08:56:17.606693912Z       at Readable.push (node:internal/streams/readable:392:5)
2025-11-06T08:56:17.606697223Z       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
2025-11-06T08:56:17.606700413Z     length: 259,
2025-11-06T08:56:17.606703603Z     severity: 'ERROR',
2025-11-06T08:56:17.606707043Z     code: '23505',
2025-11-06T08:56:17.606710903Z     detail: 'Key (receipt_number)=(RCP-2025-0027) already exists.',
2025-11-06T08:56:17.606714233Z     hint: undefined,
2025-11-06T08:56:17.606717723Z     position: undefined,
2025-11-06T08:56:17.606721033Z     internalPosition: undefined,
2025-11-06T08:56:17.606724383Z     internalQuery: undefined,
2025-11-06T08:56:17.606728653Z     where: undefined,
2025-11-06T08:56:17.606732533Z     schema: 'public',
2025-11-06T08:56:17.606756414Z     table: 'PaymentReceipt',
2025-11-06T08:56:17.606764524Z     column: undefined,
2025-11-06T08:56:17.606767924Z     dataType: undefined,
2025-11-06T08:56:17.606771364Z     constraint: 'PaymentReceipt_receipt_number_key',
2025-11-06T08:56:17.606774624Z     file: 'nbtinsert.c',
2025-11-06T08:56:17.606777464Z     line: '667',
2025-11-06T08:56:17.606781205Z     routine: '_bt_check_unique',
2025-11-06T08:56:17.606787715Z     sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";',
2025-11-06T08:56:17.606790205Z     parameters: [
2025-11-06T08:56:17.606792285Z       'RCP-2025-0027',
2025-11-06T08:56:17.606794395Z       174,
2025-11-06T08:56:17.606796505Z       71,
2025-11-06T08:56:17.606798725Z       26,
2025-11-06T08:56:17.606801055Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606803235Z       '50.00',
2025-11-06T08:56:17.606805395Z       '3500.00',
2025-11-06T08:56:17.606807475Z       3400,
2025-11-06T08:56:17.606809535Z       'gcash',
2025-11-06T08:56:17.606811625Z       'src_2HQZ9SJQRvS8bQ9aapNByUUV',
2025-11-06T08:56:17.606813745Z       'Partial',
2025-11-06T08:56:17.606817675Z       '{"invoiceNumber":"INV-20251031-8220","customerName":"Vanguard Industrial","customerEmail":"client@ammex.com","paymentMethod":"gcash","gatewayReference":"src_2HQZ9SJQRvS8bQ9aapNByUUV"}',
2025-11-06T08:56:17.606819855Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606822015Z       '2025-11-06 08:56:17.603 +00:00'
2025-11-06T08:56:17.606824135Z     ]
2025-11-06T08:56:17.606826246Z   },
2025-11-06T08:56:17.606849196Z   original: error: duplicate key value violates unique constraint "PaymentReceipt_receipt_number_key"
2025-11-06T08:56:17.606851786Z       at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
2025-11-06T08:56:17.606854516Z       at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
2025-11-06T08:56:17.606857656Z       at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
2025-11-06T08:56:17.606859786Z       at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
2025-11-06T08:56:17.606861956Z       at TLSSocket.emit (node:events:518:28)
2025-11-06T08:56:17.606864146Z       at addChunk (node:internal/streams/readable:561:12)
2025-11-06T08:56:17.606866326Z       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
2025-11-06T08:56:17.606868506Z       at Readable.push (node:internal/streams/readable:392:5)
2025-11-06T08:56:17.606870656Z       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
2025-11-06T08:56:17.606872787Z     length: 259,
2025-11-06T08:56:17.606874876Z     severity: 'ERROR',
2025-11-06T08:56:17.606876947Z     code: '23505',
2025-11-06T08:56:17.606879107Z     detail: 'Key (receipt_number)=(RCP-2025-0027) already exists.',
2025-11-06T08:56:17.606881207Z     hint: undefined,
2025-11-06T08:56:17.606883317Z     position: undefined,
2025-11-06T08:56:17.606885417Z     internalPosition: undefined,
2025-11-06T08:56:17.606887527Z     internalQuery: undefined,
2025-11-06T08:56:17.606889627Z     where: undefined,
2025-11-06T08:56:17.606891687Z     schema: 'public',
2025-11-06T08:56:17.606893727Z     table: 'PaymentReceipt',
2025-11-06T08:56:17.606895787Z     column: undefined,
2025-11-06T08:56:17.606897867Z     dataType: undefined,
2025-11-06T08:56:17.606900017Z     constraint: 'PaymentReceipt_receipt_number_key',
2025-11-06T08:56:17.606902087Z     file: 'nbtinsert.c',
2025-11-06T08:56:17.606904137Z     line: '667',
2025-11-06T08:56:17.606906237Z     routine: '_bt_check_unique',
2025-11-06T08:56:17.606908517Z     sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";',
2025-11-06T08:56:17.606910637Z     parameters: [
2025-11-06T08:56:17.606912697Z       'RCP-2025-0027',
2025-11-06T08:56:17.606914788Z       174,
2025-11-06T08:56:17.606916857Z       71,
2025-11-06T08:56:17.606918917Z       26,
2025-11-06T08:56:17.606920997Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606923128Z       '50.00',
2025-11-06T08:56:17.606925268Z       '3500.00',
2025-11-06T08:56:17.606927358Z       3400,
2025-11-06T08:56:17.606929408Z       'gcash',
2025-11-06T08:56:17.606931468Z       'src_2HQZ9SJQRvS8bQ9aapNByUUV',
2025-11-06T08:56:17.606933628Z       'Partial',
2025-11-06T08:56:17.606935918Z       '{"invoiceNumber":"INV-20251031-8220","customerName":"Vanguard Industrial","customerEmail":"client@ammex.com","paymentMethod":"gcash","gatewayReference":"src_2HQZ9SJQRvS8bQ9aapNByUUV"}',
2025-11-06T08:56:17.606938068Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606944258Z       '2025-11-06 08:56:17.603 +00:00'
2025-11-06T08:56:17.606946418Z     ]
2025-11-06T08:56:17.606948518Z   },
2025-11-06T08:56:17.606950648Z   fields: { receipt_number: 'RCP-2025-0027' },
2025-11-06T08:56:17.606952848Z   sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";'
2025-11-06T08:56:17.606955008Z }
2025-11-06T08:56:17.611251232Z E-wallet payment successfully processed: 174
2025-11-06T08:56:17.611351634Z ✅ source.chargeable processed
2025-11-06T08:56:17.611360685Z ✅ Background webhook processing completed
2025-11-06T08:56:17.496702706Z 🔔 WEBHOOK RECEIVED: POST /api/payments/webhook at 2025-11-06T08:56:17.493Z
2025-11-06T08:56:17.508273479Z 127.0.0.1 - - [06/Nov/2025:08:56:17 +0000] "POST /api/payments/webhook HTTP/1.1" 200 71 "-" "Ruby"
2025-11-06T08:56:17.50828321Z 🔄 Processing webhook in background...
2025-11-06T08:56:17.50828758Z Headers: {
2025-11-06T08:56:17.50829219Z   "host": "ammex.onrender.com",
2025-11-06T08:56:17.50829653Z   "user-agent": "Ruby",
2025-11-06T08:56:17.50830089Z   "content-length": "829",
2025-11-06T08:56:17.50830504Z   "accept": "*/*",
2025-11-06T08:56:17.50830904Z   "accept-encoding": "gzip, br",
2025-11-06T08:56:17.50831294Z   "cdn-loop": "cloudflare; loops=1",
2025-11-06T08:56:17.50831712Z   "cf-connecting-ip": "13.215.113.49",
2025-11-06T08:56:17.50832164Z   "cf-ipcountry": "SG",
2025-11-06T08:56:17.508325621Z   "cf-ray": "99a3607519d8fd29-SIN",
2025-11-06T08:56:17.508329661Z   "cf-visitor": "{\"scheme\":\"https\"}",
2025-11-06T08:56:17.508333661Z   "content-type": "application/json",
2025-11-06T08:56:17.508337531Z   "paymongo-signature": "t=1762419377,te=19cf3deef5413185c33d81ba62727d00f7504ebb4684419421c13ec660858fcf,li=",
2025-11-06T08:56:17.508341411Z   "render-proxy-ttl": "4",
2025-11-06T08:56:17.508345381Z   "rndr-id": "aa755e45-b10c-47ed",
2025-11-06T08:56:17.508349621Z   "traceparent": "00-690c62b1000000002fa6ba63d8ffca11-36c6f850b2092288-01",
2025-11-06T08:56:17.508354371Z   "tracestate": "dd=p:36c6f850b2092288;s:2;t.dm:-3",
2025-11-06T08:56:17.508358331Z   "true-client-ip": "13.215.113.49",
2025-11-06T08:56:17.508362332Z   "x-datadog-parent-id": "3947115148904833672",
2025-11-06T08:56:17.508366652Z   "x-datadog-sampling-priority": "2",
2025-11-06T08:56:17.508370452Z   "x-datadog-tags": "_dd.p.dm=-3,_dd.p.tid=690c62b100000000",
2025-11-06T08:56:17.508374412Z   "x-datadog-trace-id": "3433636703921752593",
2025-11-06T08:56:17.508378732Z   "x-forwarded-for": "13.215.113.49, 162.158.108.35, 10.16.108.140",
2025-11-06T08:56:17.508394752Z   "x-forwarded-proto": "https",
2025-11-06T08:56:17.508398182Z   "x-request-start": "1762419377491039"
2025-11-06T08:56:17.508401002Z }
2025-11-06T08:56:17.508403972Z Body: {
2025-11-06T08:56:17.508406322Z   "data": {
2025-11-06T08:56:17.508408062Z     "id": "evt_DKssHXrNJx4bkfykYZzC93ao",
2025-11-06T08:56:17.508409722Z     "type": "event",
2025-11-06T08:56:17.508411393Z     "attributes": {
2025-11-06T08:56:17.508413042Z       "type": "source.chargeable",
2025-11-06T08:56:17.508414793Z       "livemode": false,
2025-11-06T08:56:17.508416473Z       "data": {
2025-11-06T08:56:17.508418313Z         "id": "src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508420083Z         "type": "source",
2025-11-06T08:56:17.508421763Z         "attributes": {
2025-11-06T08:56:17.508423423Z           "amount": 5000,
2025-11-06T08:56:17.508425183Z           "billing": null,
2025-11-06T08:56:17.508427103Z           "currency": "PHP",
2025-11-06T08:56:17.508428773Z           "description": null,
2025-11-06T08:56:17.508430573Z           "livemode": false,
2025-11-06T08:56:17.508432313Z           "redirect": {
2025-11-06T08:56:17.508434853Z             "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508437133Z             "failed": "http://localhost:5173/Products/Payment?invoiceId=71&payment=failed&reason=Payment was declined or cancelled",
2025-11-06T08:56:17.508439243Z             "success": "http://localhost:5173/Products/Invoices?payment=success"
2025-11-06T08:56:17.508441963Z           },
2025-11-06T08:56:17.508445153Z           "statement_descriptor": null,
2025-11-06T08:56:17.508447743Z           "status": "chargeable",
2025-11-06T08:56:17.508450193Z           "type": "gcash",
2025-11-06T08:56:17.508452694Z           "metadata": {
2025-11-06T08:56:17.508455323Z             "payment_id": "174",
2025-11-06T08:56:17.508457754Z             "invoice_id": "71"
2025-11-06T08:56:17.508460343Z           },
2025-11-06T08:56:17.508462934Z           "created_at": 1762419370,
2025-11-06T08:56:17.508465414Z           "updated_at": 1762419377
2025-11-06T08:56:17.508467944Z         }
2025-11-06T08:56:17.508470904Z       },
2025-11-06T08:56:17.508473394Z       "previous_data": {},
2025-11-06T08:56:17.508475124Z       "pending_webhooks": 1,
2025-11-06T08:56:17.508476794Z       "created_at": 1762419377,
2025-11-06T08:56:17.508492904Z       "updated_at": 1762419377
2025-11-06T08:56:17.508496074Z     }
2025-11-06T08:56:17.508498555Z   }
2025-11-06T08:56:17.508500855Z }
2025-11-06T08:56:17.508504444Z Signature: t=1762419377,te=19cf3deef5413185c33d81ba62727d00f7504ebb4684419421c13ec660858fcf,li=
2025-11-06T08:56:17.508507445Z Has Signature: true
2025-11-06T08:56:17.508510175Z ✅ Signature verification skipped (for debugging)
2025-11-06T08:56:17.508512725Z 📦 Event Type: source.chargeable
2025-11-06T08:56:17.508515395Z 📦 Event ID: evt_DKssHXrNJx4bkfykYZzC93ao
2025-11-06T08:56:17.508517825Z 📦 Event Data: {
2025-11-06T08:56:17.508520535Z   "id": "src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508522985Z   "type": "source",
2025-11-06T08:56:17.508525505Z   "attributes": {
2025-11-06T08:56:17.508528245Z     "amount": 5000,
2025-11-06T08:56:17.508530685Z     "billing": null,
2025-11-06T08:56:17.508532465Z     "currency": "PHP",
2025-11-06T08:56:17.508534115Z     "description": null,
2025-11-06T08:56:17.508535785Z     "livemode": false,
2025-11-06T08:56:17.508537515Z     "redirect": {
2025-11-06T08:56:17.508543825Z       "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_2HQZ9SJQRvS8bQ9aapNByUUV",
2025-11-06T08:56:17.508545865Z       "failed": "http://localhost:5173/Products/Payment?invoiceId=71&payment=failed&reason=Payment was declined or cancelled",
2025-11-06T08:56:17.508547765Z       "success": "http://localhost:5173/Products/Invoices?payment=success"
2025-11-06T08:56:17.508549516Z     },
2025-11-06T08:56:17.508551276Z     "statement_descriptor": null,
2025-11-06T08:56:17.508553326Z     "status": "chargeable",
2025-11-06T08:56:17.508556186Z     "type": "gcash",
2025-11-06T08:56:17.508559086Z     "metadata": {
2025-11-06T08:56:17.508561366Z       "payment_id": "174",
2025-11-06T08:56:17.508563766Z       "invoice_id": "71"
2025-11-06T08:56:17.508566186Z     },
2025-11-06T08:56:17.508568616Z     "created_at": 1762419370,
2025-11-06T08:56:17.508571086Z     "updated_at": 1762419377
2025-11-06T08:56:17.508573686Z   }
2025-11-06T08:56:17.508576516Z }
2025-11-06T08:56:17.508579296Z ▶️ Processing source.chargeable event...
2025-11-06T08:56:17.508581746Z Source chargeable event received: src_2HQZ9SJQRvS8bQ9aapNByUUV
2025-11-06T08:56:17.606531089Z Error creating payment receipt: Error
2025-11-06T08:56:17.60656132Z     at Query.run (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
2025-11-06T08:56:17.60656763Z     at /opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/sequelize.js:315:28
2025-11-06T08:56:17.60657153Z     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
2025-11-06T08:56:17.60657691Z     at async PostgresQueryInterface.insert (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)
2025-11-06T08:56:17.6065804Z     at async model.save (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:2490:35)
2025-11-06T08:56:17.60658528Z     at async PaymentReceipt.create (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:1362:12)
2025-11-06T08:56:17.60658858Z     at async createPaymentReceipt (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:330:21)
2025-11-06T08:56:17.60659173Z     at async handleSourceChargeable (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1899:5)
2025-11-06T08:56:17.606595261Z     at async processWebhookInBackground (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1518:9)
2025-11-06T08:56:17.606598661Z     at async Immediate.<anonymous> (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1448:9) {
2025-11-06T08:56:17.60660183Z   name: 'SequelizeUniqueConstraintError',
2025-11-06T08:56:17.606604801Z   errors: [
2025-11-06T08:56:17.606609601Z     ValidationErrorItem {
2025-11-06T08:56:17.606612881Z       message: 'receipt_number must be unique',
2025-11-06T08:56:17.606615991Z       type: 'unique violation',
2025-11-06T08:56:17.606619221Z       path: 'receipt_number',
2025-11-06T08:56:17.606622431Z       value: 'RCP-2025-0027',
2025-11-06T08:56:17.606626161Z       origin: 'DB',
2025-11-06T08:56:17.606629311Z       instance: [PaymentReceipt],
2025-11-06T08:56:17.606632531Z       validatorKey: 'not_unique',
2025-11-06T08:56:17.606635711Z       validatorName: null,
2025-11-06T08:56:17.606638911Z       validatorArgs: []
2025-11-06T08:56:17.606642071Z     }
2025-11-06T08:56:17.606645371Z   ],
2025-11-06T08:56:17.606648631Z   parent: error: duplicate key value violates unique constraint "PaymentReceipt_receipt_number_key"
2025-11-06T08:56:17.606666292Z       at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
2025-11-06T08:56:17.606670442Z       at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
2025-11-06T08:56:17.606674142Z       at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
2025-11-06T08:56:17.606677652Z       at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
2025-11-06T08:56:17.606681212Z       at TLSSocket.emit (node:events:518:28)
2025-11-06T08:56:17.606685022Z       at addChunk (node:internal/streams/readable:561:12)
2025-11-06T08:56:17.606690532Z       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
2025-11-06T08:56:17.606693912Z       at Readable.push (node:internal/streams/readable:392:5)
2025-11-06T08:56:17.606697223Z       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
2025-11-06T08:56:17.606700413Z     length: 259,
2025-11-06T08:56:17.606703603Z     severity: 'ERROR',
2025-11-06T08:56:17.606707043Z     code: '23505',
2025-11-06T08:56:17.606710903Z     detail: 'Key (receipt_number)=(RCP-2025-0027) already exists.',
2025-11-06T08:56:17.606714233Z     hint: undefined,
2025-11-06T08:56:17.606717723Z     position: undefined,
2025-11-06T08:56:17.606721033Z     internalPosition: undefined,
2025-11-06T08:56:17.606724383Z     internalQuery: undefined,
2025-11-06T08:56:17.606728653Z     where: undefined,
2025-11-06T08:56:17.606732533Z     schema: 'public',
2025-11-06T08:56:17.606756414Z     table: 'PaymentReceipt',
2025-11-06T08:56:17.606764524Z     column: undefined,
2025-11-06T08:56:17.606767924Z     dataType: undefined,
2025-11-06T08:56:17.606771364Z     constraint: 'PaymentReceipt_receipt_number_key',
2025-11-06T08:56:17.606774624Z     file: 'nbtinsert.c',
2025-11-06T08:56:17.606777464Z     line: '667',
2025-11-06T08:56:17.606781205Z     routine: '_bt_check_unique',
2025-11-06T08:56:17.606787715Z     sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";',
2025-11-06T08:56:17.606790205Z     parameters: [
2025-11-06T08:56:17.606792285Z       'RCP-2025-0027',
2025-11-06T08:56:17.606794395Z       174,
2025-11-06T08:56:17.606796505Z       71,
2025-11-06T08:56:17.606798725Z       26,
2025-11-06T08:56:17.606801055Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606803235Z       '50.00',
2025-11-06T08:56:17.606805395Z       '3500.00',
2025-11-06T08:56:17.606807475Z       3400,
2025-11-06T08:56:17.606809535Z       'gcash',
2025-11-06T08:56:17.606811625Z       'src_2HQZ9SJQRvS8bQ9aapNByUUV',
2025-11-06T08:56:17.606813745Z       'Partial',
2025-11-06T08:56:17.606817675Z       '{"invoiceNumber":"INV-20251031-8220","customerName":"Vanguard Industrial","customerEmail":"client@ammex.com","paymentMethod":"gcash","gatewayReference":"src_2HQZ9SJQRvS8bQ9aapNByUUV"}',
2025-11-06T08:56:17.606819855Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606822015Z       '2025-11-06 08:56:17.603 +00:00'
2025-11-06T08:56:17.606824135Z     ]
2025-11-06T08:56:17.606826246Z   },
2025-11-06T08:56:17.606849196Z   original: error: duplicate key value violates unique constraint "PaymentReceipt_receipt_number_key"
2025-11-06T08:56:17.606851786Z       at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
2025-11-06T08:56:17.606854516Z       at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
2025-11-06T08:56:17.606857656Z       at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
2025-11-06T08:56:17.606859786Z       at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
2025-11-06T08:56:17.606861956Z       at TLSSocket.emit (node:events:518:28)
2025-11-06T08:56:17.606864146Z       at addChunk (node:internal/streams/readable:561:12)
2025-11-06T08:56:17.606866326Z       at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
2025-11-06T08:56:17.606868506Z       at Readable.push (node:internal/streams/readable:392:5)
2025-11-06T08:56:17.606870656Z       at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
2025-11-06T08:56:17.606872787Z     length: 259,
2025-11-06T08:56:17.606874876Z     severity: 'ERROR',
2025-11-06T08:56:17.606876947Z     code: '23505',
2025-11-06T08:56:17.606879107Z     detail: 'Key (receipt_number)=(RCP-2025-0027) already exists.',
2025-11-06T08:56:17.606881207Z     hint: undefined,
2025-11-06T08:56:17.606883317Z     position: undefined,
2025-11-06T08:56:17.606885417Z     internalPosition: undefined,
2025-11-06T08:56:17.606887527Z     internalQuery: undefined,
2025-11-06T08:56:17.606889627Z     where: undefined,
2025-11-06T08:56:17.606891687Z     schema: 'public',
2025-11-06T08:56:17.606893727Z     table: 'PaymentReceipt',
2025-11-06T08:56:17.606895787Z     column: undefined,
2025-11-06T08:56:17.606897867Z     dataType: undefined,
2025-11-06T08:56:17.606900017Z     constraint: 'PaymentReceipt_receipt_number_key',
2025-11-06T08:56:17.606902087Z     file: 'nbtinsert.c',
2025-11-06T08:56:17.606904137Z     line: '667',
2025-11-06T08:56:17.606906237Z     routine: '_bt_check_unique',
2025-11-06T08:56:17.606908517Z     sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";',
2025-11-06T08:56:17.606910637Z     parameters: [
2025-11-06T08:56:17.606912697Z       'RCP-2025-0027',
2025-11-06T08:56:17.606914788Z       174,
2025-11-06T08:56:17.606916857Z       71,
2025-11-06T08:56:17.606918917Z       26,
2025-11-06T08:56:17.606920997Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606923128Z       '50.00',
2025-11-06T08:56:17.606925268Z       '3500.00',
2025-11-06T08:56:17.606927358Z       3400,
2025-11-06T08:56:17.606929408Z       'gcash',
2025-11-06T08:56:17.606931468Z       'src_2HQZ9SJQRvS8bQ9aapNByUUV',
2025-11-06T08:56:17.606933628Z       'Partial',
2025-11-06T08:56:17.606935918Z       '{"invoiceNumber":"INV-20251031-8220","customerName":"Vanguard Industrial","customerEmail":"client@ammex.com","paymentMethod":"gcash","gatewayReference":"src_2HQZ9SJQRvS8bQ9aapNByUUV"}',
2025-11-06T08:56:17.606938068Z       '2025-11-06 08:56:17.603 +00:00',
2025-11-06T08:56:17.606944258Z       '2025-11-06 08:56:17.603 +00:00'
2025-11-06T08:56:17.606946418Z     ]
2025-11-06T08:56:17.606948518Z   },
2025-11-06T08:56:17.606950648Z   fields: { receipt_number: 'RCP-2025-0027' },
2025-11-06T08:56:17.606952848Z   sql: 'INSERT INTO "PaymentReceipt" ("id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at") VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "id","receipt_number","payment_id","invoice_id","customer_id","payment_date","amount","total_amount","remaining_amount","payment_method","payment_reference","status","receipt_data","created_at","updated_at";'
2025-11-06T08:56:17.606955008Z }
2025-11-06T08:56:17.611251232Z E-wallet payment successfully processed: 174
2025-11-06T08:56:17.611351634Z ✅ source.chargeable processed
2025-11-06T08:56:17.611360685Z ✅ Background webhook processing completed