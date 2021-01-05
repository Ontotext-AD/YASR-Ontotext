'use strict';
module.exports = {
    selectSaveAsDropDown: '<div class="saveAsDropDown btn-group pull-right">' + 
                                '<button class="btn btn-primary btn-sm dropdown-toggle" data-toggle="dropdown" type="button">' + 
                                    'Download as &nbsp;' + 
                                '</button>' + 
                                '<ul class="dropdown-menu" role="menu">' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/sparql-results+json" href="#">JSON</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-sparqlstar-results+json" href="#">JSON*</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/sparql-results+xml" href="#">XML</a>' +
                                    '</li>' +
                                    '<li>' +
                                        '<a class="format dropdown-item" data-accepts="application/x-sparqlstar-results+xml" href="#">XML*</a>' +
                                    '</li>' +
                                    '<li>' +
                                        '<a class="format dropdown-item" data-accepts="text/csv" href="#">CSV</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item " data-accepts="text/tab-separated-values" href="#">TSV</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item " data-accepts="text/x-tab-separated-values-star" href="#">TSV*</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-binary-rdf-results-table" href="#">Binary RDF Results</a>' +
                                    '</li>' + 
                                '</ul>' + 
                            '</div>',
    graphSaveAsDropDown: '<div class="saveAsDropDown btn-group pull-right">' + 
                                '<button class="btn btn-primary btn-sm dropdown-toggle" data-toggle="dropdown" type="button">' + 
                                    'Download as &nbsp;' + 
                                '</button>' + 
                                '<ul class="dropdown-menu" role="menu">' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/rdf+json" href="#">JSON</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/ld+json" href="#">JSON-LD</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/rdf+xml" href="#">RDF-XML</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="text/rdf+n3" href="#">N3</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="text/plain" href="#">N-Triples</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="text/x-nquads" href="#">N-Quads</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="text/turtle" href="#">Turtle</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-turtlestar" href="#">Turtle*</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/trix" href="#">TriX</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-trig" href="#">TriG</a>' +
                                    '</li>' +   
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-trigstar" href="#">TriG*</a>' +
                                    '</li>' +  
                                    '<li>' + 
                                        '<a class="format dropdown-item" data-accepts="application/x-binary-rdf" href="#">Binary RDF</a>' +
                                    '</li>' +                                   
                                '</ul>' + 
                            '</div>',
};
