'use strict';
const bodyParser = require('body-parser');

const parseUrlencoded = bodyParser.urlencoded({ extended: false });

/**
 * @this express.Router
 * @param {Object} controllers
 */
module.exports = function (controllers) {

  this.get('/v1/keys', controllers.cache.list);
  this.get('/v1/keys/:key', controllers.cache.get);
  this.post('/v1/keys/:key', parseUrlencoded, controllers.cache.set); // x-www-form-urlencoded content type is expected
  this.delete('/v1/keys/:key', controllers.cache.deleteKey);
  this.delete('/v1/keys', controllers.cache.deleteAll);
};
