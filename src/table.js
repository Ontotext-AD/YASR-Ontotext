'use strict';
var $ = require("jquery"),
	yutils = require("yasgui-utils"),
	utils = require('./utils.js'),
	imgs = require('./imgs.js'),
	_ = require('lodash');
require("../lib/DataTables/media/js/jquery.dataTables.js");
require("../lib/colResizable-1.4.js");



/**
 * Constructor of plugin which displays results as a table
 *
 * @param yasr {object}
 * @param parent {DOM element}
 * @param options {object}
 * @class YASR.plugins.table
 * @return yasr-table (doc)
 *
 */
var root = module.exports = function(yasr) {
    // load and register the translation service providing the locale config
    yasr.translate = require('./translate.js').translate;

	var table = null;
	var plugin = {
		id: 'table',
		name: "Table",
		nameLabel: 'yasr.table',
		getPriority: 10,
	};

	const customOptions = yasr.options.pluginsOptions ? yasr.options.pluginsOptions[plugin.id] : {};
	var options = plugin.options = $.extend(true, {}, root.defaults, customOptions);
	var tableLengthPersistencyId = (options.persistency? yasr.getPersistencyId(options.persistency.tableLength): null);

	var getRows = function() {
		var rows = [];
		var bindings = yasr.results.getBindings();
		var vars = yasr.results.getVariables();
		var usedPrefixes = null;
		if (yasr.options.getUsedPrefixes) {
			usedPrefixes = (typeof yasr.options.getUsedPrefixes == "function"? yasr.options.getUsedPrefixes(yasr):  yasr.options.getUsedPrefixes);
		}
		usedPrefixes = _.invert(usedPrefixes);
		for (var rowId = 0; rowId < bindings.length; rowId++) {
			var row = [];
			row.push("");//row numbers
			var binding = bindings[rowId];
			for (var colId = 0; colId < vars.length; colId++) {
				var sparqlVar = vars[colId];
				if (sparqlVar in binding) {
					if (options.getCellContent) {
						row.push(options.getCellContent(yasr, plugin, binding, sparqlVar, {'rowId': rowId, 'colId': colId, 'usedPrefixes': usedPrefixes}));
					} else {
						row.push("");
					}
				} else {
					row.push("");
				}
			}
			rows.push(row);
		}
		return rows;
	};

	var eventId = yasr.getPersistencyId('eventId') || "yasr_" + $(yasr.container).closest('[id]').attr('id');
	var addAdditionalEvents = function() {
		var yasrAngular = angular.element($('#yasr')[0]).scope();
        $('td div .fa-link').on('click', function(){
			var resultURI = this.dataset.clipboardText;
			yasrAngular.copyToClipboardResult(resultURI);
		})

		/*To use copy to clipboard you need:
		 1. To have div with id="yasr" inside of controller scope
		 2. To add this function in CTRL where the yasr is used
		*
		* $scope.copyToClipboardResult = function(resultURI){
			 var modalInstance = $modal.open({
				 templateUrl: 'js/angular/templates/copyToClipboard.html', //Situated in core module
				 controller: 'CopyToClipboardModalCtrl',
				 size: 'sm',
				 resolve: {
					 URI: function () {
					 	return resultURI;
					 }
				 }
			 });

		 	modalInstance.opened.then(function(){
				 $timeout(function(){
				 	$('#clipboardURI')[0].select();
				 }, 500)
			 })
		 }
		* */

	}
	var addEvents = function() {
		table.on( 'order.dt', function () {
		    drawSvgIcons();
		});
		if (tableLengthPersistencyId) {
			table.on('length.dt', function(e, settings, len) {
				yutils.storage.set(tableLengthPersistencyId, len, "month");
			});
		}
		$.extend(true, options.callbacks, options.handlers);
		table.delegate("td", "click", function(event) {
			if (options.callbacks && options.callbacks.onCellClick) {
				var result = options.callbacks.onCellClick(this, event);
				if (result === false) return false;
			}
		}).delegate("td",'mouseenter', function(event) {
			if (options.callbacks && options.callbacks.onCellMouseEnter) {
				options.callbacks.onCellMouseEnter(this, event);
			}
			var tdEl = $(this);
			if (options.fetchTitlesFromPreflabel
					&& tdEl.attr("title") === undefined
					&& tdEl.text().trim().indexOf("http") == 0) {
				addPrefLabel(tdEl);
			}
		}).delegate("td",'mouseleave', function(event) {
			if (options.callbacks && options.callbacks.onCellMouseLeave) {
				options.callbacks.onCellMouseLeave(this, event);

			}
		});


		// $(window).off('resize.' + eventId);//remove previously attached handlers
		// $(window).on('resize.' + eventId, hideOrShowDatatablesControls);
		// hideOrShowDatatablesControls();
		addAdditionalEvents();
	};

	plugin.draw = function() {
		table = $('<table cellpadding="0" cellspacing="0" border="0" class="resultsTable table stripe hover table-bordered fixedCellWidth"></table>');
		$(yasr.resultsContainer).html(table);

		var dataTableConfig = options.datatable;
		dataTableConfig.data = getRows();
		dataTableConfig.columns = options.getColumns(yasr, plugin);

		//fetch stored datatables length value
		var pLength = yutils.storage.get(tableLengthPersistencyId);
		if (pLength) dataTableConfig.pageLength = pLength;

		dataTableConfig.translate = require('./translate.js').translate;

		table.DataTable($.extend(true, {}, dataTableConfig));//make copy. datatables adds properties for backwards compatability reasons, and don't want this cluttering our own


		drawSvgIcons();

		if (!options.enableColumnResizingOnWindowWidth || options.enableColumnResizingOnWindowWidth <= $(window).width()) {
			addEvents();
			//finally, make the columns dragable:
			table.colResizable();
		}
		//and: make sure the height of the resize handlers matches the height of the table header
		var thHeight = table.find('thead').outerHeight();
		$(yasr.resultsContainer).find('.JCLRgrip').height(table.find('thead').outerHeight());

		//move the table upward, so the table options nicely aligns with the yasr header
		var headerHeight = yasr.header.outerHeight(); //do not add some space of 5 px between table and yasr header
		// if (headerHeight > 0) {
		// 	yasr.resultsContainer.find(".dataTables_wrapper")
		// 		.css("position", "relative")
		// 		.css("top", "-" + headerHeight + "px")
		// 		.css("margin-bottom", "-" + headerHeight + "px");

		// 	//and: make sure the height of the resize handlers matches the height of the table header
		// 	$(yasr.resultsContainer).find('.JCLRgrip').css('marginTop', headerHeight + 'px');
		// }
		// Use placeholder instead of label
		var searchFilter = yasr.resultsContainer.find('.dataTables_filter label');
		$(searchFilter.contents().get(0)).remove();
		searchFilter.find('input[type=search]').attr('placeholder', yasr.translate('yasr.table.filter')).addClass('form-control');

		options.highlightLiteralCellResult();
	};

	var drawSvgIcons = function() {
		var sortings = {
			"sorting": "unsorted",
			"sorting_asc": "sortAsc",
			"sorting_desc": "sortDesc"
		};
		table.find(".sortIcons").remove();
		for (var sorting in sortings) {
			var sortIconsDiv = $("<div class='sortIcons'></div>");
			if (sorting == "sorting") {
				sortIconsDiv.append("<a class='fa fa-sort'></a>");
			} else if (sorting == "sorting_asc") {
				sortIconsDiv.append("<a class='fa fa-sort-alpha-asc'></a>");
			} else if (sorting == "sorting_desc") {
				sortIconsDiv.append("<a class='fa fa-sort-alpha-desc'></a>");
			}

			table.find("th." + sorting).append(sortIconsDiv);
		}
	};
	/**
	 * Check whether this plugin can handler the current results
	 *
	 * @property canHandleResults
	 * @type function
	 * @default If resultset contains variables in the resultset, return true
	 */
	plugin.canHandleResults = function(){
		return yasr.results && yasr.results.getVariables && yasr.results.getVariables() && yasr.results.getVariables().length > 0;
	};


	plugin.getDownloadInfo = function() {
		if (!yasr.results) return null;
		return {
			getContent: function(){return require("./bindingsToCsv.js")(yasr.results.getAsJson());},
			filename: "queryResults.csv",
			contentType: "text/csv",
			buttonTitle: yasr.translate('yasr.btn.title.csv')
		};
	};

	var hideOrShowDatatablesControls = function() {
		var show = true;
		var downloadIcon = yasr.container.find('.yasr_downloadIcon');
		var dataTablesFilter = yasr.container.find('.dataTables_filter');
		var downloadPosLeft = downloadIcon.offset().left;
		if (downloadPosLeft > 0) {
			var downloadPosRight = downloadPosLeft + downloadIcon.outerWidth();

			var filterPosLeft = dataTablesFilter.offset().left;
			if (filterPosLeft > 0 && filterPosLeft < downloadPosRight) {
				//overlapping! hide
				show = false;
			}
		}
		if (show) {
			dataTablesFilter.css("visibility", "visible");
		} else {
			dataTablesFilter.css("visibility", "hidden");
		}

	}

	return plugin;
};

