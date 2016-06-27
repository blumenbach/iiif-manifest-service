/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */

/** An JsonLdDatasource fetches data from a JSON-LD document. */

var MemoryDatasource = require('./MemoryDatasource'),
    jsonld = require('jsonld'),
    fs = require('fs');

var ACCEPT = 'application/ld+json;q=1.0,application/json;q=0.7';

// Creates a new JsonLdDatasource
function SparqlJsonLdDatasource(options) {
    if (!(this instanceof SparqlJsonLdDatasource))
        return new SparqlJsonLdDatasource(options);
    MemoryDatasource.call(this, options);
    this._url = options && (options.url || options.file);
    this._url += '?query=';
    this._querytemplate = options && (options.querytemplate);
    this._query= fs.readFileSync(this._querytemplate);
}
MemoryDatasource.extend(SparqlJsonLdDatasource);

// Retrieves all triples from the document
SparqlJsonLdDatasource.prototype._getAllTriples = function (addTriple, done) {
    var constructQuery = encodeURIComponent(this._query);
    request = { url: this._url + constructQuery,
        headers: { accept: 'application/ld+json;q=1.0,application/json;q=0.7' }
    };
    var json = '', document = this._fetch(request, done);
    document.on('data', function (data) { json += data; });
    document.on('end', function () {
        // Parse the JSON document
        try { json = JSON.parse(json); }
        catch (error) { return done(error); }
        // Convert the JSON to triples
        jsonld.toRDF(json, function (error, triples) {
            for (var graphName in triples)
                triples[graphName].forEach(function (triple) {
                    addTriple(triple.subject.value, triple.predicate.value, convertEntity(triple.object));
                });
            done(error);
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

// Creates a CONSTRUCT query from the given SPARQL pattern
SparqlJsonLdDatasource.prototype._createConstructQuery =  function (query) {
    return query;
};

module.exports = SparqlJsonLdDatasource;

