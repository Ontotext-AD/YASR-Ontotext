'use strict';
module.exports = {
	saveAsDropDown: '<div class="saveAsDropDown btn-group">' + 
                                '<button class="btn btn-success btn-sm dropdown-toggle" data-toggle="dropdown" type="button">' + 
                                    'Save all as &nbsp;<span class="caret"></span>' + 
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
                                '</ul>' + 
                            '</div>'
};
