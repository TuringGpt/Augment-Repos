/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

const { logger } = require('../utils/logger');

const getRequestLogger = (req) => req?.log || logger;

exports.catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch((error) => {
      if (error.name == 'ValidationError') {
        getRequestLogger(req).warn('Validation error caught in controller', {
          controller: fn.name,
          error,
        });

        return res.status(400).json({
          success: false,
          result: null,
          message: 'Required fields are not supplied',
          controller: fn.name,
          error: error,
        });
      } else {
        getRequestLogger(req).error('Unhandled controller error', {
          controller: fn.name,
          error,
        });

        // Server Error
        return res.status(500).json({
          success: false,
          result: null,
          message: error.message,
          controller: fn.name,
          error: error,
        });
      }
    });
  };
};

/*
  Not Found Error Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
  getRequestLogger(req).warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(404).json({
    success: false,
    message: "Api url doesn't exist ",
  });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (error, req, res, next) => {
  getRequestLogger(req).error('Development error handler caught an exception', { error });

  error.stack = error.stack || '';
  const errorDetails = {
    message: error.message,
    status: error.status,
    stackHighlighted: error.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>'),
  };

  return res.status(500).json({
    success: false,
    message: error.message,
    error: error,
  });
};

/*
  Production Error Handler

  No stacktraces are leaked to admin
*/
exports.productionErrors = (error, req, res, next) => {
  getRequestLogger(req).error('Production error handler caught an exception', { error });

  return res.status(500).json({
    success: false,
    message: error.message,
    error: error,
  });
};
