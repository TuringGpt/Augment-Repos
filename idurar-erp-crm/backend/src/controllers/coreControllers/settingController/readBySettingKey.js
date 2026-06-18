const mongoose = require('mongoose');
const { sendDtoResponse } = require('@/controllers/helpers/dto');

const Model = mongoose.model('Setting');

const readBySettingKey = async (req, res) => {
  // Find document by id
  const settingKey = req.params.settingKey || undefined;

  if (!settingKey) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settingKey provided ',
    });
  }

  const result = await Model.findOne({
    settingKey,
  });

  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found by this settingKey: ' + settingKey,
    });
  } else {
    // Return success resposne
    return sendDtoResponse(res, {
      status: 200,
      success: true,
      result,
      message: 'we found this document by this settingKey: ' + settingKey,
    });
  }
};

module.exports = readBySettingKey;
