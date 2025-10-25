const { getModels } = require('../config/db');

// Get all settings by category
const getSettingsByCategory = async (req, res, next) => {
  try {
    const { Settings } = getModels();
    const { category } = req.params;

    const settings = await Settings.findAll({
      where: { 
        category,
        isActive: true 
      },
      order: [['settingKey', 'ASC']]
    });

    // Transform settings into a more usable format
    const settingsObject = {};
    settings.forEach(setting => {
      let value = setting.settingValue;
      
      // Convert value based on type
      if (setting.settingType === 'number') {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean') {
        value = value === 'true';
      } else if (setting.settingType === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value;
        }
      }
      
      settingsObject[setting.settingKey] = value;
    });

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    next(error);
  }
};

// Get all settings
const getAllSettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();

    const settings = await Settings.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });

    // Group settings by category
    const groupedSettings = {};
    settings.forEach(setting => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {};
      }
      
      let value = setting.settingValue;
      
      // Convert value based on type
      if (setting.settingType === 'number') {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean') {
        value = value === 'true';
      } else if (setting.settingType === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value;
        }
      }
      
      groupedSettings[setting.category][setting.settingKey] = value;
    });

    res.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    next(error);
  }
};

// Update settings
const updateSettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      // Find the setting to get its type
      const setting = await Settings.findOne({ where: { settingKey: key } });
      
      if (!setting) {
        throw new Error(`Setting '${key}' not found`);
      }

      // Convert value to string based on type
      let stringValue;
      if (setting.settingType === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else if (setting.settingType === 'number') {
        stringValue = value.toString();
      } else if (setting.settingType === 'json') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = value.toString();
      }

      return Settings.update(
        { settingValue: stringValue },
        { where: { settingKey: key } }
      );
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update company settings
const updateCompanySettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();
    const companyData = req.body;

    const companySettings = [
      'company_name',
      'company_email', 
      'company_phone',
      'company_address',
      'company_website',
      'company_tax_id',
      'company_description',
      'company_logo_url'
    ];

    const updatePromises = companySettings.map(async (key) => {
      if (companyData[key] !== undefined) {
        return Settings.update(
          { settingValue: companyData[key] },
          { where: { settingKey: key } }
        );
      }
    });

    await Promise.all(updatePromises.filter(Boolean));

    res.json({
      success: true,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update markup settings
const updateMarkupSettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();
    const markupData = req.body;

    const markupSettings = [
      'markup_enabled',
      'markup_rate',
      'markup_type',
      'fixed_markup_amount'
    ];

    const updatePromises = markupSettings.map(async (key) => {
      if (markupData[key] !== undefined) {
        let value = markupData[key];
        
        // Convert boolean values
        if (key === 'markup_enabled') {
          value = value ? 'true' : 'false';
        }
        
        return Settings.update(
          { settingValue: value.toString() },
          { where: { settingKey: key } }
        );
      }
    });

    await Promise.all(updatePromises.filter(Boolean));

    res.json({
      success: true,
      message: 'Markup settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get company settings for invoice template
const getCompanySettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();

    const settings = await Settings.findAll({
      where: { 
        category: 'company',
        isActive: true 
      }
    });

    const companyInfo = {};
    settings.forEach(setting => {
      companyInfo[setting.settingKey] = setting.settingValue;
    });

    res.json({
      success: true,
      data: companyInfo
    });
  } catch (error) {
    next(error);
  }
};

// Get markup settings for product pricing
const getMarkupSettings = async (req, res, next) => {
  try {
    const { Settings } = getModels();

    const settings = await Settings.findAll({
      where: { 
        category: 'markup',
        isActive: true 
      }
    });

    const markupInfo = {};
    settings.forEach(setting => {
      let value = setting.settingValue;
      
      if (setting.settingType === 'number') {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean') {
        value = value === 'true';
      }
      
      markupInfo[setting.settingKey] = value;
    });

    res.json({
      success: true,
      data: markupInfo
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettingsByCategory,
  getAllSettings,
  updateSettings,
  updateCompanySettings,
  updateMarkupSettings,
  getCompanySettings,
  getMarkupSettings
};
