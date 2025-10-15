NewItem.jsx:280 Sending item data: {modelNo: 'M17', itemName: null, vendor: 'Rotocast Industry Ltd.', supplierId: 13, sellingPrice: 2860, …}categoryId: 30description: nullimages: []itemName: nullmaxLevel: 50minLevel: 10modelNo: "M17"quantity: 14sellingPrice: 2860subcategoryId: nullsupplierId: 13supplierPrice: 2200unitId: 6vendor: "Rotocast Industry Ltd."[[Prototype]]: Object
apiConfig.js:65  POST http://localhost:5000/api/items 400 (Bad Request)
apiCall @ apiConfig.js:65
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:282
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:93 API Error (/items) - Attempt 1: {message: 'Validation failed', status: 400, isTimeout: false, isNetworkError: false}
apiCall @ apiConfig.js:93
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:282
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
NewItem.jsx:304 Error submitting form: Error: Validation failed
    at apiCall (apiConfig.js:79:23)
    at async createItem (inventoryService.js:28:10)
    at async handleSubmit (NewItem.jsx:282:26)
handleSubmit @ NewItem.jsx:304
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
