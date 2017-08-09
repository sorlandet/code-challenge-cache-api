'use strict';

const Router = require('express').Router;
const requireAll = require('require-all');
const join = require('path').join;
const routes = require('../routes/routes');

const controllers = requireAll(join(__dirname, '../controllers'));

module.exports.router = createRouter(routes);

function createRouter(draw) {
  const router = Router();
  draw.call(router, controllers);
  return router;
}
