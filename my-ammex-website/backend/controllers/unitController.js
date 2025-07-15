const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Get all units
// @route   GET /api/units
// @access  Public
const getUnits = async (req, res) => {
  try {
    const models = getModels();
    const units = await models.Unit.findAll({
      where: { isActive: true }, // Filter for active units
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units'
    });
  }
};

// @desc    Get single unit
// @route   GET /api/units/:id
// @access  Public
const getUnit = async (req, res) => {
  try {
    const models = getModels();
    const { include } = req.query;
    
    let includeOptions = [];
    if (include === 'products') {
      includeOptions.push({
        model: models.Product,
        as: 'products',
        where: { isActive: true },
        required: false,
        include: [{
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });
    }
    
    const unit = await models.Unit.findByPk(req.params.id, {
      where: { isActive: true }, // Filter for active unit
      include: includeOptions,
      order: include === 'products' ? [['products', 'itemName', 'ASC']] : undefined
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unit'
    });
  }
};

// @desc    Create new unit
// @route   POST /api/units
// @access  Private
const createUnit = async (req, res) => {
  try {
    const models = getModels();
    const { name } = req.body;

    // Check if unit already exists
    const existingUnit = await models.Unit.findOne({ where: { name } });
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit already exists'
      });
    }

    const newUnit = await models.Unit.create({ name });

    res.status(201).json({
      success: true,
      data: newUnit
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private
const updateUnit = async (req, res) => {
  try {
    const models = getModels();
    const { name } = req.body;
    const currentUnit = await models.Unit.findByPk(req.params.id);

    if (!currentUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // 🔍 Check for duplicate name (excluding current unit)
    if (name && name !== currentUnit.name) {
      const existingUnit = await models.Unit.findOne({
        where: {
          name,
          id: { [Op.ne]: req.params.id } // ✅ Correct usage
        }
      });

      if (existingUnit) {
        return res.status(400).json({
          success: false,
          message: 'Unit name already exists'
        });
      }
    }

    await currentUnit.update(req.body);

    res.json({
      success: true,
      data: currentUnit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private
const deleteUnit = async (req, res) => {
  try {
    const models = getModels();
    const unit = await models.Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check if unit is being used by any products
    const productsUsingUnit = await models.Product.count({
      where: { unitId: req.params.id }
    });

    if (productsUsingUnit > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete unit. It is being used by ${productsUsingUnit} product(s).`
      });
    }

    await unit.update({ isActive: false });

    res.json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting unit'
    });
  }
};



module.exports = {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
}; 