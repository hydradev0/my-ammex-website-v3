const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentMethodController');

// List all (client will filter active if needed)
router.get('/', ctrl.listActive);

// Create
router.post('/', ctrl.create);

// Update
router.put('/:id', ctrl.update);
router.patch('/:id', ctrl.update);

// Delete
router.delete('/:id', ctrl.remove);

module.exports = router;


