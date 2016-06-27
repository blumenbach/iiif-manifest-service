#!/usr/bin/env node
var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    sinon = require('sinon'),
    SparqlDatasource = require('../lib/datasources/SparqlDatasource');

var args = process.argv.slice(2);
var configDefaults = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config-defaults.json'))),
    config = _.defaults(JSON.parse(fs.readFileSync(args[0])), configDefaults),
    constructors = {};


// Instantiates an object from the given description
function instantiate(description, includePath) {
    var type = description.type || description,
        typePath = path.join(includePath ? path.resolve(__dirname, includePath) : '', type),
        Constructor = constructors[typePath] || (constructors[typePath] = require(typePath)),
        extensions = config.extensions && config.extensions[type] || [],
        settings = _.defaults(description.settings || {}, {
            extensions: extensions.map(function (x) { return instantiate(x, includePath); })
        }, config);
    return new Constructor(settings, config);
}

var baseURL = config.baseURL = config.baseURL.replace(/\/?$/, '/'),
    baseURLRoot = baseURL.match(/^(?:https?:\/\/[^\/]+)?/)[0],
    baseURLPath = baseURL.substr(baseURLRoot.length),
    blankNodePath = baseURLRoot ? '/.well-known/genid/' : '',
    blankNodePrefix = blankNodePath ? baseURLRoot + blankNodePath : 'genid:';

// Create all data sources
var datasources = config.datasources, datasourceBase = baseURLPath.substr(1), dereference = config.dereference;
console.log(datasources);
Object.keys(datasources).forEach(function (datasourceName) {
    var datasourceConfig = config.datasources[datasourceName];
    delete datasources[datasourceName];
    if (datasourceConfig.enabled !== false) {
        try {
            // Avoid illegal URI characters in data source path
            var datasourcePath = datasourceBase + encodeURI(datasourceName);
            datasources[datasourcePath] = datasourceConfig;
            // Set up blank-node-to-IRI translation, with dereferenceable URLs when possible
            datasourceConfig.settings = _.defaults(datasourceConfig.settings || {}, config);
            if (!datasourceConfig.settings.blankNodePrefix) {
                datasourceConfig.settings.blankNodePrefix = blankNodePrefix + datasourcePath + '/';
                if (blankNodePath)
                    dereference[blankNodePath + datasourcePath + '/'] = datasourcePath;
            }
            // Create the data source
            var datasource = instantiate(datasourceConfig, '../lib/datasources/');
            datasource.on('error', datasourceError);
            datasourceConfig.datasource = datasource;
            datasourceConfig.url = baseURLRoot + '/' + datasourcePath + '#dataset';
            datasourceConfig.title = datasourceConfig.title || datasourceName;
        }
        catch (error) { datasourceError(error); }
        function datasourceError(error) {
            delete datasources[datasourcePath];
            process.stderr.write('WARNING: skipped datasource ' + datasourceName + '. ' + error.message + '\n');
        }
    }
});

