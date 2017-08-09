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

/**
 * Controller for an endpoint that returns all stored keys in the cache
 * @param req
 * @param res
 */
const list = function (req, res) {
  cache.list(function (err, keys) {
    res.json(keys);
  })
};

/**
 * Controller for an endpoint that creates/updates the data for a given key
 * @param req
 * @param res
 */
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

/**
 * Controller for an endpoint that removes a given key from the cache
 * @param req
 * @param res
 */
const deleteKey = function (req, res) {
  const key = req.params.key;

  cache.deleteKey(key, function (err, response) {
    const result = response.result;
    debug(result);
    if (result.ok === 1 && result.n === 1) {
      res.status(204).json();
    } else {
      res.status(404).json(`key ${key} not exist`);
    }
  })

};

/**
 * Controller for an endpoint that removes all keys from the cache
 * @param req
 * @param res
 */
const deleteAll = function (req, res) {
  cache.deleteAll();
  res.status(204).json();
};

module.exports = {
  list: list,
  set: set,
  deleteKey: deleteKey,
  deleteAll: deleteAll
};