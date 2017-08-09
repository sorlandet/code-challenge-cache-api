'use strict';

const _ = require('lodash');

module.exports = () => {
  let fields = ['message', 'code', 'errors', 'status', 'statusCode'];

  return {
    handler: (err, req, res, next) => {
      const type = 'json'; //Always sent json for AJAX reqs

      err = _.pick(err, fields);
      err.code = err.statusCode || err.status || err.code;

      res.status(err.code);

      console.error(err);

      switch (type) {
        case 'json':
          return res.json(err);
        default:
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(err.message);
      }
    }
  };
};
