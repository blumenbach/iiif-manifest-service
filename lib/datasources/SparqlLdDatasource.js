/** An SparqlLdDatasource fetches data from a JSON-LD document served from a SPARQL interface. */

var MemoryDatasource = require('./MemoryDatasource'),
    jsonld = require('../jsonld'),
    fs = require('fs');

var ACCEPT = 'application/n-triples;q=0.7,text/n3;q=0.6';

// Creates a new SparqlLdDatasource
function SparqlLdDatasource(options) {
    if (!(this instanceof SparqlLdDatasource))
        return new SparqlLdDatasource(options);
    MemoryDatasource.call(this, options);
    this._url = options && (options.url || options.file);
    this._url += '?query=';
    this._querytemplate = options && (options.querytemplate);
    this._query= fs.readFileSync(this._querytemplate);
    this._context = options && (options.context);
    this._frame = options && (options.frame);
}
MemoryDatasource.extend(SparqlLdDatasource);

SparqlLdDatasource.prototype._getAllTriples = function (addTriple, done) {
    // Read the JSON-LD document
    var constructQuery = encodeURIComponent(this._query);
    var context = this._context;
    var frame = this._frame;
    var quads = '', document = this._fetch({ url: this._url + constructQuery, headers: { accept: ACCEPT }}, done);
    document.on('data', function (data) { quads += data; });
    document.on('end', function () {
        jsonld.fromRDF(quads, function (error, json) {
            jsonld.frame(json, frame, function(error, framed) {
                console.log(JSON.stringify(framed, null, 2));
            } );
        });
    });
};

// Converts a jsonld.js entity to an N3.js IRI or literal
function convertEntity(entity) {
    // Return IRIs as-is
    if (entity.type === 'IRI')
        return entity.value;
    // Add a language tag to the literal if present
    if ('language' in entity)
        return '"' + entity.value + '"@' + entity.language;
    // Add a datatype to the literal if present
    if (entity.datatype !== 'http://www.w3.org/2001/XMLSchema#string')
        return '"' + entity.value + '"^^<' + entity.datatype + '>';
    // Otherwise, return the regular literal
    return '"' + entity.value + '"';
}

module.exports = SparqlLdDatasource;
