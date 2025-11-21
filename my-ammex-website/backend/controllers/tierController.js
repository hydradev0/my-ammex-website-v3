const { getModels } = require('../config/db');

// Helper: calculate lifetime spend from invoices with status in allowed set
async function computeLifetimeSpend(customerId, statuses = ['completed', 'partially paid']) {
  try {
    const { Invoice } = getModels();
    const { Op } = require('sequelize');
    const total = await Invoice.sum('totalAmount', {
      where: {
        customerId,
        status: { [Op.in]: statuses }
      }
    });
    return Number(total || 0);
  } catch (_) {
    return 0;
  }
}

// Seed tiers if empty
async function ensureSeedTiers() {
  const { Tier } = getModels();
  try {
    const count = await Tier.count();
    if (count > 0) return;
    await Tier.bulkCreate([
      { name: 'Bronze', discountPercent: 0, minSpend: 0, priority: 1, isActive: true },
      { name: 'Silver', discountPercent: 10, minSpend: 10000, priority: 2, isActive: true },
      { name: 'Gold', discountPercent: 20, minSpend: 50000, priority: 3, isActive: true },
      { name: 'Platinum', discountPercent: 30, minSpend: 100000, priority: 4, isActive: true },
    ]);
  } catch (_) {
    // ignore seeding errors
  }
}

// GET /api/settings/tiers
exports.getAllTiers = async (req, res, next) => {
  try {
    const { Tier } = getModels();
    await ensureSeedTiers();
    const tiers = await Tier.findAll({
      order: [['priority', 'ASC'], ['minSpend', 'ASC']]
    });
    res.json({ success: true, data: tiers });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/tiers (?alignMinSpendToCustomer=:customerId)
exports.saveTiers = async (req, res, next) => {
  try {
    const { Tier } = getModels();
    const tiers = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.tiers) ? req.body.tiers : []);
    if (!Array.isArray(tiers)) {
      return res.status(400).json({ success: false, message: 'Invalid tiers payload' });
    }

    // Optional testing helper: align minSpend to a customer's current spend
    const alignCustomerId = req.query?.alignMinSpendToCustomer ? Number(req.query.alignMinSpendToCustomer) : null;
    let alignedSpend = null;
    if (alignCustomerId) {
      alignedSpend = await computeLifetimeSpend(alignCustomerId);
    }

    // Replace all tiers (simple approach)
    await Tier.destroy({ where: {} });
    const toCreate = tiers.map(t => ({
      name: String(t.name || '').trim(),
      discountPercent: Number(t.discountPercent || 0),
      minSpend: alignedSpend != null && t.name !== 'Bronze' ? Number(alignedSpend) : Number(t.minSpend || 0),
      isActive: !!t.isActive,
      priority: Number(t.priority || 0),
    }));
    await Tier.bulkCreate(toCreate);
    res.json({ success: true, message: 'Tiers saved successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/tiers/me
exports.getMyTier = async (req, res, next) => {
  try {
    const { Customer, Tier } = getModels();
    // Map auth user -> customer
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      await ensureSeedTiers();
      const TierModel = Tier;
      const tiers = await TierModel.findAll({ where: { isActive: true }, order: [['priority', 'ASC']] });
      const fallbackTier = tiers[0] || { name: 'Bronze', discountPercent: 0, minSpend: 0, priority: 1 };
      const nextTier = tiers.find(t => Number(t.priority) > Number(fallbackTier.priority));
      return res.json({
        success: true,
        data: {
          id: fallbackTier.id || null,
          name: fallbackTier.name,
          discountPercent: Number(fallbackTier.discountPercent || 0),
          minSpend: Number(fallbackTier.minSpend || 0),
          currentSpend: 0,
          lifetimeSpend: 0,
          nextTier: nextTier ? {
            name: nextTier.name,
            minSpend: Number(nextTier.minSpend || 0),
            discountPercent: Number(nextTier.discountPercent || 0)
          } : null
        }
      });
    }
    const currentSpend = await computeLifetimeSpend(customer.id);
    const tiers = await Tier.findAll({ where: { isActive: true }, order: [['priority', 'ASC']] });
    // Choose current tier by spend threshold if no tier assigned
    let currentTier = null;
    for (let i = tiers.length - 1; i >= 0; i--) {
      const t = tiers[i];
      if (currentSpend >= Number(t.minSpend || 0)) {
        currentTier = t;
        break;
      }
    }
    currentTier = currentTier || tiers[0] || { name: 'Bronze', discountPercent: 0, minSpend: 0 };
    // Next tier is next with higher priority
    const nextTier = tiers.find(t => Number(t.priority) > Number(currentTier.priority));
    res.json({
      success: true,
      data: {
        id: currentTier.id,
        name: currentTier.name,
        discountPercent: Number(currentTier.discountPercent || 0),
        minSpend: Number(currentTier.minSpend || 0),
        currentSpend: Number(currentSpend),
        lifetimeSpend: Number(currentSpend),
        nextTier: nextTier ? {
          name: nextTier.name,
          minSpend: Number(nextTier.minSpend || 0),
          discountPercent: Number(nextTier.discountPercent || 0)
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/tiers/customer/:customerId
exports.getCustomerTier = async (req, res, next) => {
  try {
    const { Customer, Tier } = getModels();
    const customerId = Number(req.params.customerId);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const currentSpend = await computeLifetimeSpend(customer.id);
    const tiers = await Tier.findAll({ where: { isActive: true }, order: [['priority', 'ASC']] });
    let currentTier = null;
    for (let i = tiers.length - 1; i >= 0; i--) {
      const t = tiers[i];
      if (currentSpend >= Number(t.minSpend || 0)) {
        currentTier = t;
        break;
      }
    }
    currentTier = currentTier || tiers[0] || { name: 'Bronze', discountPercent: 0 };
    res.json({
      success: true,
      data: {
        id: currentTier.id,
        name: currentTier.name,
        discountPercent: Number(currentTier.discountPercent || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};


