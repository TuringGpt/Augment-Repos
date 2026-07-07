const mongoose = require('mongoose');
const { sendDtoResponse } = require('@/controllers/helpers/dto');

const read = async (userModel, req, res) => {
  const User = mongoose.model(userModel);

  // Find document by id
  const tmpResult = await User.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();
  // If no results found, return document not found
  if (!tmpResult) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    // Return success resposne
    let result = {
      _id: tmpResult._id,
      enabled: tmpResult.enabled,
      email: tmpResult.email,
      name: tmpResult.name,
      surname: tmpResult.surname,
      photo: tmpResult.photo,
      role: tmpResult.role,
    };

    return sendDtoResponse(res, {
      status: 200,
      success: true,
      result,
      message: 'we found this document ',
    });
  }
};

module.exports = read;
