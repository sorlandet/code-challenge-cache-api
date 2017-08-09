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

try {
  server.listen(port, function () {
    console.info({ port: port }, 'Server started');
  });
} catch (err) {
  console.error(err, 'Cannot start server.');
  process.exit(1);
}
