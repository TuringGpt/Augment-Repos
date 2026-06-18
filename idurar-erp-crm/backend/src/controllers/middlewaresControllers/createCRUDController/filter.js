const { sendDtoResponse } = require('@/controllers/helpers/dto');

const filter = async (Model, req, res) => {
  if (req.query.filter === undefined || req.query.equal === undefined) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'filter not provided correctly',
    });
  }
  const result = await Model.find({
    removed: false,
  })
    .where(req.query.filter)
    .equals(req.query.equal)
    .exec();
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
      message: 'Successfully found all documents  ',
    });
  }
};

module.exports = filter;
