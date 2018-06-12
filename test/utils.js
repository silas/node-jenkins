'use strict';

/* jshint expr: true */

/**
 * Module dependencies.
 */

var fs = require('fs');
var should = require('should');

var utils = require('../lib/utils');

/**
 * Tests.
 */

describe('utils', function() {
  describe('FolderPath', function() {
    describe('constructor', function() {
      it('should parse string', function() {
        utils.FolderPath().value.should.eql([]);
        utils.FolderPath('').value.should.eql([]);
        utils.FolderPath('/').value.should.eql([]);
        utils.FolderPath('a/').value.should.eql(['a']);
        utils.FolderPath('/a').value.should.eql(['a']);
        utils.FolderPath('a/b').value.should.eql(['a', 'b']);
        utils.FolderPath('a//b').value.should.eql(['a', 'b']);
        utils.FolderPath('a/b/c').value.should.eql(['a', 'b', 'c']);
      });

      it('should parse url', function() {
        ['http://', 'https://'].forEach(function(p) {
          utils.FolderPath(p).value.should.eql([]);
          utils.FolderPath(p + 'example.org/').value.should.eql([]);
          utils.FolderPath(p + 'example.org/job/one').value.should.eql(['one']);
          utils.FolderPath(p + 'example.org/proxy/job/one').value.should.eql(['one']);
          utils.FolderPath(p + 'example.org/job/one/hello/world').value.should.eql(['one']);
          utils.FolderPath(p + 'example.org/job/one/hello/job/nope').value.should.eql(['one']);
          utils.FolderPath(p + 'example.org/job/one/job/two').value.should.eql(['one', 'two']);
          utils.FolderPath(p + 'example.org/job/one%2Ftwo').value.should.eql(['one/two']);
          utils.FolderPath(p + 'example.org/job/one/job/two%252Fthree/').value
            .should.eql(['one', 'two%2Fthree']);
        });
      });

      it('should parse array', function() {
        utils.FolderPath(['a']).value.should.eql(['a']);
        utils.FolderPath(['a', 'b']).value.should.eql(['a', 'b']);
      });
    });

    describe('name', function() {
      it('should work', function() {
        utils.FolderPath().name().should.equal('');
        utils.FolderPath('a').name().should.equal('a');
        utils.FolderPath('a/b').name().should.equal('b');
      });
    });

    describe('path', function() {
      it('should work', function() {
        utils.FolderPath().path().should.containEql({
          encode: false,
          value: '',
        });
        utils.FolderPath('a').path().should.containEql({
          encode: false,
          value: '/job/a',
        });
        utils.FolderPath('a/b').path().should.containEql({
          encode: false,
          value: '/job/a/job/b',
        });
      });
    });

    describe('parent', function() {
      it('should work', function() {
        utils.FolderPath().parent().value.should.eql([]);
        utils.FolderPath('a').parent().value.should.eql([]);
        utils.FolderPath('a/b').parent().value.should.eql(['a']);
        utils.FolderPath('a/b/c').parent().value.should.eql(['a', 'b']);
      });
    });
  });

  describe('isFileLike', function() {
    it('should work', function() {
      should(utils.isFileLike()).is.false;
      should(utils.isFileLike('test')).is.false;
      should(utils.isFileLike({})).is.false;

      should(utils.isFileLike(Buffer.from('test'))).is.true;

      var stream = fs.createReadStream(__filename);
      should(utils.isFileLike(stream)).is.true;
      stream.close();
    });
  });
});
