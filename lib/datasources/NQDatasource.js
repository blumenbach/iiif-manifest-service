/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */

/** An NQDatasource fetches data from a  NQ document. */

var MemoryDatasource = require('./MemoryDatasource'),
    jsonld = require('../jsonld');

var ACCEPT = 'text/turtle;q=1.0,application/n-triples;q=0.7,text/n3;q=0.6';

// Creates a new NQDatasource
function NQDatasource(options) {
    if (!(this instanceof NQDatasource))
        return new NQDatasource(options);
    MemoryDatasource.call(this, options);
    this._url = options && (options.url || options.file);
    this._frame = options && (options.frame);
}
MemoryDatasource.extend(NQDatasource);

// Retrieves all triples from the document
NQDatasource.prototype._getAllTriples = function (addTriple, done) {
    var frame = this._frame;
    var quads = '', document = this._fetch({ url: this._url, headers: { accept: ACCEPT }}, done);
    document.on('data', function (data) { quads += data; });
    document.on('end', function () {
        jsonld.fromRDF(quads, function (error, json) {
           jsonld.frame(json, frame, function(error, framed) {
                console.log(JSON.stringify(framed, null, 2));
           } );
        });
    });
};

module.exports = NQDatasource;