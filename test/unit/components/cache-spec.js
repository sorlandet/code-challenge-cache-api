'use strict';

const _ = require('lodash');
const config = require('config');
const async = require('async');

const Cache = require('../../../app/components/cache').Cache;

describe('Cache spec', function () {

  let cache = new Cache();


  let dropDatabase = callback => {
    let db = cache.getDB();

    db.open((err, db) => {
      db.dropDatabase({}, (err, result) => {
        db.close();
        if (err) callback(err);
        else callback();
      });
    })
  };

  before(function(done) {
    dropDatabase(done)
  });

  after(function(done) {
    dropDatabase(done)
  });

  describe('#initCollection()', function () {

    after(function(done) {
      dropDatabase(done)
    });

    it('should create capped collection', function (done) {
      let db = cache.getDB();
      db.open((err, db) => {
        cache.initCollection(cache.name, cache.getCappedCollectionSize(), cache.maxSize, db, (err, results) => {
          expect(err).to.be.null;
          expect(results).to.deep.equal(cache.name);
          db.close();
          if (err) done(err);
          else done();
        })
      });
    });

    it('check that created collection is capped', function (done) {
      let db = cache.getDB();
      db.open((err, db) => {
        db.collections((err, collections) => {
          expect(err).to.be.null;
          let isCappedTasks = [];
          collections.forEach(collection => {
            isCappedTasks.push(callback => {
              collection.isCapped((err, capped) => {
                if (err) { callback(err) }
                callback(null, { name: collection.s.name, isCapped: capped });
              });
            });
          });

          async.series(isCappedTasks, (err, results) => {
            expect(err).to.be.null;
            results = _.filter(results, res => !_.contains(['system.indexes'], res.name));
            results.forEach(result => expect(result.isCapped).to.be.true);
            db.close();
            if (err) done(err);
            else done();
          });

        })
      });

    });

    it('check that created collection have key index', function (done) {
      let db = cache.getDB();
      db.open((err, db) => {
        db.collections((err, collections) => {
          expect(err).to.be.null;
          let indexExistsTasks = [];
          collections.forEach(collection => {
            indexExistsTasks.push(callback => {
              collection.indexExists('key_1', (err, result) => {
                if (err) { callback(err) }
                callback(null, { name: collection.s.name, indexExists: result });
              });
            });
          });
          async.series(indexExistsTasks, (err, results) => {
            expect(err).to.be.null;
            results = _.filter(results, res => !_.contains(['system.indexes'], res.name));
            results.forEach(result => expect(result.indexExists).to.be.true);
            db.close();
            if (err) done(err);
            else done();
          });
        })
      });
    });

    it('check that created collections key index is unique', function (done) {
      let db = cache.getDB();
      let databaseName = cache.config.db.name;
      db.open((err, db) => {
        db.collection(cache.name, (err, collection) => {
          collection.insert([{'key': '1'}, {'key': '1'}], { fsync: true }, (err, result) => {
            let error = `E11000 duplicate key error index: ${databaseName}.${cache.name}.$key_1  dup key: { : "1" }`;
            expect(err).to.not.be.null;
            expect(err.message).to.be.equal(error);
            collection.remove((err, result) => {
              let error = `cannot remove from a capped collection: ${databaseName}.${cache.name}`;
              expect(err).to.not.be.null;
              expect(err.message).to.be.equal(error);
              done()
            });
          })
        })
      });
    });

  });

});