var addWorldBreakTagAfterSpecialCharacters = function (text) {
	return text.replace(/([_:/-](?![_:/-]))/g, "$1<wbr>");
};

var addWorldBreakTagBeforeSpecialCharacters = function (text) {
	return text.replace(/(\^\^)/g, "<wbr>$1");
};

var addWordBreakToIRIs = function (text) {
	return addWorldBreakTagAfterSpecialCharacters(text);
}

var addWordBreakToLiterals = function (text) {
	const result = addWorldBreakTagBeforeSpecialCharacters(text);
	return addWorldBreakTagAfterSpecialCharacters(result);
}

var getLang = function (literalBinding, defaultLang) {
	if (literalBinding["xml:lang"]) {
		return literalBinding["xml:lang"];
	}
	if (literalBinding["lang"]) {
		return literalBinding["lang"];
	}
	return defaultLang;
}

var formatLiteral = function(yasr, plugin, literalBinding) {
	var stringRepresentation = utils.escapeHtmlEntities(literalBinding.value);
	if (literalBinding["xml:lang"]) {
		stringRepresentation = '"' + stringRepresentation + '"<sup>@' + literalBinding["xml:lang"] + '</sup>';
	} else if (literalBinding.datatype) {
		var xmlSchemaNs = "http://www.w3.org/2001/XMLSchema#";
		var dataType = literalBinding.datatype;
		if (dataType.indexOf(xmlSchemaNs) === 0) {
			dataType = "xsd:" + dataType.substring(xmlSchemaNs.length);
		} else {
			dataType = "&lt;" + dataType + "&gt;";
		}

		stringRepresentation = '"' + stringRepresentation + '"<sup>^^' + dataType + '</sup>';
	}
	return stringRepresentation;
};
var getCellContent = function(yasr, plugin, bindings, sparqlVar, context) {
	var binding = bindings[sparqlVar];
	var value = null;
	if (binding.type == "uri") {
		var title = null;
		var href = binding.value;
		var visibleString = href;
		if (context.usedPrefixes) {
			for (var prefix in context.usedPrefixes) {
				if (visibleString.indexOf(context.usedPrefixes[prefix]) == 0) {
					visibleString = prefix + ':' + href.substring(context.usedPrefixes[prefix].length);
					break;
				}
			}
		}
		if (plugin.options.mergeLabelsWithUris) {
			var postFix = (typeof plugin.options.mergeLabelsWithUris == "string"? plugin.options.mergeLabelsWithUris: "Label");
			if (bindings[sparqlVar + postFix]) {
				visibleString = formatLiteral(yasr, plugin, bindings[sparqlVar + postFix]);
				title = href;
			}
		}
		value = "<a " + (title? "title='" + href + "' ": "") + "class='uri' target='_blank' href='" + href + "'>" + visibleString + "</a>";
	} else {
		value = "<p class='nonUri' style='border: none; background-color: transparent; padding: 0; margin: 0'>" + formatLiteral(yasr, plugin, binding) + "</p>";
	}
	return "<div>" + value + "</div>";
};

