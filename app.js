'use strict';

const config = require('config');
const debug = require('debug')('app');

const server = require('./app/components/server');

const winston = require('winston');

global.log = new(winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'cache',
      filename: 'logs/cache.log',
      level: 'verbose',
      timestamp: true,
      humanReadableUnhandledException: true
    })
  ]
});

const port = config.get('port');

server.listen(port, () => console.info({ port: port }, 'Server started'));
