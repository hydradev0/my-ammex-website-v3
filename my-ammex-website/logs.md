🔔 WEBHOOK RECEIVED: POST /api/payments/webhook at 2025-11-21T01:16:39.546Z
127.0.0.1 - - [21/Nov/2025:01:16:39 +0000] "POST /api/payments/webhook HTTP/1.1" 200 71 "-" "Ruby"
🔄 Processing webhook in background...
Headers: {
  "host": "ammex.onrender.com",
  "user-agent": "Ruby",
  "content-length": "830",
  "accept": "*/*",
  "accept-encoding": "gzip, br",
  "cdn-loop": "cloudflare; loops=1",
  "cf-connecting-ip": "52.77.105.83",
  "cf-ipcountry": "SG",
  "cf-ray": "9a1c57caea115f4d-SIN",
  "cf-visitor": "{\"scheme\":\"https\"}",
  "content-type": "application/json",
  "paymongo-signature": "t=1763687799,te=6ce2b66a30823e1a53acad3753c14ee00c5ac82a6588d84e224541ce1433369b,li=",
  "render-proxy-ttl": "4",
  "rndr-id": "a95aa953-8ec3-4872",
  "traceparent": "00-691fbd770000000011e7708e7302e027-1a9956ffa6d6af02-01",
  "tracestate": "dd=p:1a9956ffa6d6af02;s:2;t.dm:-3",
  "true-client-ip": "52.77.105.83",
  "x-datadog-parent-id": "1916658772438593282",
  "x-datadog-sampling-priority": "2",
  "x-datadog-tags": "_dd.p.dm=-3,_dd.p.tid=691fbd7700000000",
  "x-datadog-trace-id": "1290123575382171687",
  "x-forwarded-for": "52.77.105.83, 172.68.164.127, 10.16.40.152",
  "x-forwarded-proto": "https",
  "x-request-start": "1763687799543011"
}
Body: {
  "data": {
    "id": "evt_KwUzzT4DyxVGRBFQGSZf4wE4",
    "type": "event",
    "attributes": {
      "type": "source.chargeable",
      "livemode": false,
      "data": {
        "id": "src_uFrBD7SpDpcQgmoswoKt6jgb",
        "type": "source",
        "attributes": {
          "amount": 10000,
          "billing": null,
          "currency": "PHP",
          "description": null,
          "livemode": false,
          "redirect": {
            "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_uFrBD7SpDpcQgmoswoKt6jgb",
            "failed": "http://localhost:5173/Products/Payment?invoiceId=79&payment=failed&reason=Payment was declined or cancelled",
            "success": "http://localhost:5173/Products/Invoices?payment=success"
          },
          "statement_descriptor": null,
          "status": "chargeable",
          "type": "gcash",
          "metadata": {
            "payment_id": "184",
            "invoice_id": "79"
          },
          "created_at": 1763687791,
          "updated_at": 1763687799
        }
      },
      "previous_data": {},
      "pending_webhooks": 1,
      "created_at": 1763687799,
      "updated_at": 1763687799
    }
  }
}
Signature: t=1763687799,te=6ce2b66a30823e1a53acad3753c14ee00c5ac82a6588d84e224541ce1433369b,li=
Has Signature: true
✅ Signature verification skipped (for debugging)
📦 Event Type: source.chargeable
📦 Event ID: evt_KwUzzT4DyxVGRBFQGSZf4wE4
📦 Event Data: {
  "id": "src_uFrBD7SpDpcQgmoswoKt6jgb",
  "type": "source",
  "attributes": {
    "amount": 10000,
    "billing": null,
    "currency": "PHP",
    "description": null,
    "livemode": false,
    "redirect": {
      "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_uFrBD7SpDpcQgmoswoKt6jgb",
      "failed": "http://localhost:5173/Products/Payment?invoiceId=79&payment=failed&reason=Payment was declined or cancelled",
      "success": "http://localhost:5173/Products/Invoices?payment=success"
    },
    "statement_descriptor": null,
    "status": "chargeable",
    "type": "gcash",
    "metadata": {
      "payment_id": "184",
      "invoice_id": "79"
    },
    "created_at": 1763687791,
    "updated_at": 1763687799
  }
}
▶️ Processing source.chargeable event...
Source chargeable event received: src_uFrBD7SpDpcQgmoswoKt6jgb
Error creating payment receipt: Error
    at Query.run (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryInterface.select (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Customer.findAll (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:1140:21)
    at async Customer.findOne (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:1240:12)
    at async Customer.findByPk (/opt/render/project/src/my-ammex-website/backend/node_modules/sequelize/lib/model.js:1221:12)
    at async createPaymentReceipt (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:493:22)
    at async handleSourceChargeable (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:2099:5)
    at async processWebhookInBackground (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1718:9)
    at async Immediate.<anonymous> (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:1648:9) {
  name: 'SequelizeDatabaseError',
  parent: error: column "street" does not exist
      at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
      at TLSSocket.emit (node:events:518:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 106,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '80',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3716',
    routine: 'errorMissingColumn',
    sql: 'SELECT "id", "customer_id" AS "customerId", "customer_name" AS "customerName", "street", "city", "postal_code" AS "postalCode", "country", "contact_name" AS "contactName", "telephone1", "telephone2", "email1", "email2", "is_active" AS "isActive", "profile_completed" AS "profileCompleted", "user_id" AS "userId", "created_at" AS "createdAt", "updated_at" AS "updatedAt" FROM "Customer" AS "Customer" WHERE "Customer"."id" = 26;',
    parameters: undefined
  },
  original: error: column "street" does not exist
      at Parser.parseErrorMessage (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at TLSSocket.<anonymous> (/opt/render/project/src/my-ammex-website/backend/node_modules/pg-protocol/dist/index.js:11:42)
      at TLSSocket.emit (node:events:518:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TLSWrap.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 106,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '80',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_relation.c',
    line: '3716',
    routine: 'errorMissingColumn',
    sql: 'SELECT "id", "customer_id" AS "customerId", "customer_name" AS "customerName", "street", "city", "postal_code" AS "postalCode", "country", "contact_name" AS "contactName", "telephone1", "telephone2", "email1", "email2", "is_active" AS "isActive", "profile_completed" AS "profileCompleted", "user_id" AS "userId", "created_at" AS "createdAt", "updated_at" AS "updatedAt" FROM "Customer" AS "Customer" WHERE "Customer"."id" = 26;',
    parameters: undefined
  },
  sql: 'SELECT "id", "customer_id" AS "customerId", "customer_name" AS "customerName", "street", "city", "postal_code" AS "postalCode", "country", "contact_name" AS "contactName", "telephone1", "telephone2", "email1", "email2", "is_active" AS "isActive", "profile_completed" AS "profileCompleted", "user_id" AS "userId", "created_at" AS "createdAt", "updated_at" AS "updatedAt" FROM "Customer" AS "Customer" WHERE "Customer"."id" = 26;',
  parameters: {}
}
E-wallet payment successfully processed: 184
✅ source.chargeable processed
✅ Background webhook processing completed