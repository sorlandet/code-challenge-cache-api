'use strict';

const _ = require('lodash');
const config = require('config');
const debug = require('debug')('cache');
const Server = require('mongodb').Server;
const Db = require('mongodb').Db;


class Cache {
  constructor(options) {
    options || (options = {});

    this.name = 'cache';
    this.config = config.get('caching');

    this.maxSize = this.config.options.maxSize;


  }

  getDB () {
    const options = this.config.db;
    const serverHost = options.host;
    const serverPort = options.port;
    const serverOptions = {
      connectTimeoutMS: options.connectTimeoutMS,
      socketTimeoutMS: options.socketTimeoutMS
    };
    const databaseName = options.name;

    let topology = new Server(serverHost, serverPort, serverOptions);
    return new Db(databaseName, topology, { safe: false });
  }

  initialization () {
    let that = this;

    let db = this.getDB();

    db.open((err, db) => {
      if (err) {
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        that.initCollection(that.name, that.getCappedCollectionSize(), that.maxSize, db, function (err, res) {
          if (err) { log.error(err) }

          //Close connection
          db.close();
        })
      }
    });
  }

  /**
   * Get Capped Collection size
   * @return {number}
   */
  getCappedCollectionSize () {
    return this.maxSize * 256; // dummy object size in Bytes (which we store)
  }

  /**
   * Init collection
   * @param {number} size - the size of the capped collection in bytes.
   * @param {number} max - the maximum number of documents in the capped collection.
   * @param {object} db -
   * @param {function} callback -
   */
  initCollection(name, size, max, db, callback) {

    db.collections(function (err, results) {

      if (err) {
        callback(err)
      }

      let collections = _(results)
        .pluck('s')
        .pluck('name')
        .value();

      debug('current collections', collections);

      let options = { capped: false, size: size, max: max };

      if (!_.contains(collections, name)) {

        db.createCollection(name, options, function (err, result) {

          if (err) {
            callback(err)
          }

          db.collection(name).ensureIndex('key', { unique: true }, function (err, key) {

            if (err) {
              callback(err)
            }

            callback(null, result.s.name);
          });

        })

      }
    })
  }

  /**
   * Returns all stored keys in the cache
   * @param callback
   */
  list(callback) {
    /**
     * Find keys
     *
     * @param {object} collection - MongoDB Collection instance
     * @param {object} options -
     * @param {function} callback -
     */
    const findKeys = function (collection, options, callback) {
      // on a capped collection with no ordering specified,
      // MongoDB guarantees that the ordering of results is the same as the insertion order.

      let query = {};
      let fields = { key: 1 };

      collection.find(query, fields, options, callback);

    };

    // todo: need to add pagination later...
    let size = this.maxSize;
    let db = this.getDB();
    let that = this;

    db.open(function (err, db) {

      if (err) {
        debug(err);
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        findKeys(db.collection(that.name), { limit: size, sort: { $natural: 1 } }, function (err, cursor) {

          if (err) {
            callback(err)
          }

          cursor.toArray(function (err, docs) {
            callback(null, _(docs).pluck('key').value())
          });

        });
      }
    })
  }

  /**
   * Creates/updates the data for a given key
   * @param doc {object} - document containg given key and data
   * @param callback
   */
  set(doc, callback) {

    /**
     * Update cache document
     *
     * @param {object} collection - MongoDB Collection instance
     * @param {object} doc - the replacement object (document)
     * @param {function} callback - function with (err, result) arguments
     */
    const updateCache = function(collection, doc, callback) {

      let selector = { key: doc.key };
      let options = { upsert: true, w: 1 };

      doc['lastModified'] = new Date(); // to reflect last modification date

      collection.updateOne(selector, doc, options, callback)
    };


    let db = this.getDB();
    let that = this;

    db.open(function (err, db) {

      if (err) {
        debug(err);
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        updateCache(db.collection(that.name), doc, callback);
      }
    });
  }

  /**
   * Removes a given key from the cache
   * @param key
   * @param callback
   */
  deleteKey (key, callback) {

    let db = this.getDB();
    let that = this;

    db.open(function (err, db) {

      if (err) {
        debug(err);
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        let filter = { 'key': key };
        let options = null;
        db.collection(that.name)
          .deleteOne(filter, options, callback)
      }
    });

  }

  /**
   * Removes all keys from the cache
   */
  deleteAll () {

    let db = this.getDB();
    let that = this;

    db.open(function (err, db) {

      if (err) {
        debug(err);
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        return db.collection(that.name).deleteMany({})
      }
    });

  }

  /**
   * Returns the cached data for a given key
   * @param key
   * @param callback
   */
  getKey (key, callback) {

    /**
     * Generate random string
     * @param length
     * @return {string}
     */
    function randomString(length) {
      return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
    }

    let db = this.getDB();
    let that = this;

    db.open(function (err, db) {

      if (err) {
        debug(err);
        log.error(`Open the database: ${that.config.db.name} cause an error: ${err}`);
      } else {
        let filter = { 'key': key };
        let options = { fields: { lastModified: 0 } };
        db.collection(that.name)
          .findOne(filter, options, function (err, doc) {
            if (_.isNull(doc)) {
              log.info(`Cache miss for key ${key}`);
              const newDoc = {
                key: key,
                value: randomString(32)
              };

              that.set(newDoc, function (err, response) {
                if (err) {
                  callback(err)
                }

                if (response.result.ok === 1 && response.result.upserted) {

                  callback(null, newDoc.value)
                } else {
                  callback(response)
                }
              })
            } else {
              log.info(`Cache hit for key ${key}`);
              callback(null, doc.value)
            }
          })
      }
    });
  }
}

module.exports = {
  Cache: Cache
};