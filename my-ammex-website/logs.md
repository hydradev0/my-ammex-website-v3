2025-10-18T05:56:46.334077239Z ========================================
2025-10-18T05:56:46.33414437Z 🔔 WEBHOOK RECEIVED
2025-10-18T05:56:46.334211592Z Time: 2025-10-18T05:56:46.334Z
2025-10-18T05:56:46.334246442Z Method: POST
2025-10-18T05:56:46.334260222Z URL: /api/payments/webhook
2025-10-18T05:56:46.334308503Z Headers: {
2025-10-18T05:56:46.334321454Z   "host": "ammex.onrender.com",
2025-10-18T05:56:46.334326634Z   "user-agent": "Ruby",
2025-10-18T05:56:46.334330454Z   "content-length": "800",
2025-10-18T05:56:46.334334294Z   "accept": "*/*",
2025-10-18T05:56:46.334338264Z   "accept-encoding": "gzip, br",
2025-10-18T05:56:46.334344244Z   "cdn-loop": "cloudflare; loops=1",
2025-10-18T05:56:46.334348374Z   "cf-connecting-ip": "52.77.105.83",
2025-10-18T05:56:46.334364744Z   "cf-ipcountry": "SG",
2025-10-18T05:56:46.334367544Z   "cf-ray": "9905cb5d6f98ef6c-SIN",
2025-10-18T05:56:46.334369725Z   "cf-visitor": "{\"scheme\":\"https\"}",
2025-10-18T05:56:46.334371855Z   "content-type": "application/json",
2025-10-18T05:56:46.334376385Z   "paymongo-signature": "t=1760767006,te=6f43def2ffc2094bb65f7d8e0ae5970ac9210d16e2157d0c689e57b5905842cd,li=",
2025-10-18T05:56:46.334378735Z   "render-proxy-ttl": "4",
2025-10-18T05:56:46.334380865Z   "rndr-id": "9ceeaf0c-b044-461f",
2025-10-18T05:56:46.334383525Z   "traceparent": "00-68f32c1e0000000002cba682848fd11a-262cd9272de78a9f-01",
2025-10-18T05:56:46.334386375Z   "tracestate": "dd=p:262cd9272de78a9f;s:2;t.dm:-3",
2025-10-18T05:56:46.334388645Z   "true-client-ip": "52.77.105.83",
2025-10-18T05:56:46.334390895Z   "x-datadog-parent-id": "2750812234713631391",
2025-10-18T05:56:46.334393005Z   "x-datadog-sampling-priority": "2",
2025-10-18T05:56:46.334395235Z   "x-datadog-tags": "_dd.p.dm=-3,_dd.p.tid=68f32c1e00000000",
2025-10-18T05:56:46.334397395Z   "x-datadog-trace-id": "201437687848096026",
2025-10-18T05:56:46.334399515Z   "x-forwarded-for": "52.77.105.83, 172.70.143.167, 10.210.97.148",
2025-10-18T05:56:46.334401665Z   "x-forwarded-proto": "https",
2025-10-18T05:56:46.334403765Z   "x-request-start": "1760767006330672"
2025-10-18T05:56:46.334415405Z }
2025-10-18T05:56:46.334431796Z Body: {
2025-10-18T05:56:46.334434426Z   "data": {
2025-10-18T05:56:46.334436686Z     "id": "evt_ZQkpnN7rdzLC7DjjhgffrT5a",
2025-10-18T05:56:46.334438896Z     "type": "event",
2025-10-18T05:56:46.334441086Z     "attributes": {
2025-10-18T05:56:46.334445996Z       "type": "source.chargeable",
2025-10-18T05:56:46.334448336Z       "livemode": false,
2025-10-18T05:56:46.334450656Z       "data": {
2025-10-18T05:56:46.334453276Z         "id": "src_JVpgNra6irevsAwv1LS9mLdd",
2025-10-18T05:56:46.334455816Z         "type": "source",
2025-10-18T05:56:46.334458866Z         "attributes": {
2025-10-18T05:56:46.334461236Z           "amount": 15000,
2025-10-18T05:56:46.334463416Z           "billing": null,
2025-10-18T05:56:46.334465566Z           "currency": "PHP",
2025-10-18T05:56:46.334467557Z           "description": null,
2025-10-18T05:56:46.334469717Z           "livemode": false,
2025-10-18T05:56:46.334471837Z           "redirect": {
2025-10-18T05:56:46.334474677Z             "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_JVpgNra6irevsAwv1LS9mLdd",
2025-10-18T05:56:46.334477227Z             "failed": "https://www.ammexmachinetools.com/Products/Invoices?payment=failed",
2025-10-18T05:56:46.334479287Z             "success": "https://www.ammexmachinetools.com/Products/Invoices?payment=success"
2025-10-18T05:56:46.334481327Z           },
2025-10-18T05:56:46.334483467Z           "statement_descriptor": null,
2025-10-18T05:56:46.334485787Z           "status": "chargeable",
2025-10-18T05:56:46.334487797Z           "type": "gcash",
2025-10-18T05:56:46.334489877Z           "metadata": {
2025-10-18T05:56:46.334491917Z             "invoice_id": "16",
2025-10-18T05:56:46.334494117Z             "payment_id": "76"
2025-10-18T05:56:46.334496197Z           },
2025-10-18T05:56:46.334498357Z           "created_at": 1760766997,
2025-10-18T05:56:46.334500557Z           "updated_at": 1760767005
2025-10-18T05:56:46.334502687Z         }
2025-10-18T05:56:46.334504737Z       },
2025-10-18T05:56:46.334506957Z       "previous_data": {},
2025-10-18T05:56:46.334509087Z       "pending_webhooks": 1,
2025-10-18T05:56:46.334511177Z       "created_at": 1760767006,
2025-10-18T05:56:46.334518198Z       "updated_at": 1760767006
2025-10-18T05:56:46.334520778Z     }
2025-10-18T05:56:46.334522918Z   }
2025-10-18T05:56:46.334525227Z }
2025-10-18T05:56:46.334527448Z ========================================
2025-10-18T05:56:46.334529628Z Signature: t=1760767006,te=6f43def2ffc2094bb65f7d8e0ae5970ac9210d16e2157d0c689e57b5905842cd,li=
2025-10-18T05:56:46.334544878Z Has Signature: true
2025-10-18T05:56:46.334548008Z ✅ Signature verification skipped (for debugging)
2025-10-18T05:56:46.334613009Z 📦 Event Type: source.chargeable
2025-10-18T05:56:46.334619609Z 📦 Event ID: evt_ZQkpnN7rdzLC7DjjhgffrT5a
2025-10-18T05:56:46.33465632Z 📦 Event Data: {
2025-10-18T05:56:46.33466093Z   "id": "src_JVpgNra6irevsAwv1LS9mLdd",
2025-10-18T05:56:46.33466353Z   "type": "source",
2025-10-18T05:56:46.33466574Z   "attributes": {
2025-10-18T05:56:46.33466793Z     "amount": 15000,
2025-10-18T05:56:46.33467004Z     "billing": null,
2025-10-18T05:56:46.334672141Z     "currency": "PHP",
2025-10-18T05:56:46.334674321Z     "description": null,
2025-10-18T05:56:46.334676401Z     "livemode": false,
2025-10-18T05:56:46.334678461Z     "redirect": {
2025-10-18T05:56:46.334680801Z       "checkout_url": "https://secure-authentication.paymongo.com/sources?id=src_JVpgNra6irevsAwv1LS9mLdd",
2025-10-18T05:56:46.334683051Z       "failed": "https://www.ammexmachinetools.com/Products/Invoices?payment=failed",
2025-10-18T05:56:46.334685231Z       "success": "https://www.ammexmachinetools.com/Products/Invoices?payment=success"
2025-10-18T05:56:46.334687421Z     },
2025-10-18T05:56:46.334689501Z     "statement_descriptor": null,
2025-10-18T05:56:46.334691651Z     "status": "chargeable",
2025-10-18T05:56:46.334693801Z     "type": "gcash",
2025-10-18T05:56:46.334695881Z     "metadata": {
2025-10-18T05:56:46.334698041Z       "invoice_id": "16",
2025-10-18T05:56:46.334700461Z       "payment_id": "76"
2025-10-18T05:56:46.334702841Z     },
2025-10-18T05:56:46.334705671Z     "created_at": 1760766997,
2025-10-18T05:56:46.334708181Z     "updated_at": 1760767005
2025-10-18T05:56:46.334710841Z   }
2025-10-18T05:56:46.334713131Z }
2025-10-18T05:56:46.334715421Z ▶️ Processing source.chargeable event...
2025-10-18T05:56:46.334818103Z Source chargeable event received: src_JVpgNra6irevsAwv1LS9mLdd
2025-10-18T05:56:46.421852211Z E-wallet payment successfully processed: 76
2025-10-18T05:56:46.421872971Z ✅ source.chargeable processed
2025-10-18T05:56:46.421875771Z ✅ Webhook processed successfully
2025-10-18T05:56:46.421885091Z ========================================
2025-10-18T05:56:46.421887302Z 
2025-10-18T05:56:46.422346411Z 127.0.0.1 - - [18/Oct/2025:05:56:46 +0000] "POST /api/payments/webhook HTTP/1.1" 200 32 "-" "Ruby"
2025-10-18T05:56:47.608861192Z 127.0.0.1 - - [18/Oct/2025:05:56:47 +0000] "GET /api/health HTTP/1.1" 200 135 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:47.765512512Z 127.0.0.1 - - [18/Oct/2025:05:56:47 +0000] "GET /api/auth/me HTTP/1.1" 200 231 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:48.029396898Z 127.0.0.1 - - [18/Oct/2025:05:56:48 +0000] "GET /api/cart/26 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:48.224114862Z 127.0.0.1 - - [18/Oct/2025:05:56:48 +0000] "GET /api/payments/notifications/my HTTP/1.1" 200 12428 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:48.319562862Z 127.0.0.1 - - [18/Oct/2025:05:56:48 +0000] "GET /api/orders/notifications/my HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:48.426895891Z 127.0.0.1 - - [18/Oct/2025:05:56:48 +0000] "GET /api/customers/me HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-18T05:56:48.524648515Z 127.0.0.1 - - [18/Oct/2025:05:56:48 +0000] "GET /api/invoices/my HTTP/1.1" 200 13881 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"