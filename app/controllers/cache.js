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


const list = function (req, res) {
  cache.list(function (err, keys) {
    res.json(keys);
  })
};


const set = function (req, res) {
  const doc = {
    key: req.params.key,
    value: req.body
  };

  cache.set(doc, function (err, response) {
    const result = response.result;
    debug(result);
    if (result.ok === 1 && result.upserted) {
      res.status(201).json(doc.key);
    } else {
      res.json(doc.key);
    }

  })
};


module.exports = {
  list: list,
  set: set
};