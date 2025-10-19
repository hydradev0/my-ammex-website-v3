const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const { importCSV, getImportHistory } = require('../controllers/importController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/imports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only CSV files
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('Admin'));

// @route   POST /api/import/csv
// @desc    Import CSV file
// @access  Admin only
router.post('/csv', upload.single('file'), importCSV);

// @route   GET /api/import/history
// @desc    Get import history
// @access  Admin only
router.get('/history', getImportHistory);

module.exports = router;

