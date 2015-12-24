'use strict';

/* jshint expr: true */

/**
 * Module dependencies.
 */

require('should');

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
        utils.FolderPath().path().should.eql({
          encode: false,
          value: '',
        });
        utils.FolderPath('a').path().should.eql({
          encode: false,
          value: '/job/a',
        });
        utils.FolderPath('a/b').path().should.eql({
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
});
