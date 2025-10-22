2025-10-22T03:09:45.821976135Z > ammex-website-server@1.0.0 prestart
2025-10-22T03:09:45.821981056Z > echo 'Starting Ammex Backend Server...'
2025-10-22T03:09:45.821983525Z 
2025-10-22T03:09:45.913414611Z Starting Ammex Backend Server...
2025-10-22T03:09:45.914736792Z 
2025-10-22T03:09:45.914752253Z > ammex-website-server@1.0.0 start
2025-10-22T03:09:45.914755313Z > node server.js
2025-10-22T03:09:45.914757643Z 
2025-10-22T03:09:48.319155553Z ✅ Environment variables validated successfully
2025-10-22T03:09:49.523474038Z ✅ PostgreSQL Connected successfully.
2025-10-22T03:09:49.913940869Z ℹ️  DB_AUTO_SYNC is disabled. Skipping automatic sync.
2025-10-22T03:09:52.010854822Z 🚀 Server running on http://0.0.0.0:5000
2025-10-22T03:09:52.010880123Z 🌍 Environment: production
2025-10-22T03:09:52.010889423Z 📊 Database: PostgreSQL
2025-10-22T03:09:52.010891423Z 📱 Mobile access: http://192.168.1.53:5000
2025-10-22T03:09:53.582769614Z 127.0.0.1 - - [22/Oct/2025:03:09:53 +0000] "GET /api/health HTTP/1.1" 200 135 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:55.879968493Z 127.0.0.1 - - [22/Oct/2025:03:09:55 +0000] "POST /api/auth/login HTTP/1.1" 200 326 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:55.89033258Z 127.0.0.1 - - [22/Oct/2025:03:09:55 +0000] "GET /api/auth/me HTTP/1.1" 200 231 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:55.995159704Z 127.0.0.1 - - [22/Oct/2025:03:09:55 +0000] "GET /api/health HTTP/1.1" 200 135 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:56.155581841Z 127.0.0.1 - - [22/Oct/2025:03:09:56 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:56.225874973Z 127.0.0.1 - - [22/Oct/2025:03:09:56 +0000] "GET /api/auth/me HTTP/1.1" 200 231 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:58.883696313Z 127.0.0.1 - - [22/Oct/2025:03:09:58 +0000] "GET /api/cart/26 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:59.053043892Z 127.0.0.1 - - [22/Oct/2025:03:09:59 +0000] "GET /api/cart/26 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:59.170871326Z 127.0.0.1 - - [22/Oct/2025:03:09:59 +0000] "GET /api/cart/26 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:59.611174392Z 127.0.0.1 - - [22/Oct/2025:03:09:59 +0000] "GET /api/categories HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:59.612840512Z 127.0.0.1 - - [22/Oct/2025:03:09:59 +0000] "GET /api/customers/me HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:09:59.814798037Z 127.0.0.1 - - [22/Oct/2025:03:09:59 +0000] "GET /api/items?limit=100 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:10:00.190091047Z 127.0.0.1 - - [22/Oct/2025:03:10:00 +0000] "GET /api/cart/21 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:10:27.109688448Z 127.0.0.1 - - [22/Oct/2025:03:10:27 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:10:57.112967612Z 127.0.0.1 - - [22/Oct/2025:03:10:57 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:11:27.00465534Z 127.0.0.1 - - [22/Oct/2025:03:11:27 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:11:57.170599213Z 127.0.0.1 - - [22/Oct/2025:03:11:57 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:09.011369781Z 127.0.0.1 - - [22/Oct/2025:03:12:09 +0000] "GET /api/customers/me HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:09.915965393Z 127.0.0.1 - - [22/Oct/2025:03:12:09 +0000] "GET /api/invoices/my HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:13.31401101Z 127.0.0.1 - - [22/Oct/2025:03:12:13 +0000] "GET /api/payments/receipts/my HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:15.711584184Z Error downloading payment receipt: Error: Browser was not found at the configured executablePath (/opt/render/.cache/puppeteer/chrome/linux-141.0.7390.78/chrome-linux64/chrome)
2025-10-22T03:12:15.711628565Z     at ChromeLauncher.launch (/opt/render/project/src/my-ammex-website/backend/node_modules/puppeteer-core/lib/cjs/puppeteer/node/BrowserLauncher.js:89:19)
2025-10-22T03:12:15.711635875Z     at async downloadPaymentReceipt (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:2065:15)
2025-10-22T03:12:15.712199578Z 127.0.0.1 - - [22/Oct/2025:03:12:15 +0000] "GET /api/payments/receipts/29/download HTTP/1.1" 500 92 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:27.112556576Z 127.0.0.1 - - [22/Oct/2025:03:12:27 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:57.310828118Z 127.0.0.1 - - [22/Oct/2025:03:12:57 +0000] "GET /api/auth/me HTTP/1.1" 200 231 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:57.818354433Z 127.0.0.1 - - [22/Oct/2025:03:12:57 +0000] "GET /api/notifications HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:58.010066684Z 127.0.0.1 - - [22/Oct/2025:03:12:58 +0000] "GET /api/cart/26 HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:58.251218541Z 127.0.0.1 - - [22/Oct/2025:03:12:58 +0000] "GET /api/customers/me HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:58.317131059Z 127.0.0.1 - - [22/Oct/2025:03:12:58 +0000] "GET /api/invoices/my HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:12:59.234528756Z 127.0.0.1 - - [22/Oct/2025:03:12:59 +0000] "GET /api/payments/receipts/my HTTP/1.1" 304 - "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
2025-10-22T03:13:00.814762542Z Error downloading payment receipt: Error: Browser was not found at the configured executablePath (/opt/render/.cache/puppeteer/chrome/linux-141.0.7390.78/chrome-linux64/chrome)
2025-10-22T03:13:00.814782972Z     at ChromeLauncher.launch (/opt/render/project/src/my-ammex-website/backend/node_modules/puppeteer-core/lib/cjs/puppeteer/node/BrowserLauncher.js:89:19)
2025-10-22T03:13:00.814786692Z     at async downloadPaymentReceipt (/opt/render/project/src/my-ammex-website/backend/controllers/paymentController.js:2065:15)
2025-10-22T03:13:00.815142661Z 127.0.0.1 - - [22/Oct/2025:03:13:00 +0000] "GET /api/payments/receipts/29/download HTTP/1.1" 500 92 "https://www.ammexmachinetools.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"