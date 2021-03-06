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
	var container = $("<div class='booleanBootResult'></div>");
	var draw = function() {
		container.empty().appendTo(yasr.resultsContainer);
		var booleanVal = yasr.results.getBoolean();
		
		var alert = null;
		if (booleanVal === true) {
			alert = $("<div class='boolRes alert alert-success no-icon'><span class='boolResTex'>YES</span></div>");
		} else if (booleanVal === false) {
			alert = $("<div class='boolRes alert alert-danger no-icon'><span class='boolResTex'>NO</span></div>");
		} else {
			container.width("140");
			textVal = "Could not find boolean value in response";
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