// Custom getCellContent
var getCellContentCustom = function(yasr, plugin, bindings, sparqlVar, context) {
	var binding = bindings[sparqlVar];
	var isShacl = yasr.header.context.ownerDocument.URL.includes("http:%2F%2Frdf4j.org%2Fschema%2Frdf4j%23SHACLShapeGraph");
	return getEntityHTML(binding, context, isShacl, yasr);
};

var getEntityHTML = function(binding, context, isShacl, yasr) {
	var divClass = ""
	var entityHtml = null;
	let copyToClipBoardTranslation = yasr.translate('yasr.copy.to.clipboard');
	if (binding.type === "uri") {
		var title = null;
		var href = binding.value;
		var localHref;
		var visibleString = href;
		if (context.usedPrefixes) {
			var prefixWithLocal = utils.uriToPrefixWithLocalName(context.usedPrefixes, visibleString);
			if (prefixWithLocal) {
                var localName = prefixWithLocal.localName;
				visibleString = prefixWithLocal.prefix + ":" + localName;
			}
		}

        var urlSpace = window.location.origin + '/resource/';
		if (href.indexOf(urlSpace) === 0 && href.length > urlSpace.length) {
            // URI is within our URL space, use it as is
            localHref = href;
        } else {
            // URI is not within our URL space, needs to be passed as parameter
			localHref = "resource?uri=" + encodeURIComponent(href);
		}
		if (isShacl != null && isShacl === true) {
			localHref += ("&context=" + encodeURIComponent("http://rdf4j.org/schema/rdf4j#SHACLShapeGraph"));
		}

        localHref = localHref.replace(/'/g, "&#39;");
        href = href.replace(/'/g, "&#39;");
        entityHtml = "<a title='" + href + "' class='uri' href='" + localHref + "'>" + addWordBreakToIRIs(_.escape(visibleString)) + "</a> " +
		"<a class='fa fa-link share-result' data-clipboard-text='" + href + "' title='" + copyToClipBoardTranslation + "' href='#'></a>";
		divClass = " class = 'uri-cell'";
	} else if (binding.type === "triple") {
		var sEl = getEntityHTML(binding.value['s'], context, isShacl, yasr);
		var pEl = getEntityHTML(binding.value['p'], context, isShacl, yasr);
		var oEl = getEntityHTML(binding.value['o'], context, isShacl, yasr);
		var tripleList = "<ul class='triple-list'><li>" + sEl + "</li><li>" + pEl + "</li><li>" + oEl + "</li></ul>";
		var tripleString = getTripleString(yasr, binding, false);
		var localHref = "resource?triple=" + encodeURIComponent(tripleString).replace(/'/g, "&#39;");
		var title = _.escape(tripleString);
		var openLink = "<a title='" + title + "' class='triple-link' href='" + localHref + "'>" + _.escape("<<") + "</a>";
		var closeLink = "<a title='" + title + "' class='triple-link triple-link-end' href='" + localHref + "'>" + _.escape(">>") + "</a>";
		entityHtml = openLink + tripleList + closeLink + "<a class='fa fa-link share-result' data-clipboard-text='" + tripleString + "' title='" + copyToClipBoardTranslation + "' href='#'></a>";
		divClass = " class = 'triple-cell'";
	} else {
		entityHtml = "<p class='nonUri' style='border: none; background-color: transparent; padding: 0; margin: 0'>" + formatLiteralCustom(yasr, binding, true) + "</p>";
		divClass = " class = 'literal-cell'";
	}
	return `<div ${divClass} lang="${getLang(binding, 'xx')}">${entityHtml}</div>`;
}

var getTripleString = function(yasr, binding, forHtml) {
	if (binding.type === "uri") {
		return "<" + binding.value + ">";
	}
	if (binding.type === "triple") {
		return "<<" + getTripleString(yasr, binding.value['s'], forHtml) + " " + getTripleString(yasr, binding.value['p'], forHtml) + " " + getTripleString(yasr, binding.value['o'], forHtml) + ">>";
	}
	return formatLiteralCustom(yasr, binding, forHtml);
}

var formatLiteralCustom = function(yasr, literalBinding, forHtml) {
	var stringRepresentation = utils.escapeHtmlEntities(literalBinding.value);
	var xmlSchemaNs = "http://www.w3.org/2001/XMLSchema#";
	if ("bnode" === literalBinding.type) {
		return addWordBreakToLiterals("_:" + stringRepresentation);
	} else if (literalBinding["xml:lang"]) {
		stringRepresentation = '"' + stringRepresentation + ((forHtml) ? '"<sup>': '"') + '@' + literalBinding["xml:lang"] + ((forHtml) ? '</sup>': '');
	} else if (literalBinding["lang"]) {
		stringRepresentation = '"' + stringRepresentation + ((forHtml) ? '"<sup>': '"' + '@') + literalBinding["lang"] + ((forHtml) ? '</sup>': '');
	} else if (literalBinding.datatype && !(literalBinding.datatype === xmlSchemaNs + 'string')) {
		var dataType = literalBinding.datatype;
		if (dataType.indexOf(xmlSchemaNs) === 0 && forHtml) {
			dataType = "xsd:" + dataType.substring(xmlSchemaNs.length);
		} else if (forHtml) {
			dataType = "&lt;" + dataType + "&gt;";
		} else {
			dataType = "<" + dataType + ">";
		}

		stringRepresentation = '"' + stringRepresentation + ((forHtml) ? '"<sup>': '"') + '^^' + dataType + ((forHtml) ? '</sup>': '');
	}
	let customLiteral = (stringRepresentation.indexOf('"') === 0) ? stringRepresentation : '"' + stringRepresentation + '"';
	return addWordBreakToLiterals(customLiteral);
};



var addPrefLabel = function(td) {
	var addEmptyTitle = function() {
		td.attr("title","");//this avoids trying to fetch the label again on next hover
	};
	$.get("http://preflabel.org/api/v1/label/" + encodeURIComponent(td.text()) + "?silent=true")
		.success(function(data) {
			if (typeof data == "object" && data.label) {
				td.attr("title", data.label);
			} else if (typeof data == "string" && data.length > 0 ) {
				td.attr("title", data);
			} else {
				addEmptyTitle();
			}

		})
		.fail(addEmptyTitle);
};

var openCellUriInNewWindow = function(cell) {
	if (cell.className.indexOf("uri") >= 0) {
		window.open(this.innerHTML);
	}
};

/**
 * Defaults for table plugin
 *
 * @type object
 * @attribute YASR.plugins.table.defaults
 */
root.defaults = {

	/**
	 * Draw the cell content, from a given binding
	 *
	 * @property drawCellContent
	 * @param binding {object}
	 * @type function
	 * @return string
	 * @default YASR.plugins.table.getFormattedValueFromBinding
	 */
	getCellContent: getCellContentCustom,

	highlightLiteralCellResult: function () {},

	persistency: {
		tableLength: "tableLength",
	},

	getColumns: function(yasr, plugin) {
		var includeVariable = function(variableToCheck) {
			if (!plugin.options.mergeLabelsWithUris) return true;
			var postFix = (typeof plugin.options.mergeLabelsWithUris == "string"? plugin.options.mergeLabelsWithUris: "Label");
			if (variableToCheck.indexOf(postFix, variableToCheck.length - postFix.length) !== -1) {
				//this one ends with a postfix
				if (yasr.results.getVariables().indexOf(variableToCheck.substring(0, variableToCheck.length - postFix.length)) >= 0) {
					//we have a shorter version of this variable. So, do not include the ..<postfix> variable in the table
					return false;
				}
			}
			return true;
		};

		var cols = [];
		cols.push({"title": ""});//row numbers column
		yasr.results.getVariables().forEach(function(variable) {
			var headerLabel = yasr.options.translateHeaders ? yasr.translate('yasr.headers.labels.' + variable) : variable;
			cols.push({"title": "<span>" + headerLabel + "</span>", "visible": includeVariable(variable)});
		});
		return cols;
	},
	/**
	 * Try to fetch the label representation for each URI, using the preflabel.org services. (fetching occurs when hovering over the cell)
	 *
	 * @property fetchTitlesFromPreflabel
	 * @type boolean
	 * @default true
	 */
	fetchTitlesFromPreflabel: true,

	mergeLabelsWithUris: false,
	/**
	 * Set a number of handlers for the table
	 *
	 * @property handlers
	 * @type object
	 */
	callbacks: {
		/**
		 * Mouse-enter-cell event
		 *
		 * @property handlers.onCellMouseEnter
		 * @type function
		 * @param td-element
		 * @default null
		 */
		onCellMouseEnter: null,
		/**
		 * Mouse-leave-cell event
		 *
		 * @property handlers.onCellMouseLeave
		 * @type function
		 * @param td-element
		 * @default null
		 */
		onCellMouseLeave: null,
		/**
		 * Cell clicked event
		 *
		 * @property handlers.onCellClick
		 * @type function
		 * @param td-element
		 * @default null
		 */
		onCellClick: null
	},
	/**
	 * This plugin uses the datatables jquery plugin (See datatables.net). For any datatables specific defaults, change this object.
	 * See the datatables reference for more information
	 *
	 * @property datatable
	 * @type object
	 */
	datatable: {
		"paginate": false,
		"info": false,
		"autoWidth": false,
		"order": [],//disable initial sorting
		"pageLength": 50,//default page length
    	"lengthMenu": [[10, 50, 100, 1000, -1], [10, 50, 100, 1000, "All"]],//possible page lengths
    	"lengthChange": true,//allow changing page length
        "drawCallback": function ( oSettings ) {
        	//trick to show row numbers
        	for ( var i = 0; i < oSettings.aiDisplay.length; i++) {
				$('td:eq(0)',oSettings.aoData[oSettings.aiDisplay[i]].nTr).html(i + 1);
			}

        	//Hide pagination when we have a single page
        	var activePaginateButton = false;
        	$(oSettings.nTableWrapper).find(".paginate_button").each(function() {
        		if ($(this).attr("class").indexOf("current") == -1 && $(this).attr("class").indexOf("disabled") == -1) {
        			activePaginateButton = true;
        		}
        	});
        	if (activePaginateButton) {
        		$(oSettings.nTableWrapper).find(".dataTables_paginate").show();
        	} else {
        		$(oSettings.nTableWrapper).find(".dataTables_paginate").hide();
        	}
		},
		"columnDefs": [
			{ "width": "32px", "orderable": false, "targets": 0  }//disable row sorting for first col
		],
	},
};
root.version = {
	"YASR-table" : require("../package.json").version,
	"jquery": $.fn.jquery,
	"jquery-datatables": $.fn.DataTable.version
};

