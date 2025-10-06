const Unit = require('../Models/Unit');

exports.getAll = async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في جلب الوحدات' });
  }
};

exports.getById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found', errorAr: 'الوحدة غير موجودة' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في جلب الوحدة' });
  }
};

exports.create = async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message, errorAr: 'خطأ في إنشاء الوحدة' });
  }
};

exports.update = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!unit) return res.status(404).json({ error: 'Unit not found', errorAr: 'الوحدة غير موجودة' });
    res.json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message, errorAr: 'خطأ في تحديث الوحدة' });
  }
};

exports.delete = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found', errorAr: 'الوحدة غير موجودة' });
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في حذف الوحدة' });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required', errorAr: 'معرف المتجر مطلوب' });
    }
    const units = await Unit.find({ store: storeId });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في جلب الوحدات حسب المتجر' });
  }
}; 