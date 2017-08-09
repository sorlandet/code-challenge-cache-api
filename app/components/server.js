'use strict';

const express = require('express');
const router = require('./routes').router;
const nocache = require('../middleware/nocache');
const errorHandler = require('../middleware/error-handler');

const app = express();

app.use(function (req, res, next) {
  next();
});

app.use(nocache());
app.use('/', router);
app.use(errorHandler().handler);

module.exports = app;
