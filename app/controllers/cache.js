'use strict';

const _ = require('lodash');
const config = require('config');
const debug = require('debug')('cache-ctrl');
const winston = require('winston');

const Cache = require('../components/cache').Cache;

const log = new(winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'pixel',
      filename: __dirname + '/logs/cache.log',
      level: 'verbose',
      timestamp: true,
      humanReadableUnhandledException: true
    })
  ]
});


const cache = new Cache();

cache.initialization();


const list = function (req, res, next) {
  cache.list(function (err, keys) {
    res.json(keys);
  })
};


module.exports = {
  list: list
};