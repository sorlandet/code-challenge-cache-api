'use strict';

const config = require('config');
const debug = require('debug')('app');

const server = require('./app/components/server');

const port = config.get('port');

try {
  server.listen(port, function () {
    console.info({ port: port }, 'Server started');
  });
} catch (err) {
  console.error(err, 'Cannot start server.');
  process.exit(1);
}
