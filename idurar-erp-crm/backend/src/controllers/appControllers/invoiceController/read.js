const mongoose = require('mongoose');
const { pickDtoFields, sendDtoResponse } = require('@/controllers/helpers/dto');

const Model = mongoose.model('Invoice');

const invoiceDtoOptions = {
  propertyTransformers: {
    createdBy: (createdBy) => pickDtoFields(createdBy, ['name']),
  },
};

const read = async (req, res) => {
  // Find document by id
  const result = await Model.findOne({
    _id: req.params.id,
    removed: false,
  })
    .populate('createdBy', 'name')
    .exec();
  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    // Return success resposne
    return sendDtoResponse(res, {
      status: 200,
      success: true,
      result,
      message: 'we found this document ',
      dtoOptions: invoiceDtoOptions,
    });
  }
};

module.exports = read;
