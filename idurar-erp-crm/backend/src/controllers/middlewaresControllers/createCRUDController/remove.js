const { sendDtoResponse } = require('@/controllers/helpers/dto');

const remove = async (Model, req, res) => {
  // Find the document by id and delete it
  let updates = {
    removed: true,
  };
  // Find the document by id and delete it
  const result = await Model.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    { $set: updates },
    {
      new: true, // return the new result instead of the old one
    }
  ).exec();
  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    return sendDtoResponse(res, {
      status: 200,
      success: true,
      result,
      message: 'Successfully Deleted the document ',
    });
  }
};

module.exports = remove;
