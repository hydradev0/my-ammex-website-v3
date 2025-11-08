import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Navigation from '../../Components/Navigation';
import { apiCall } from '../../utils/apiConfig';
import TopBar from '../../Components/TopBar';

const IMPORT_TYPES = [
  { value: 'sales', label: 'Monthly Sales Data', description: 'Import  aggregated monthly sales (sales_fact_monthly)' },
  { value: 'sales_by_product', label: 'Sales by Product', description: 'Import monthly sales product (sales_fact_monthly_by_product)' },
  { value: 'bulk', label: 'Bulk Orders by Name', description: 'Import customer bulk orders by customer (customer_bulk_monthly_by_name)' }
];

// Function to get required columns for each import type
const getRequiredColumns = (type) => {
  switch (type) {
    case 'sales':
      return ['month_start', 'total_revenue'];
    case 'sales_by_product':
      return ['month_start', 'model_no'];
    case 'bulk':
      return ['month_start', 'customer_name', 'bulk_orders_amount', 'model_no'];
    default:
      return [];
  }
};

// Function to get optional columns for each import type
const getOptionalColumns = (type) => {
  switch (type) {
    case 'sales':
      return ['total_orders', 'total_units', 'avg_order_value', 'new_customers'];
    case 'sales_by_product':
      return ['category_name'];
    case 'bulk':
      return [];
    default:
      return [];
  }
};

// Function to generate sample CSV data
const generateSampleCSV = (type) => {
  let headers = [];
  let sampleRow = [];
  
  switch (type) {
    case 'sales':
      headers = ['month_start', 'total_revenue', 'total_orders', 'total_units', 'avg_order_value', 'new_customers'];
      sampleRow = ['2024-01-01', '150000.00', '250', '5000', '600.00', '15'];
      break;
    case 'sales_by_product':
      headers = ['month_start', 'model_no', 'category_name'];
      sampleRow = ['2024-01-01', 'APFN46100', 'Nitrile Gloves'];
      break;
    case 'bulk':
      headers = ['month_start', 'customer_name', 'bulk_orders_amount', 'model_no'];
      sampleRow = ['2024-01-01', 'ABC Company', '25000.00', 'APFN46100'];
      break;
    default:
      return '';
  }
  
  return headers.join(',') + '\n' + sampleRow.join(',');
};

function ImportData() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importType, setImportType] = useState('sales');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }
    
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }
    
    setSelectedFile(file);
    setResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);

      const response = await apiCall('/import/csv', {
        method: 'POST',
        body: formData,
        // Don't pass headers - apiCall will handle Authorization and skip Content-Type for FormData
      });

      setResult({
        success: true,
        ...response
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error.message || 'Import failed. Please check your file format and try again.',
        errors: error.errors || []
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV(importType);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${importType}_import.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadFullErrorReport = () => {
    if (!result || !result.errors || result.errors.length === 0) return;
    
    const errorReport = result.errors.map(err => `Row ${err.row}: ${err.message}`).join('\n');
    const blob = new Blob([errorReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setImportType('sales');
  };

  return (
    <div className="min-h-screen ">
      <TopBar />
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Data</h1>
          <p className="text-gray-600">Upload CSV files to import historical data into the system</p>
        </div>

        {/* Import Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Import Type</h2>
          <div className="grid grid-cols-1 gap-4">
            {IMPORT_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={() => setImportType(type.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  importType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    checked={importType === type.value}
                    onChange={() => setImportType(type.value)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    
                    {/* Column Requirements */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Required CSV columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {getRequiredColumns(type.value).map((column, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded border border-red-300 font-semibold"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                      {getOptionalColumns(type.value).length > 0 && (
                        <>
                          <p className="text-xs font-medium text-gray-600 mb-2 mt-2">Optional columns:</p>
                          <div className="flex flex-wrap gap-1">
                            {getOptionalColumns(type.value).map((column, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200"
                              >
                                {column}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Download Sample CSV Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={downloadSampleCSV}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Sample CSV
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileText className="text-green-500 mb-3" size={48} />
                <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={resetForm}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Choose Different File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="text-gray-400 mb-3" size={48} />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-gray-600 mb-4">or</p>
                <label
                  htmlFor="csvFile"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full mt-6 px-6 py-3 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {importing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                'Import Data'
              )}
            </button>
          )}
        </div>

        {/* Import Result */}
        {result && (
          <div className={`rounded-lg shadow-md p-6 ${
            result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="text-green-600 mr-3 flex-shrink-0" size={32} />
              ) : (
                <XCircle className="text-red-600 mr-3 flex-shrink-0" size={32} />
              )}
              
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                
                <p className={`mb-4 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>

                {result.success && result.stats && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Import Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Rows</p>
                        <p className="text-2xl font-bold text-gray-900">{result.stats.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Successfully Imported</p>
                        <p className="text-2xl font-bold text-green-600">{result.stats.imported}</p>
                      </div>
                      {result.stats.skipped > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Skipped</p>
                          <p className="text-2xl font-bold text-yellow-600">{result.stats.skipped}</p>
                        </div>
                      )}
                      {result.stats.failed > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{result.stats.failed}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <AlertCircle className="text-yellow-600 mr-2" size={20} />
                        <h4 className="font-semibold text-gray-900">Errors Found ({result.errors.length})</h4>
                      </div>
                      {result.errors.length > 10 && (
                        <button
                          onClick={downloadFullErrorReport}
                          className="px-3 py-1 cursor-pointer bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          Download Full Report
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {result.errors.slice(0, 10).map((error, idx) => (
                        <div key={idx} className="text-sm text-gray-700 py-2 border-b border-gray-200 last:border-b-0">
                          <span className="font-medium">Row {error.row}:</span> {error.message}
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Showing first 10 of {result.errors.length} errors. Download full report to see all.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetForm}
                  className="mt-4 px-6 py-2 cursor-pointer bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Import Another File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Import Instructions:</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li><strong>File Format:</strong> Only CSV files are supported</li>
            <li><strong>Column Headers:</strong> First row must contain exact column names (case-sensitive)</li>
            <li><strong>Date Format:</strong> Use YYYY-MM-DD format for all date columns</li>
            <li><strong>Data Validation:</strong> All data will be validated before import</li>
            <li><strong>Duplicates:</strong> Existing records will be updated with new values</li>
            <li><strong>File Size:</strong> Maximum 10MB per file</li>
            <li><strong>Purpose:</strong> This is for importing historical data</li>
          </ul>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 Quick Reference:</h4>
            <div className="text-sm text-blue-800 space-y-3">
              <div>
                <p className="font-semibold">Monthly Sales Data:</p>
                <p className="ml-2"><span className="text-red-600 font-semibold">Required:</span> month_start, total_revenue</p>
                <p className="ml-2"><span className="text-blue-600">Optional:</span> total_orders, total_units, avg_order_value, new_customers</p>
              </div>
              <div>
                <p className="font-semibold">Sales by Product:</p>
                <p className="ml-2"><span className="text-red-600 font-semibold">Required:</span> month_start, model_no</p>
                <p className="ml-2"><span className="text-blue-600">Optional:</span> category_name</p>
              </div>
              <div>
                <p className="font-semibold">Bulk Orders by Name:</p>
                <p className="ml-2"><span className="text-red-600 font-semibold">Required:</span> month_start, customer_name, bulk_orders_amount, model_no</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportData;

