'use strict';
var $ = require("jquery");

/**
 * Constructor of plugin which displays boolean info
 * 
 * @param yasr {object}
 * @param parent {DOM element}
 * @param options {object}
 * @class YASR.plugins.boolean
 * @return yasr-boolean (doc)
 * 
 */
var root = module.exports = function(yasr) {
    // load and register the translation service providing the locale config
    yasr.translate = require('./translate.js')(yasr.options.locale);

	var container = $("<div class='booleanBootResult'></div>");
	var draw = function() {
		container.empty().appendTo(yasr.resultsContainer);
		var booleanVal = yasr.results.getBoolean();
		
		var alert = null;
		if (booleanVal === true) {
			alert = $("<div class='boolRes alert alert-success no-icon'><span class='boolResTex'>" + yasr.translate('yasr.boolean.alert.yes') + "</span></div>");
		} else if (booleanVal === false) {
			alert = $("<div class='boolRes alert alert-danger no-icon'><span class='boolResTex'>" + yasr.translate('yasr.boolean.alert.no') + "</span></div>");
		} else {
			container.width("140");
			textVal = yasr.translate('yasr.boolean.no_boolean');
		}
			
		alert.appendTo(container);
	};
	

	var canHandleResults = function(){return yasr.results.getBoolean && (yasr.results.getBoolean() === true || yasr.results.getBoolean() == false);};

	
	
	return {
		name: null,//don't need to set this: we don't show it in the selection widget anyway, so don't need a human-friendly name
		draw: draw,
		hideFromSelection: true,
		getPriority: 3,
		canHandleResults: canHandleResults
	}
};


root.version = {
	"YASR-boolean" : require("../package.json").version,
	"jquery": $.fn.jquery,
};

