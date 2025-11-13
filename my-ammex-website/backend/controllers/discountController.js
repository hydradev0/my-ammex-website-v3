const { getModels, getSequelize } = require('../config/db');
const { Op } = require('sequelize');

// Get all items with pagination for discount management
const getAllItemsForDiscount = async (req, res, next) => {
  try {
    const sequelize = getSequelize();
    const { Item, Category, Unit } = getModels();
    // The 'limit' here controls how many items to fetch per backend request.
    // If this is different from the PAGE_WINDOW_MULTIPLIER * itemsPerPage in ProductDiscountManagement.jsx,
    // the frontend pagination and product lists may not line up with backend results.
    // (E.g., too low = not enough items for several pages on frontend; too high = potentially inefficient extra fetch.)
    // It's best to keep this in sync with frontend windowed fetching for smooth pagination.
    // The frontend requests items using a "window" of 12 pages at a time (itemsPerPage = 12, PAGE_WINDOW_MULTIPLIER = 1 by default, so limit=12).
    // If you increase PAGE_WINDOW_MULTIPLIER in the frontend, the "limit" here should match itemsPerPage * PAGE_WINDOW_MULTIPLIER.
    // By default, use limit=12 for one page, but allow override through query param.
    const { page = 1, limit = 12, category, search } = req.query;
    
    // Build where clause
    const whereClause = { isActive: true };
    
    if (category && category !== 'all') {
      whereClause.categoryId = category;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { modelNo: { [Op.iLike]: `%${search}%` } },
        { itemName: { [Op.iLike]: `%${search}%` } },
        { itemCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const items = await Item.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'modelNo',
        'itemName',
        'itemCode',
        'sellingPrice',
        'categoryId'
      ],
      include: [
        { 
          model: Category, 
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    // Format response to match frontend expectations
    const formattedItems = items.rows.map(item => ({
      id: item.id,
      name: item.itemName,
      modelNo: item.modelNo,
      itemCode: item.itemCode,
      price: parseFloat(item.sellingPrice) || 0,
      category: item.category ? item.category.name : 'Uncategorized'
    }));

    res.json({
      success: true,
      data: formattedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: items.count,
        totalPages: Math.ceil(items.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching items for discount:', error);
    next(error);
  }
};

// Get all currently discounted products
const getDiscountedProducts = async (req, res, next) => {
  try {
    const sequelize = getSequelize();
    const { Item, Category } = getModels();
    
    // Query to get active discounts (including expired ones for admin view)
    // We check date range to determine if discount is actually active
    const discounts = await sequelize.query(`
      SELECT 
        pd.id as discount_id,
        pd.item_id,
        pd.discount_percentage,
        pd.start_date,
        pd.end_date,
        pd.is_active,
        pd.created_at,
        i.item_code,
        i.model_no,
        i.item_name,
        i.selling_price,
        c.name as category_name,
        CASE 
          WHEN pd.is_active = true 
            AND (pd.start_date IS NULL OR pd.start_date <= CURRENT_DATE)
            AND (pd.end_date IS NULL OR pd.end_date >= CURRENT_DATE)
          THEN true
          ELSE false
        END as is_currently_active
      FROM "ProductDiscount" pd
      INNER JOIN "Item" i ON pd.item_id = i.id
      LEFT JOIN "Category" c ON i.category_id = c.id
      WHERE pd.is_active = true
        AND i.is_active = true
      ORDER BY pd.created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Format response
    const formattedDiscounts = discounts.map(item => {
      const originalPrice = parseFloat(item.selling_price) || 0;
      const discountPercentage = parseFloat(item.discount_percentage) || 0;
      const discountedPrice = originalPrice * (1 - discountPercentage / 100);

      return {
        id: item.item_id,
        discountId: item.discount_id,
        itemCode: item.item_code,
        modelNo: item.model_no,
        name: item.item_name,
        category: item.category_name || 'Uncategorized',
        price: originalPrice,
        discountPercentage: discountPercentage,
        discountedPrice: parseFloat(discountedPrice.toFixed(2)),
        startDate: item.start_date,
        endDate: item.end_date,
        isActive: item.is_currently_active // Use calculated active status based on date range
      };
    });

    res.json({
      success: true,
      data: formattedDiscounts
    });
  } catch (error) {
    console.error('Error fetching discounted products:', error);
    next(error);
  }
};

// Apply discount to products
const applyDiscount = async (req, res, next) => {
  const sequelize = getSequelize();
  const transaction = await sequelize.transaction();
  
  try {
    const { productIds, discountPercentage, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one product ID'
      });
    }

    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 1 and 100'
      });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Check if items exist
    const { Item } = getModels();
    const items = await Item.findAll({
      where: { 
        id: { [Op.in]: productIds },
        isActive: true
      },
      transaction
    });

    if (items.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'No valid active items found'
      });
    }

    // Deactivate existing discounts for these items
    await sequelize.query(`
      UPDATE "ProductDiscount"
      SET is_active = false
      WHERE item_id IN (:productIds)
        AND is_active = true
    `, {
      replacements: { productIds },
      transaction
    });

    // Insert new discounts
    const discountRecords = productIds.map(itemId => ({
      item_id: itemId,
      discount_percentage: discount,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await sequelize.query(`
      INSERT INTO "ProductDiscount" 
        (item_id, discount_percentage, start_date, end_date, is_active, created_by, created_at, updated_at)
      VALUES ${discountRecords.map((_, index) => 
        `(:item_id_${index}, :discount_percentage_${index}, :start_date_${index}, :end_date_${index}, :is_active_${index}, :created_by_${index}, :created_at_${index}, :updated_at_${index})`
      ).join(', ')}
    `, {
      replacements: discountRecords.reduce((acc, record, index) => ({
        ...acc,
        [`item_id_${index}`]: record.item_id,
        [`discount_percentage_${index}`]: record.discount_percentage,
        [`start_date_${index}`]: record.start_date,
        [`end_date_${index}`]: record.end_date,
        [`is_active_${index}`]: record.is_active,
        [`created_by_${index}`]: record.created_by,
        [`created_at_${index}`]: record.created_at,
        [`updated_at_${index}`]: record.updated_at
      }), {}),
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: `Discount of ${discount}% applied to ${items.length} product(s)`,
      data: {
        appliedCount: items.length,
        discountPercentage: discount,
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error applying discount:', error);
    next(error);
  }
};

// Remove discount from a product
  const removeDiscount = async (req, res, next) => {
  try {
    const sequelize = getSequelize();
    const { id } = req.params; // product/item ID

    // Deactivate the discount
    const result = await sequelize.query(`
      UPDATE "ProductDiscount"
      SET is_active = false, updated_at = NOW()
      WHERE item_id = :itemId
        AND is_active = true
      RETURNING id
    `, {
      replacements: { itemId: id },
      type: sequelize.QueryTypes.UPDATE
    });

    if (!result[1] || result[1].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active discount found for this product'
      });
    }

    res.json({
      success: true,
      message: 'Discount removed successfully'
    });
  } catch (error) {
    console.error('Error removing discount:', error);
    next(error);
  }
};

// Get discount settings (optional - for future configuration)
const getDiscountSettings = async (req, res, next) => {
  try {
    // For now, return default settings
    // In the future, this could be stored in a settings table
    res.json({
      success: true,
      data: {
        max_discount: 50,
        discount_tiers: [
          { label: 'Small', value: 5 },
          { label: 'Medium', value: 10 },
          { label: 'Large', value: 15 },
          { label: 'X-Large', value: 20 }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching discount settings:', error);
    next(error);
  }
};

module.exports = {
  getAllItemsForDiscount,
  getDiscountedProducts,
  applyDiscount,
  removeDiscount,
  getDiscountSettings
};

