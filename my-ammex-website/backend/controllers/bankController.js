const { getModels } = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { Bank } = getModels() || {};
    if (!Bank) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const banks = await Bank.findAll({ order: [['bankName', 'ASC']] });
    res.json({ success: true, data: banks });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { Bank } = getModels() || {};
    if (!Bank) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const created = await Bank.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { Bank } = getModels() || {};
    if (!Bank) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const { id } = req.params;
    const bank = await Bank.findByPk(id);
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
    await bank.update(req.body);
    res.json({ success: true, data: bank });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { Bank } = getModels() || {};
    if (!Bank) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const { id } = req.params;
    const bank = await Bank.findByPk(id);
    if (!bank) return res.status(404).json({ success: false, message: 'Bank not found' });
    await bank.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
};


