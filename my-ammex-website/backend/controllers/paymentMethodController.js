const { getModels } = require('../config/db');

exports.listActive = async (req, res, next) => {
  try {
    const { PaymentMethod } = getModels() || {};
    if (!PaymentMethod) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const methods = await PaymentMethod.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: methods });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { PaymentMethod } = getModels() || {};
    if (!PaymentMethod) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const created = await PaymentMethod.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { PaymentMethod } = getModels() || {};
    if (!PaymentMethod) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const { id } = req.params;
    const method = await PaymentMethod.findByPk(id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found' });
    await method.update(req.body);
    res.json({ success: true, data: method });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { PaymentMethod } = getModels() || {};
    if (!PaymentMethod) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const { id } = req.params;
    const method = await PaymentMethod.findByPk(id);
    if (!method) return res.status(404).json({ success: false, message: 'Payment method not found' });
    await method.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};


