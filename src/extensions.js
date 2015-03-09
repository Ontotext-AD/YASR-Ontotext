'use strict';
module.exports = {
	selectSaveAsDropDown: '<div class="saveAsDropDown btn-group">' + 
                                '<button class="btn btn-success btn-sm dropdown-toggle" data-toggle="dropdown" type="button">' + 
                                    'Download as &nbsp;<span class="caret"></span>' + 
                                '</button>' + 
                                '<ul class="dropdown-menu" role="menu">' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/sparql-results+json" href="javascript:;">JSON</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/sparql-results+xml" href="javascript:;">XML</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/csv" href="javascript:;">CSV</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/tab-separated-values" href="javascript:;">TSV</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/x-binary-rdf-results-table" href="javascript:;">Binary RDF Results</a>' +
                                    '</li>' + 
                                '</ul>' + 
                            '</div>',
    graphSaveAsDropDown: '<div class="saveAsDropDown btn-group">' + 
                                '<button class="btn btn-success btn-sm dropdown-toggle" data-toggle="dropdown" type="button">' + 
                                    'Download as &nbsp;<span class="caret"></span>' + 
                                '</button>' + 
                                '<ul class="dropdown-menu" role="menu">' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/rdf+json" href="javascript:;">JSON</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/ld+json" href="javascript:;">JSON-LD</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/rdf+xml" href="javascript:;">RDF-XML</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/rdf+n3" href="javascript:;">N3</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/plain" href="javascript:;">N-Triples</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/x-nquads" href="javascript:;">N-Quads</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="text/turtle" href="javascript:;">Turtle</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/trix" href="javascript:;">TriX</a>' +
                                    '</li>' + 
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/x-trig" href="javascript:;">TriG</a>' +
                                    '</li>' +   
                                    '<li>' + 
                                        '<a class="format" data-accepts="application/x-binary-rdf" href="javascript:;">Binary RDF</a>' +
                                    '</li>' +                                   
                                '</ul>' + 
                            '</div>',
};
