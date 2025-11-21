const { getModels } = require('../config/db');
const { Op } = require('sequelize');

async function computeLifetimeSpend(customerId) {
  try {
    const { Invoice } = getModels();
    const total = await Invoice.sum('totalAmount', {
      where: {
        customerId,
        status: { [Op.in]: ['completed', 'partially paid'] }
      }
    });
    return Number(total || 0);
  } catch (_) {
    return 0;
  }
}

async function checkAndUpgradeTier(customerId) {
  try {
    const { Customer, Tier } = getModels();
    const spend = await computeLifetimeSpend(customerId);
    const tiers = await Tier.findAll({ where: { isActive: true }, order: [['priority', 'DESC']] });
    if (!tiers || tiers.length === 0) return null;
    const eligible = tiers.find(t => spend >= Number(t.minSpend || 0));
    if (!eligible) return null;
    // Update customer's tierId (best eligible)
    await Customer.update({ tierId: eligible.id }, { where: { id: customerId } });
    return eligible;
  } catch (e) {
    // Non-fatal: do not break invoice/payment flow
    return null;
  }
}

module.exports = {
  computeLifetimeSpend,
  checkAndUpgradeTier
};


