## IIIF Manifest Service

Specification Draft:
* This service returns a specification conformant JSON IIIF Manifest from a web application query request.
* The service response will return either:
 *  a static Manifest resource from a known URI e.g.
   * `<http://m.blumenbach.org/static/manifest_601.json>`   
**OR**
 * a query generated object based on an a Fedora RDF resource identifier e.g.
    * `<http://f.blumenbach.org/fcrepo/rest/<edition>/{id}/manifest>`   
    
### Manifest SPARQL CONSTRUCT query    
* The query request is a parameterized API call 
 * (e.g. `http://blumenbach.org/<datasource>?subject=<subject>&template=manifest `)
* The service routes the template parameter to a datasource with a matching [query template](https://github.com/blumenbach/iiif-builder/blob/master/iiif/templates/sparqlconstructtemplate_multi.sparql).
 * template options: [manifest, canvas, range, layer]
* Only one `<resource>` is allowed for the SPARQL CONSTRUCT query.
* The service then with an XHR calls the SPARQL endpoint with an Accept: JSON-LD header and POSTs the query.

### JSON-LD Response Transformation
* The endpoint JSON-LD response is transformed by the service in a multi-step process:

1. [compacted](https://www.w3.org/TR/json-ld-api/#compaction-algorithms)  
 _[compacted example]:_ [gist](http://json-ld.org/playground/#/gist/c28bedb8863054dd357d89ce7c8b7b57)
2. [framed](http://json-ld.org/spec/latest/json-ld-framing/)  
 _[framed example]:_ [gist](http://json-ld.org/playground/#/gist/42f8b6e3b9756670a69f2966aa68f66e)
3. "de-normalized"

The de-normalization involves parsing the object, removing blank node @id references, replacing prefixed elements with aliases, removing rdf:first and rdf:rest elements, and serializing and validating the output as JSON.

* The serialized JSON output response should conform exactly to the IIIF standard that dictates the expectations of the client viewer. [typical manifest example](https://github.com/blumenbach/iiif-manifest-service/blob/master/example/iiif-manifest-typ.json)

### Problem
* The complexity of the "de-normalization" of JSON-LD lists.
* For large manifests, SPARQL CONSTRUCT is a very expensive query operation.

### Solution
* Use the [Linked Data Fragments Client](https://github.com/LinkedDataFragments/Client.js) SPARQL iterator to traverse "typed" RDF sequences and assemble them as javascript arrays:
 * example chaining  
 ` ?subject -> ?object -> ?subject`  and pushing the ?objects.
* the array is then framed into JSON according to the "type" of the sequence.  
  * list types include: sequences (ranges), canvases, images, lists 
   
### All Objects in IIIF Manifest   
  <img src="https://github.com/blumenbach/iiif-manifest-service/blob/master/spec/objects-all.png"alt="" />
  
 