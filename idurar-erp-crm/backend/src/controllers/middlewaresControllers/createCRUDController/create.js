const { sendDtoResponse } = require('@/controllers/helpers/dto');

const create = async (Model, req, res) => {
  // Creating a new document in the collection
  req.body.removed = false;
  const result = await new Model({
    ...req.body,
  }).save();

  // Returning successfull response
  return sendDtoResponse(res, {
    status: 200,
    success: true,
    result,
    message: 'Successfully Created the document in Model ',
  });
};

module.exports = create;
