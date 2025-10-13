NewItem.jsx:274 === FRONTEND DEBUG - Item Data Being Sent ===
NewItem.jsx:275 formData: {modelNo: 'WH36DBQ4', itemName: '', vendor: 'Metabo Hpt', price: '700', floorPrice: '500', …}category: "Drivers"ceilingPrice: ""description: ""floorPrice: "500"images: []itemName: ""maxLevel: ""minLevel: "10"modelNo: "WH36DBQ4"price: "700"quantity: "15"subcategory: "Impact Drivers"unit: "Pieces"vendor: "Metabo Hpt"[[Prototype]]: Object
NewItem.jsx:276 itemData: {
  "modelNo": "WH36DBQ4",
  "itemName": null,
  "vendor": "Metabo Hpt",
  "price": 700,
  "floorPrice": 500,
  "ceilingPrice": null,
  "unitId": 6,
  "quantity": 15,
  "categoryId": 13,
  "subcategoryId": 18,
  "description": null,
  "minLevel": 10,
  "maxLevel": null,
  "images": []
}
NewItem.jsx:277 Empty fields check: {ceilingPrice: '', maxLevel: '', itemName: '', description: ''}ceilingPrice: ""description: ""itemName: ""maxLevel: ""[[Prototype]]: Object
apiConfig.js:65  POST http://localhost:5000/api/items 500 (Internal Server Error)
apiCall @ apiConfig.js:65
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:93 API Error (/items) - Attempt 1: {message: 'null value in column "ceiling_price" of relation "Item" violates not-null constraint', status: 500, isTimeout: false, isNetworkError: false}
apiCall @ apiConfig.js:93
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:65  POST http://localhost:5000/api/items 500 (Internal Server Error)
apiCall @ apiConfig.js:65
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:93 API Error (/items) - Attempt 2: {message: 'null value in column "ceiling_price" of relation "Item" violates not-null constraint', status: 500, isTimeout: false, isNetworkError: false}
apiCall @ apiConfig.js:93
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:65  POST http://localhost:5000/api/items 500 (Internal Server Error)
apiCall @ apiConfig.js:65
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
apiConfig.js:93 API Error (/items) - Attempt 3: {message: 'null value in column "ceiling_price" of relation "Item" violates not-null constraint', status: 500, isTimeout: false, isNetworkError: false}
apiCall @ apiConfig.js:93
await in apiCall
createItem @ inventoryService.js:28
handleSubmit @ NewItem.jsx:284
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
NewItem.jsx:306 Error submitting form: Error: null value in column "ceiling_price" of relation "Item" violates not-null constraint
    at apiCall (apiConfig.js:79:23)
    at async createItem (inventoryService.js:28:10)
    at async handleSubmit (NewItem.jsx:284:26)
handleSubmit @ NewItem.jsx:306
await in handleSubmit
executeDispatch @ react-dom_client.js?v=03b64f52:11940
runWithFiberInDEV @ react-dom_client.js?v=03b64f52:1540
processDispatchQueue @ react-dom_client.js?v=03b64f52:11976
(anonymous) @ react-dom_client.js?v=03b64f52:12396
batchedUpdates$1 @ react-dom_client.js?v=03b64f52:2701
dispatchEventForPluginEventSystem @ react-dom_client.js?v=03b64f52:12085
dispatchEvent @ react-dom_client.js?v=03b64f52:15036
dispatchDiscreteEvent @ react-dom_client.js?v=03b64f52:15017
