const { getModels } = require('../config/db');

// Get all PayMongo payment methods
const getAllPaymentMethods = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();

    // Check if table exists by trying to describe it
    try {
      await PayMongoPaymentMethod.describe();
    } catch (tableError) {
      console.error('PayMongoPaymentMethod table does not exist:', tableError.message);
      return res.status(500).json({
        success: false,
        message: 'PayMongoPaymentMethod table does not exist. Please run database migration.',
        error: 'TABLE_NOT_FOUND'
      });
    }

    const paymentMethods = await PayMongoPaymentMethod.findAll({
      order: [['sortOrder', 'ASC'], ['methodName', 'ASC']]
    });

    res.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Error fetching PayMongo payment methods:', error);
    next(error);
  }
};

// Get specific PayMongo payment method
const getPaymentMethodById = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();
    const { id } = req.params;

    const paymentMethod = await PayMongoPaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.json({
      success: true,
      data: paymentMethod
    });

  } catch (error) {
    console.error('Error fetching PayMongo payment method:', error);
    next(error);
  }
};

// Update PayMongo payment method
const updatePaymentMethod = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (updateData.methodName && !updateData.methodName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Method name is required'
      });
    }

    const paymentMethod = await PayMongoPaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Update the payment method
    await paymentMethod.update(updateData);

    res.json({
      success: true,
      data: paymentMethod,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Error updating PayMongo payment method:', error);
    next(error);
  }
};

// Toggle payment method enabled/disabled
const togglePaymentMethod = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();
    const { id } = req.params;

    const paymentMethod = await PayMongoPaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Toggle the enabled status
    await paymentMethod.update({ isEnabled: !paymentMethod.isEnabled });

    res.json({
      success: true,
      data: paymentMethod,
      message: `Payment method ${paymentMethod.isEnabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error toggling PayMongo payment method:', error);
    next(error);
  }
};

// Reorder payment methods
const reorderPaymentMethods = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();
    const { paymentMethods } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({
        success: false,
        message: 'Payment methods array is required'
      });
    }

    // Update sort order for each payment method
    const updatePromises = paymentMethods.map(({ id, sortOrder }) => 
      PayMongoPaymentMethod.update(
        { sortOrder },
        { where: { id } }
      )
    );

    await Promise.all(updatePromises);

    // Fetch updated payment methods
    const updatedMethods = await PayMongoPaymentMethod.findAll({
      order: [['sortOrder', 'ASC']]
    });

    res.json({
      success: true,
      data: updatedMethods,
      message: 'Payment methods reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering PayMongo payment methods:', error);
    next(error);
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  togglePaymentMethod,
  reorderPaymentMethods
};
