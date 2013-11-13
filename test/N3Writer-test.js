var N3Writer = require('../N3').Writer;
var vows = require('vows'),
    chai = require('chai'),
    expect = chai.expect,
    util = require('util');
chai.should();
chai.use(require('chai-things'));

vows.describe('N3Parser').addBatch({
  'The N3Writer module': {
    topic: function () { return N3Writer; },

    'should be a function': function (N3Writer) {
      N3Writer.should.be.a('function');
    },

    'should make N3Writer objects': function (N3Writer) {
      N3Writer().should.be.an.instanceof(N3Writer);
    },

    'should be an N3Writer constructor': function (N3Writer) {
      new N3Writer().should.be.an.instanceof(N3Writer);
    },
  },

  'An N3Writer instance': {
    topic: function () { return function (outputStream) { return new N3Writer(outputStream); }; },

    'should serialize 0 triples':
      shouldSerialize([], ''),

    'should serialize 1 triple':
      shouldSerialize([['abc', 'def', 'ghi']],
                      '<abc> <def> <ghi>.\n'),

    'should serialize 2 triples':
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['jkl', 'mno', 'pqr']],
                      '<abc> <def> <ghi>.\n' +
                      '<jkl> <mno> <pqr>.\n'),

    'should serialize 3 triples':
      shouldSerialize([['abc', 'def', 'ghi'],
                       ['jkl', 'mno', 'pqr'],
                       ['stu', 'vwx', 'yz']],
                      '<abc> <def> <ghi>.\n' +
                      '<jkl> <mno> <pqr>.\n' +
                      '<stu> <vwx> <yz>.\n'),

    'should serialize a literal':
      shouldSerialize([['a', 'b', '"cde"']],
                      '<a> <b> "cde".\n'),

    'should serialize a literal with a type':
      shouldSerialize([['a', 'b', '"cde"^^<fgh>']],
                      '<a> <b> "cde"^^<fgh>.\n'),

    'should serialize a literal with a language':
      shouldSerialize([['a', 'b', '"cde"@en-us']],
                      '<a> <b> "cde"@en-us.\n'),

    'should not serialize a literal in the subject':
      shouldNotSerialize([['"a"', 'b', '"c']],
                          'A literal as subject is not allowed: "a"'),

    'should not serialize a literal in the predicate':
      shouldNotSerialize([['a', '"b"', '"c']],
                          'A literal as predicate is not allowed: "b"'),
  },
}).export(module);

function shouldSerialize(tripleArrays, expectedResult) {
  return {
    topic: function (n3writerFactory) {
      var outputStream = new QuickStream(),
          writer = n3writerFactory(outputStream);
      tripleArrays.forEach(function (t) {
        writer.addTriple({ subject: t[0], predicate: t[1], object: t[2] });
      });
      writer.end();
      return outputStream.result;
    },
    'should equal the expected result': function (actual) {
      actual.should.equal(expectedResult);
    },
  };
}

function shouldNotSerialize(tripleArrays, expectedMessage) {
  return {
    topic: function (n3writerFactory) {
      var outputStream = new QuickStream(),
          writer = n3writerFactory(outputStream);
      try {
        tripleArrays.forEach(function (t) {
          writer.addTriple({ subject: t[0], predicate: t[1], object: t[2] });
        });
        writer.end();
      }
      catch (error) {
        return error;
      }
    },
    'should produce the right error message': function (error) {
      error.message.should.equal(expectedMessage);
    },
  };
}

function QuickStream() {
  var stream = {}, buffer = '';
  stream.write = function (chunk) { buffer += chunk; };
  stream.end = function () { stream.result = buffer; buffer = null; };
  return stream;
}
